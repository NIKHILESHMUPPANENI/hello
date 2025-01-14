use actix_service::boxed::service;
use actix_web::{get, patch, post, web, HttpResponse, Responder, ResponseError};

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use crate::database::error::DatabaseError;
use crate::handlers::error::ApiError;
use crate::models::task::{Priority, Progress, Task};
use crate::models::task_assignee::TaskWithAssignedUsers;
use crate::models::user::UserSub;
use crate::run_async_query;
use crate::schema::task_assignees;
use crate::schema::tasks::dsl::tasks;
use crate::services::task_service;
use crate::services::user_service::get_user_id_by_email;
use crate::{auth::auth_middleware, db::DbPool};

#[derive(Serialize, Deserialize)]
pub struct CreateTaskRequest {
    description: String,
    reward: i64,
    project_id: i32,
    title:String,
    due_date: Option<String>,
}
#[derive(Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub description: Option<String>,
    pub reward: Option<i64>,
    pub completed: Option<bool>,
    pub title: Option<String>,
    pub progress: Option<Progress>,
    pub priority: Option<Priority>,
    pub due_date: Option<String>, 
    pub assigned_users: Option<Vec<i32>>, 
}


pub fn task_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/tasks")
            .wrap(auth_middleware::Auth)
            .service(get_tasks)
            .service(get_task_by_id)
            .service(get_tasks)
            .service(create_task)
            .service(update_task),
    );
}

#[post("")]
pub async fn create_task(
    pool: web::Data<DbPool>,
    task: web::Json<CreateTaskRequest>,
    user_sub:UserSub
) -> Result<impl Responder, impl ResponseError> {
    let create_task = run_async_query!(pool, |conn: &mut diesel::PgConnection| {
        // Use the service method to get user ID
        let user_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        
        task_service::create_task(
            conn, 
            &task.description, 
            task.reward, 
            task.project_id,
            user_id,
            &task.title,
            task.due_date.clone()
        ).map_err(DatabaseError::from)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::Created().json(create_task))
}

#[get("")]
pub async fn get_tasks(
    pool: web::Data<DbPool>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    let ta = run_async_query!(pool, |conn: &mut diesel::PgConnection| {
        // First, get the user ID by email
        let users_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        // Then, retrieve tasks using the user ID
        task_service::get_tasks(conn, &users_id).map_err(DatabaseError::from)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::Ok().json(ta))
}

#[get("/{id}")]
pub async fn get_task_by_id(
    pool: web::Data<DbPool>,
    id: web::Path<i32>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    let task = run_async_query!(pool, |conn: &mut diesel::PgConnection| {
        let users_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        task_service::get_task_by_id(conn, id.into_inner(), &users_id).map_err(DatabaseError::from)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::Ok().json(task))
}

#[patch("/{id}")]
pub async fn update_task(
    pool: web::Data<DbPool>,
    id: web::Path<i32>,
    task_update: web::Json<UpdateTaskRequest>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    let updated_task = run_async_query!(pool, |conn: &mut diesel::PgConnection| {
        let user_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;

        // Update the task and assigned users
        let task_with_users = task_service::update_task(
            conn,
            id.into_inner(),
            &user_id,
            task_update.description.as_deref(),
            task_update.reward,
            task_update.completed,
            task_update.title.as_deref(),
            task_update.progress,
            task_update.priority,
            task_update.due_date.clone(),
            task_update.assigned_users.clone(),
        )
        .map_err(DatabaseError::from)?;

        Ok::<TaskWithAssignedUsers, DatabaseError>(task_with_users)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::Ok().json(updated_task))
}


#[cfg(test)]
mod tests {
    use crate::database::db;
    use crate::database::test_db::TestDb;
    use crate::handlers::auth_handler::{auth_routes, login, LoginRequest};
    use crate::services::project_service::create_project;
    use crate::services::user_service;
    use crate::services::user_service::register_user;
    use actix_web::http::StatusCode;
    use actix_web::{test, App};

    use super::*;

    #[actix_rt::test]
    async fn create_task_wrong_project_id() {
        let db = TestDb::new();
        let pool = db::establish_connection(&db.url());
        dotenv::dotenv().ok();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(pool.clone()))
                .configure(auth_routes)
                .configure(task_routes),
        )
        .await;

        let description = "test task";
        let reward = 100;
        let title = "Task title";
        let due_date = None;


        let user = register_user(
            &mut db.conn(),
            "test user",
            "testpassword",
            "test@email.com",
        )
        .expect("Failed to register user");

        let log_req = test::TestRequest::post()
            .uri("/auth/login")
            .set_json(&LoginRequest {
                email: "test@email.com".to_string(),
                password: "testpassword".to_string(),
            })
            .to_request();

        let log_resp = test::call_service(&app, log_req).await;

        assert_eq!(log_resp.status(), StatusCode::OK);

        let auth_header = log_resp
            .headers()
            .get("Authorization")
            .expect("No authorization header")
            .to_str()
            .expect("Failed to convert header to string");

        let req = test::TestRequest::post()
            .uri("/tasks")
            .append_header(("Authorization", auth_header))
            .set_json(&CreateTaskRequest {
                description: description.to_string(),
                reward,
                project_id: 1,
                title: title.to_string(),
                due_date
            })
            .to_request();

        let resp = test::call_service(&app, req).await;

        assert_eq!(resp.status(), StatusCode::CONFLICT);
    }

    #[actix_rt::test]
    async fn test_create_task_success() {
        let db = TestDb::new();
        let pool = db::establish_connection(&db.url());
        dotenv::dotenv().ok();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(pool.clone()))
                .configure(auth_routes)
                .configure(task_routes),
        )
        .await;

        let description = "test task";
        let reward = 100;
        let title = "Task title";
        let due_date = Some("25-12-2024".to_string());

        let user = register_user(
            &mut db.conn(),
            "test user",
            "testpassword",
            "test@email.com",
        )
        .expect("Failed to register user");
        let project = create_project(
            &mut db.conn(),
            "test project",
            "test project description",
            &user.id,
        )
        .expect("Failed to create project");

        println!("User: {:?}", user);
        let log_req = test::TestRequest::post()
            .uri("/auth/login")
            .set_json(&LoginRequest {
                email: "test@email.com".to_string(),
                password: "testpassword".to_string(),
            })
            .to_request();

        let log_resp = test::call_service(&app, log_req).await;

        assert_eq!(log_resp.status(), StatusCode::OK);

        let auth_header = log_resp
            .headers()
            .get("Authorization")
            .expect("No authorization header")
            .to_str()
            .expect("Failed to convert header to string");

        let req = test::TestRequest::post()
            .uri("/tasks")
            .append_header(("Authorization", auth_header))
            .set_json(&CreateTaskRequest {
                description: description.to_string(),
                reward,
                project_id: project.id,
                title: title.to_string(),
                due_date,
            })
            .to_request();

        let resp = test::call_service(&app, req).await;

        assert_eq!(resp.status(), StatusCode::CREATED);
    }
}
