use chrono::{NaiveDateTime, Utc};
use diesel::prelude::*;
use diesel::result::Error;

use crate::models::task::Task;

use super::task_error::TaskError;

/// Parses and validates the `created_at` date.
pub fn parse_and_validate_created_at(
    created_at: Option<String>,
) -> Result<NaiveDateTime, TaskError> {
    // If no date is provided, use the current UTC time.
    let parsed_date = match created_at {
        Some(date_str) => {
            NaiveDateTime::parse_from_str(
                &format!("{} 00:00:00", date_str),
                "%d-%m-%Y %H:%M:%S",
            )
            .map_err(|_| TaskError {
                message: format!(
                    "Invalid 'created_at' format: '{}' is not in the expected format 'DD-MM-YYYY'.",
                    date_str
                ),
            })?
        }
        None => Utc::now().naive_utc(), // Default value only if no date is provided
    };

    // Check if the date is in the future
    if parsed_date > Utc::now().naive_utc() {
        return Err(TaskError {
            message: format!(
                "Invalid 'created_at': {} is in the future. Please provide a valid past or present date.",
                parsed_date
            ),
        });
    }

    Ok(parsed_date)
}


/// Parses and validates the `due_date`.
pub fn parse_and_validate_due_date(due_date: Option<String>) -> Result<Option<NaiveDateTime>, TaskError> {
    if let Some(date_str) = due_date {
        let parsed_date = NaiveDateTime::parse_from_str(
            &format!("{} 00:00:00", date_str),
            "%d-%m-%Y %H:%M:%S",
        )
        .map_err(|_| TaskError {
            message: format!(
                "Invalid 'due_date': '{}' is not in the expected format 'DD-MM-YYYY'.",
                date_str
            ),
        })?;

        if parsed_date < Utc::now().naive_utc() {
            return Err(TaskError {
                message: format!(
                    "Invalid 'due_date': {} is in the past. Please provide a future date.",
                    parsed_date
                ),
            });
        }

        Ok(Some(parsed_date))
    } else {
        Ok(None) // No `due_date` provided
    }
}


pub(crate) fn validate_task_ownership(
    conn: &mut PgConnection,
    task_id: i32,
    user_id: i32,
) -> Result<Task, Error> {
    let task = crate::schema::tasks::table
        .filter(crate::schema::tasks::id.eq(task_id))
        .filter(crate::schema::tasks::user_id.eq(user_id)) // Ensure the user owns the task
        .first::<Task>(conn)?;

    Ok(task)
}

pub(crate) fn validate_user_project_access(
    conn: &mut PgConnection,
    user_id: i32,
    project_id: i32,
) -> Result<crate::models::project::Project, Error> {
    let project = crate::schema::projects::table
        .filter(crate::schema::projects::id.eq(project_id))
        .filter(crate::schema::projects::user_id.eq(user_id))
        .first::<crate::models::project::Project>(conn)?;

    Ok(project)
}