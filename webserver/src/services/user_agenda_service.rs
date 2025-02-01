use diesel::prelude::*;
use chrono::{NaiveDateTime, Utc};
use crate::database::error::DatabaseError;
use crate::models::user_agenda::{validate_meeting_dates, Meeting, MeetingResponse, NewMeeting};
use crate::schema::meetings::dsl::*;
use diesel::result::Error;

pub fn create_meeting(
    conn: &mut PgConnection,
    user_id_val: i32,
    start_date_val: NaiveDateTime,
    end_date_val: NaiveDateTime,
) -> Result<Meeting, DatabaseError> {

    validate_meeting_dates(start_date_val, end_date_val)?;


    let new_meeting = NewMeeting {
        user_id: user_id_val,
        start_date: start_date_val,
        end_date: end_date_val,
    };

    diesel::insert_into(meetings)
        .values(&new_meeting)
        .get_result(conn)
        .map_err(DatabaseError::from) 
}

pub fn get_meetings_by_user(
    conn: &mut PgConnection,
    user_id_val: i32,
) -> Result<Vec<MeetingResponse>, Error> {
    let results: Vec<Meeting> = meetings
        .filter(user_id.eq(user_id_val))
        .load(conn)?;

    Ok(results.into_iter().map(MeetingResponse::from).collect())
}

pub fn get_meeting_by_id(
    conn: &mut PgConnection,
    meeting_id_val: i32,
    user_id_val: i32,
) -> Result<MeetingResponse, Error> {
    let meeting: Meeting = meetings
        .filter(id.eq(meeting_id_val).and(user_id.eq(user_id_val)))
        .first(conn)?;

    Ok(MeetingResponse::from(meeting))
}

pub fn update_meeting(
    conn: &mut PgConnection,
    meeting_id_val: i32,
    user_id_val: i32,
    start_date_val: Option<NaiveDateTime>,
    end_date_val: Option<NaiveDateTime>,
) -> Result<MeetingResponse, DatabaseError> {

    // Fetch the existing meeting
    let existing_meeting: Meeting = meetings
        .filter(id.eq(meeting_id_val).and(user_id.eq(user_id_val)))
        .first(conn)?;

    // Use the existing dates if new dates are not provided
    let sd = start_date_val.unwrap_or(existing_meeting.start_date);
    let ed = end_date_val.unwrap_or(existing_meeting.end_date);

    // Validate the meeting dates
    validate_meeting_dates(sd, ed)?;

    let updated_meeting = diesel::update(meetings.filter(id.eq(meeting_id_val).and(user_id.eq(user_id_val))))
        .set((
            start_date_val.map(|sd| start_date.eq(sd)),
            end_date_val.map(|ed| end_date.eq(ed)),
            updated_at.eq(Utc::now().naive_utc()), // Update timestamp
        ))
        .get_result::<Meeting>(conn)?;

    Ok(MeetingResponse::from(updated_meeting))
}


pub fn delete_meeting(
    conn: &mut PgConnection,
    meeting_id_val: i32,
    user_id_val: i32,
) -> Result<(), DatabaseError> {
    // First, check if the meeting belongs to the user
    let meeting_user_id: i32 = meetings
        .filter(id.eq(meeting_id_val))
        .select(user_id)
        .first(conn)?;

    // If the meeting does not belong to the user, return an error
    if meeting_user_id != user_id_val {
        return Err(DatabaseError::NotFound); 
    }

    // If the meeting belongs to the user, delete it
    diesel::delete(meetings.filter(id.eq(meeting_id_val).and(user_id.eq(user_id_val))))
        .execute(conn)?;

    Ok(())
}