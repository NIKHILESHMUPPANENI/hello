use chrono::{NaiveDateTime, Utc};
use diesel::prelude::*;

use crate::database::error::DatabaseError;
use crate::models::task::Task;
use crate::models::task_accsses::TaskAccess;

use super::task_error::TaskError;

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
) -> Result<Task, DatabaseError> {
    use crate::schema::{task_access::dsl as task_access_dsl, tasks::dsl as tasks_dsl};

    // First, check if the user is the owner of the task
    let task = tasks_dsl::tasks
        .filter(tasks_dsl::id.eq(task_id))
        .filter(tasks_dsl::user_id.eq(user_id))
        .first::<Task>(conn)
        .optional()?;

    // If the task exists and the user is the owner, return the task
    if let Some(task) = task {
        return Ok(task);
    }

    // If the user is not the creator, check if the user has explicit access
    let has_access = task_access_dsl::task_access
        .filter(task_access_dsl::task_id.eq(task_id))
        .filter(task_access_dsl::user_id.eq(user_id))
        .first::<TaskAccess>(conn)
        .optional()?;

    // If the user has access, return the task
    if has_access.is_some() {
        let task = tasks_dsl::tasks
            .find(task_id)
            .first::<Task>(conn)?;

        return Ok(task);
    }

    // If neither the user is the owner nor has access, return an error
    Err(DatabaseError::PermissionDenied)
}


pub(crate) fn validate_user_project_access(
    conn: &mut PgConnection,
    user_id: i32,
    project_id: i32,
) -> Result<crate::models::project::Project, DatabaseError> {
    use crate::schema::{task_access::dsl as task_access_dsl, tasks::dsl as tasks_dsl, projects::dsl as projects_dsl};

    // Check if the user is the creator of the project
    let project = projects_dsl::projects
        .filter(projects_dsl::id.eq(project_id))
        .filter(projects_dsl::user_id.eq(user_id))
        .first::<crate::models::project::Project>(conn)
        .optional()?;

    // If the project exists and the user is the creator, return the project
    if let Some(project) = project {
        return Ok(project);
    }

    // Check if the user has access to any task in the project
    // We need to check if the user has access to tasks in the project
    let has_access = task_access_dsl::task_access
        .inner_join(tasks_dsl::tasks.on(tasks_dsl::id.eq(task_access_dsl::task_id)))
        .filter(tasks_dsl::project_id.eq(project_id))  // Ensure the task belongs to the project
        .filter(task_access_dsl::user_id.eq(user_id))  // Ensure the user has explicit access to the task
        .select(task_access_dsl::task_id)  // Only select the task_id, no need to load full TaskAccess
        .first::<i32>(conn)
        .optional()?;  // Expecting an optional result of task_id

    // If the user has access to any task in the project, return the project
    if let Some(_) = has_access {
        let project = projects_dsl::projects
            .find(project_id)
            .first::<crate::models::project::Project>(conn)?;

        return Ok(project);
    }

    // If the user is neither the creator nor has access to tasks in the project, return an error
    Err(DatabaseError::PermissionDenied)
}
