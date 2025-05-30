use crate::auth::error::AuthError;
use crate::database::error::DatabaseError;
use crate::search::error::ReqError;
use actix_web::ResponseError;
use reqwest::Error as ReqwestError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Database error occurred")]
    DatabaseApiError(#[from] DatabaseError),
    #[error("You are not authorized to perform this action")]
    AuthorizationError(#[from] AuthError),
    #[error("External Request error occurred")]
    ReqwestError(#[from] ReqError),
}

impl ResponseError for ApiError {
    fn status_code(&self) -> actix_web::http::StatusCode {
        match *self {
            ApiError::DatabaseApiError(ref err) => err.status_code(),
            ApiError::AuthorizationError(ref err) => err.status_code(),
            ApiError::ReqwestError(ref err) => err.status_code(),
        }
    }

    fn error_response(&self) -> actix_web::HttpResponse {
        match *self {
            ApiError::DatabaseApiError(ref err) => err.error_response(),
            ApiError::AuthorizationError(ref err) => err.error_response(),
            ApiError::ReqwestError(ref err) => err.error_response(),
        }
    }
}

impl From<DatabaseError> for AuthError {
    fn from(value: DatabaseError) -> Self {
        AuthError::InvalidCredentials
    }
}

impl From<actix_web::Error> for ApiError {
    fn from(value: actix_web::Error) -> Self {
        ApiError::AuthorizationError(AuthError::InvalidCredentials)
    }
}

impl From<actix_web::Error> for ReqError {
    fn from(err: actix_web::Error) -> Self {
        ReqError::RequestError
    }
}

impl From<ReqwestError> for ReqError {
    fn from(value: ReqwestError) -> Self {
        ReqError::RequestError
    }
}