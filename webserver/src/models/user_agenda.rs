use chrono::{NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use diesel::{Queryable, Selectable, Insertable, Associations, Identifiable};
use crate::database::error::DatabaseError;
use crate::schema::meetings;
use crate::models::user::User;
use crate::tasks::error::ValidationError;

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Associations, Identifiable, PartialEq)]
#[diesel(table_name = meetings)]
#[belongs_to(User)]
pub struct Meeting {
    pub id: i32,
    pub user_id: i32,
    pub start_date: NaiveDateTime,
    pub end_date: NaiveDateTime,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = meetings)]
pub struct NewMeeting {
    pub user_id: i32,
    pub start_date: NaiveDateTime,
    pub end_date: NaiveDateTime,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MeetingResponse {
    pub id: i32,
    pub user_id: i32,
    pub start_date: NaiveDateTime,
    pub end_date: NaiveDateTime,
    pub duration: i64, // duration in seconds
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl From<Meeting> for MeetingResponse {
    fn from(meeting: Meeting) -> Self {
        Self {
            id: meeting.id,
            user_id: meeting.user_id,
            start_date: meeting.start_date,
            end_date: meeting.end_date,
            duration: (meeting.end_date - meeting.start_date).num_minutes(), // duration in mins
            created_at: meeting.created_at,
            updated_at: meeting.updated_at,
        }
    }
} 


use thiserror::Error;

#[derive(Debug, Error)]
pub enum MeetingsError {
    #[error("Start date cannot be in the past")]
    InvalidStartDate,
    #[error("End date cannot be in the past")]
    InvalidEndDate,
    #[error("End date must be after start date")]
    InvalidDateRange,
}
impl From<MeetingsError> for DatabaseError {
    fn from(err: MeetingsError) -> Self {
        match err {
            MeetingsError::InvalidStartDate => DatabaseError::DataValidationError(ValidationError{ message: ("Start date cannot be in the past".to_owned())}),
            MeetingsError::InvalidEndDate => DatabaseError::DataValidationError(ValidationError {message:("End date cannot be in the past".to_owned())}),
            MeetingsError::InvalidDateRange => DatabaseError::DataValidationError(ValidationError{message:("End date must be after start date".to_owned())}),
        }
    }
}

pub fn validate_meeting_dates(
    start_date: NaiveDateTime,
    end_date: NaiveDateTime,
) -> Result<(), MeetingsError> {
    let now = Utc::now().naive_utc();

    if start_date < now {
        return Err(MeetingsError::InvalidStartDate);
    }

    if end_date < now {
        return Err(MeetingsError::InvalidEndDate);
    }

    if end_date <= start_date {
        return Err(MeetingsError::InvalidDateRange);
    }

    Ok(())
}