use actix_web::{web, HttpResponse, Responder};
use diesel::prelude::*;
use serde::Deserialize;

use crate::models::project::{Project, ProjectResponse};
use crate::models::task::{Progress, Task, TaskResponse};
use crate::schema::tasks::dsl::*;
use crate::schema::projects::dsl::*;
use crate::DbPool;
use crate::models::task_assignees::TaskAssignee;
use crate::schema::task_assignees::dsl as task_assignees_dsl;
use crate::services::task_service;

#[derive(Deserialize)]
pub struct TaskFilter {
    pub progress: Option<String>,
}

pub struct AssignedTaskResponse {
    pub task: TaskResponse,
    pub assignees: Vec<User>,
}

pub async fn get_project(pool: web::Data<DbPool>, user_id: web::Path<i32>) -> impl Responder {
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => {
            return HttpResponse::InternalServerError().body("Failed to get database connection");
        }
    };

    let result = web::block(move || {
        projects
            .filter(user_id.eq(*user_id)) // Fetch project for the specific user
            .order(created_at.desc())    // Assume the most recent project is the active one
            .first::<Project>(&conn)
            .map_err(|e| e.to_string())
    })
    .await;

    match result {
        Ok(Ok(project)) => HttpResponse::Ok().json(ProjectResponse::from(project)),
        Ok(Err(err)) => HttpResponse::InternalServerError().body(err),
        Err(_) => HttpResponse::InternalServerError().body("Failed to fetch project"),
    }
}

pub async fn get_activities(pool: web::Data<DbPool>, user_id: web::Path<i32>) -> impl Responder {
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => {
            return HttpResponse::InternalServerError().body("Failed to get database connection");
        }
    };

    let result = web::block(move || task_service::get_tasks(&mut conn, &user_id)).await;

    match result {
        Ok(Ok(tasks)) => {
            let task_responses: Vec<TaskResponse> = tasks.into_iter().map(TaskResponse::from).collect();
            HttpResponse::Ok().json(task_responses)
        }
        Ok(Err(err)) => HttpResponse::InternalServerError().body(err.to_string()),
        Err(_) => HttpResponse::InternalServerError().body("Failed to fetch activities"),
    }
}

pub async fn get_tasks_and_progress(pool: web::Data<DbPool>, filter: web::Query<TaskFilter>) -> impl Responder {
    let progress_filter = filter.progress.clone();

    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => {
            return HttpResponse::InternalServerError().body("Failed to get database connection");
        }
    };

    let result = web::block(move || {
        let mut query = tasks.into_boxed();

        if let Some(progress_str) = progress_filter {
            if let Ok(progress_enum) = match_progress(&progress_str) {
                query = query.filter(progress.eq(progress_enum));
            } else {
                return Err("Invalid progress filter".to_string());
            }
        }

        query.load::<Task>(&conn).map_err(|e| e.to_string())
    })
    .await;

    match result {
        Ok(Ok(tasks)) => {
            let task_responses: Vec<TaskResponse> = tasks.into_iter().map(TaskResponse::from).collect();
            HttpResponse::Ok().json(task_responses)
        }
        Ok(Err(err)) => HttpResponse::InternalServerError().body(err),
        Err(_) => HttpResponse::InternalServerError().body("Failed to fetch tasks"),
    }
}

fn match_progress(progress: &str) -> Result<Progress, ()> {
    match progress {
        "to_do" => Ok(Progress::ToDo),
        "in_progress" => Ok(Progress::InProgress),
        "completed" => Ok(Progress::Completed),
        _ => Err(()),
    }
}

pub async fn get_assigned_tasks(pool: web::Data<DbPool>) -> impl Responder {
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => {
            return HttpResponse::InternalServerError().body("Failed to get database connection");
        }
    };

    let result = web::block(move || {
        // Fetch tasks and their associated users through task_assignees
        let task_with_assignees: Vec<(Task, Vec<User>)> = task_assignees_dsl::task_assignees
            .inner_join(tasks)
            .inner_join(users)
            .select((Task::as_returning(), User::as_returning()))
            .load::<(Task, User)>(&conn)?
            .into_iter()
            .fold(
                std::collections::HashMap::new(),
                |mut acc, (task, user)| {
                    acc.entry(task)
                        .or_insert_with(Vec::new)
                        .push(user);
                    acc
                },
            )
            .into_iter()
            .map(|(task, users)| (task, users))
            .collect();

        Ok::<Vec<AssignedTaskResponse>, diesel::result::Error>(
            task_with_assignees
                .into_iter()
                .map(|(task, assignees)| AssignedTaskResponse {
                    task: TaskResponse::from(task),
                    assignees,
                })
                .collect(),
        )
    })
    .await;

    match result {
        Ok(Ok(assigned_tasks)) => HttpResponse::Ok().json(assigned_tasks),
        Ok(Err(err)) => HttpResponse::InternalServerError().body(format!("Error: {}", err)),
        Err(_) => HttpResponse::InternalServerError().body("Failed to fetch assigned tasks"),
    }
}

pub fn home_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("/home/{user_id}")
            .route(web::get().to(get_project))
    );
    cfg.service(
        web::resource("/home/mywork")
            .route(web::get().to(get_tasks_and_progress))
    );
    cfg.service(
        web::resource("/home/assigned")
            .route(web::get().to(get_assigned_tasks))
    );
    cfg.service(
        web::resource("/home/activities")
            .route(web::get().to(get_activities))
    );
}