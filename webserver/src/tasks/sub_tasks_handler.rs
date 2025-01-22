use actix_web::{delete, get, patch, post, web, HttpResponse, Responder, ResponseError};

use diesel::PgConnection;
use serde::{Deserialize, Serialize};

use crate::handlers::error::ApiError;
use crate::models::user::UserSub;
use crate::run_async_query;
use crate::services::user_service::get_user_id_by_email;
use crate::tasks::sub_tasks_service;
use crate::{auth::auth_middleware, db::DbPool};
use super::enums::{Priority, Progress};


#[derive(Serialize, Deserialize)]
pub struct CreateSubTaskRequest {
    task_id:i32,
    title:String,
    description: String,
    created_at:Option<String>,
    due_date: Option<String>,
    priority: Priority,
    progress: Progress,
    assigned_users: Option<Vec<i32>>, 

}

pub fn sub_task_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/subtasks")
            .wrap(auth_middleware::Auth)
            .service(create_subtask)
            .service(get_sub_tasks)
            .service(get_sub_tasks_with_assignees)
            
    );
}

#[post("")]
pub async fn create_subtask(
    pool: web::Data<DbPool>,
    subtask: web::Json<CreateSubTaskRequest>,
    user_sub: UserSub,
) -> Result<impl Responder, ApiError> {

    let create_subtask = run_async_query!(pool, |conn: &mut PgConnection| {

        let user_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;


        sub_tasks_service::create_subtask(
            conn,
            subtask.task_id,
            &subtask.title,
            &subtask.description,
            subtask.created_at.clone(),
            subtask.due_date.clone(),
            subtask.priority,
            subtask.progress,
            user_id,
            subtask.assigned_users.clone()
        )
        .map_err(DatabaseError::from)
    })?;

    Ok::<HttpResponse, ApiError>(HttpResponse::Created().json(create_subtask))
}

#[get("")]
pub async fn get_sub_tasks(
    pool: web::Data<DbPool>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    let sub_tasks = run_async_query!(pool, |conn: &mut diesel::PgConnection| {
        // Get the user ID by their email from the logged-in user
        let users_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;

        // Retrieve the subtasks created by the user
        sub_tasks_service::get_sub_tasks(conn, users_id).map_err(DatabaseError::from)
    })?;

    Ok::<HttpResponse, ApiError>(HttpResponse::Ok().json(sub_tasks))
}

#[get("/{task_id}")]
pub async fn get_sub_tasks_with_assignees(
    pool: web::Data<DbPool>,
    id: web::Path<i32>,
    user_sub: UserSub,
) -> Result<impl Responder, ApiError> {
    let task = run_async_query!(pool, |conn: &mut diesel::PgConnection| {
        get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        sub_tasks_service::get_sub_tasks_with_assignees(conn, id.into_inner()).map_err(DatabaseError::from)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::Ok().json(task))
}

