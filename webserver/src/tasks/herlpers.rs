use chrono::{NaiveDateTime, Utc};

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