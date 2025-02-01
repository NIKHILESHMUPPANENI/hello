use actix_web::{delete, get, patch, post, web, HttpResponse, Responder, ResponseError};
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::auth::auth_middleware;
use crate::database::db::DbPool;
use crate::handlers::error::ApiError;
use crate::{models::user::UserSub, run_async_query, services::user_service::get_user_id_by_email};
use crate::services::user_agenda_service;

pub fn meeting_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/meetings")
        .wrap(auth_middleware::Auth)
            .service(create_meeting)
            .service(get_meetings)
            .service(get_meeting_by_id)
            .service(update_meeting)
            .service(delete_meeting),
    );
}

use serde::{self,  Deserializer};

#[derive(Serialize, Deserialize)]
pub struct CreateMeetingRequest {
    #[serde(deserialize_with = "deserialize_naive_datetime")]
    pub start_date: NaiveDateTime,
    #[serde(deserialize_with = "deserialize_naive_datetime")]
    pub end_date: NaiveDateTime,
}

#[derive(Serialize, Deserialize)]
pub struct UpdateMeetingRequest {
    #[serde(deserialize_with = "deserialize_optional_naive_datetime")]
    pub start_date: Option<NaiveDateTime>,
    #[serde(deserialize_with = "deserialize_optional_naive_datetime")]
    pub end_date: Option<NaiveDateTime>,
}
fn deserialize_naive_datetime<'de, D>(deserializer: D) -> Result<NaiveDateTime, D::Error>
where
    D: Deserializer<'de>,
{
    let date_str = String::deserialize(deserializer)?;

    if let Ok(dt) = NaiveDateTime::parse_from_str(&date_str, "%d-%m-%Y %H:%M") {
        return Ok(dt);
    }

    Err(serde::de::Error::custom(
        "Invalid date format. Expected format:'dd-mm-yyyy hh:mm'",
    ))
}
fn deserialize_optional_naive_datetime<'de, D>(deserializer: D) -> Result<Option<NaiveDateTime>, D::Error>
where
    D: Deserializer<'de>,
{
    // Deserialize the optional string
    let date_str: Option<String> = Option::deserialize(deserializer)?;

    if let Some(date_str) = date_str {
        let dt = NaiveDateTime::parse_from_str(&date_str, "%d-%m-%Y %H:%M")
            .map_err(|_| {
                // Custom error message for invalid format
                serde::de::Error::custom(
                    "Invalid date format. Expected format: 'dd-mm-yyyy hh:mm'",
                )
            })?;
        return Ok(Some(dt));
    }

    Ok(None)
}


#[post("")]
pub async fn create_meeting(
    pool: web::Data<DbPool>,
    meeting: web::Json<CreateMeetingRequest>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    let created_meeting = run_async_query!(pool, |conn: &mut PgConnection| {
        let user_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        
        user_agenda_service::create_meeting(
            conn,
            user_id,
            meeting.start_date,
            meeting.end_date,
        ).map_err(DatabaseError::from)
    })?;
    
    Ok::<HttpResponse, ApiError>(HttpResponse::Created().json(created_meeting))
}


#[get("")]
pub async fn get_meetings(
    pool: web::Data<DbPool>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    let meetings = run_async_query!(pool, |conn: &mut PgConnection| {
        let user_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        user_agenda_service::get_meetings_by_user(conn, user_id)
            .map_err(DatabaseError::from)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::Ok().json(meetings))
}


#[get("/{id}")]
pub async fn get_meeting_by_id(
    pool: web::Data<DbPool>,
    id: web::Path<i32>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    let meeting = run_async_query!(pool, |conn: &mut PgConnection| {
        let user_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        user_agenda_service::get_meeting_by_id(conn, id.into_inner(), user_id)
            .map_err(DatabaseError::from)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::Ok().json(meeting))
}

#[patch("/{id}")]
pub async fn update_meeting(
    pool: web::Data<DbPool>,
    id: web::Path<i32>,
    meeting_update: web::Json<UpdateMeetingRequest>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    let meeting = run_async_query!(pool, |conn: &mut PgConnection| {
        let user_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        user_agenda_service::update_meeting(
            conn,
            id.into_inner(),
            user_id,
            meeting_update.start_date,
            meeting_update.end_date,
        ).map_err(DatabaseError::from)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::Ok().json(meeting))
}

#[delete("/{id}")]
pub async fn delete_meeting(
    pool: web::Data<DbPool>,
    id: web::Path<i32>,
    user_sub: UserSub,
) -> Result<impl Responder, impl ResponseError> {
    run_async_query!(pool, |conn: &mut PgConnection| {
        let user_id = get_user_id_by_email(&user_sub.0, conn).map_err(DatabaseError::from)?;
        user_agenda_service::delete_meeting(conn, id.into_inner(), user_id)
            .map_err(DatabaseError::from)
    })?;
    Ok::<HttpResponse, ApiError>(HttpResponse::NoContent().finish())
}
