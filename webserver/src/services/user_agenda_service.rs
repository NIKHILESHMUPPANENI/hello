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

#[cfg(test)]
mod tests {
    use chrono::Utc;
    use crate::database::test_db::TestDb;
    use crate::services::user_service::register_user;

    use super::*;

    #[test]
    fn test_create_meeting_success() {
        let db = TestDb::new();
        
        let user_id_test = register_user(
            &mut db.conn(),
            "test user",
            "password123",
            "test@example.com",
        )
        .expect("Failed to register user")
        .id;

        let start_date_val = Utc::now().naive_utc()+ chrono::Duration::seconds(5);
        let end_date_val = start_date_val + chrono::Duration::hours(1);

        let result = create_meeting(&mut db.conn(), user_id_test, start_date_val, end_date_val);

        assert!(result.is_ok(), "Meeting creation failed when it should have succeeded");

        let meeting = result.unwrap();
        assert_eq!(meeting.user_id, user_id_test);
        assert_eq!(meeting.start_date, start_date_val);
        assert_eq!(meeting.end_date, end_date_val);
    }

    #[test]
    fn test_create_meeting_invalid_dates() {
        let db = TestDb::new();

        let user_id_val = register_user(
            &mut db.conn(),
            "test user",
            "password123",
            "test@example.com",
        )
        .expect("Failed to register user")
        .id;

        // added 5 seconds to avoid an error (dates cannot be created int the past)
        let start_date_val = Utc::now().naive_utc()+ chrono::Duration::seconds(5);
        let end_date_val = start_date_val - chrono::Duration::hours(1); // Invalid: end before start

        let result = create_meeting(&mut db.conn(), user_id_val, start_date_val, end_date_val);

        assert!(result.is_err(), "Meeting creation should fail due to invalid dates");
    }

    #[test]
    fn test_get_meetings_by_user() {
        let db = TestDb::new();

        let user_id_val = register_user(
            &mut db.conn(),
            "test user",
            "password123",
            "test@example.com",
        )
        .expect("Failed to register user")
        .id;

        let start_id_val = Utc::now().naive_utc()+ chrono::Duration::seconds(5);
        let end_date_val = start_id_val + chrono::Duration::hours(1);

        let _meeting1 = create_meeting(&mut db.conn(), user_id_val, start_id_val, end_date_val)
            .expect("Failed to create meeting");

        let _meeting2 = create_meeting(&mut db.conn(), user_id_val, start_id_val, end_date_val)
            .expect("Failed to create meeting");

        let meetings_test = get_meetings_by_user(&mut db.conn(), user_id_val)
            .expect("Failed to fetch meetings");

        assert_eq!(meetings_test.len(), 2, "User should have exactly 2 meetings");
    }

    #[test]
    fn test_get_meeting_by_id_success() {
        let db = TestDb::new();

        let user_id_val = register_user(
            &mut db.conn(),
            "test user",
            "password123",
            "test@example.com",
        )
        .expect("Failed to register user")
        .id;

        let start_date_val = Utc::now().naive_utc()+ chrono::Duration::seconds(5);
        let end_date_val = start_date_val + chrono::Duration::hours(1);

        let meeting = create_meeting(&mut db.conn(), user_id_val, start_date_val, end_date_val)
            .expect("Failed to create meeting");

        let fetched_meeting = get_meeting_by_id(&mut db.conn(), meeting.id, user_id_val)
            .expect("Failed to fetch meeting");

        assert_eq!(fetched_meeting.id, meeting.id, "Fetched meeting ID does not match");
    }

    #[test]
    fn test_update_meeting_success() {
        let db = TestDb::new();

        let user_id_val = register_user(
            &mut db.conn(),
            "test user",
            "password123",
            "test@example.com",
        )
        .expect("Failed to register user")
        .id;

        let start_date_val = Utc::now().naive_utc()+ chrono::Duration::seconds(5);
        let end_date_val = start_date_val + chrono::Duration::hours(1);

        let meeting = create_meeting(&mut db.conn(), user_id_val, start_date_val, end_date_val)
            .expect("Failed to create meeting");

        let new_start_date = start_date_val + chrono::Duration::days(1);
        let new_end_date = new_start_date + chrono::Duration::hours(2);

        let updated_meeting = update_meeting(
            &mut db.conn(),
            meeting.id,
            user_id_val,
            Some(new_start_date),
            Some(new_end_date),
        )
        .expect("Failed to update meeting");

        assert_eq!(updated_meeting.start_date, new_start_date, "Start date did not update correctly");
        assert_eq!(updated_meeting.end_date, new_end_date, "End date did not update correctly");
    }

    #[test]
    fn test_update_meeting_invalid_dates() {
        let db = TestDb::new();

        let user_id_val = register_user(
            &mut db.conn(),
            "test user",
            "password123",
            "test@example.com",
        )
        .expect("Failed to register user")
        .id;

        let start_date_val = Utc::now().naive_utc()+ chrono::Duration::seconds(5);
        let end_date_val = start_date_val + chrono::Duration::hours(1);

        let meeting = create_meeting(&mut db.conn(), user_id_val, start_date_val, end_date_val)
            .expect("Failed to create meeting");

        let new_start_date = start_date_val + chrono::Duration::days(1);
        let new_end_date = start_date_val - chrono::Duration::hours(2); // Invalid

        let result = update_meeting(
            &mut db.conn(),
            meeting.id,
            user_id_val,
            Some(new_start_date),
            Some(new_end_date),
        );

        assert!(result.is_err(), "Update should fail with invalid dates");
    }

    #[test]
    fn test_delete_meeting_success() {
        let db = TestDb::new();

        let user_id_val = register_user(
            &mut db.conn(),
            "test user",
            "password123",
            "test@example.com",
        )
        .expect("Failed to register user")
        .id;

        let start_date_val = Utc::now().naive_utc()+ chrono::Duration::seconds(5);
        let end_date_val = start_date_val + chrono::Duration::hours(1);

        let meeting = create_meeting(&mut db.conn(), user_id_val, start_date_val, end_date_val)
            .expect("Failed to create meeting");

        let delete_result = delete_meeting(&mut db.conn(), meeting.id, user_id_val);
        assert!(delete_result.is_ok(), "Meeting deletion should succeed");

        let fetched_meeting = get_meeting_by_id(&mut db.conn(), meeting.id, user_id_val);
        assert!(fetched_meeting.is_err(), "Deleted meeting should not be retrievable");
    }

    #[test]
    fn test_delete_meeting_wrong_user() {
        let db = TestDb::new();

        let user1_id = register_user(
            &mut db.conn(),
            "user1",
            "password123",
            "user1@example.com",
        )
        .expect("Failed to register user")
        .id;

        let user2_id = register_user(
            &mut db.conn(),
            "user2",
            "password123",
            "user2@example.com",
        )
        .expect("Failed to register user")
        .id;

        let start_date_val = Utc::now().naive_utc()+ chrono::Duration::seconds(5);
        let end_date_val = start_date_val + chrono::Duration::hours(1);

        let meeting = create_meeting(&mut db.conn(), user1_id, start_date_val, end_date_val)
            .expect("Failed to create meeting");

        let delete_result = delete_meeting(&mut db.conn(), meeting.id, user2_id);
        assert!(delete_result.is_err(), "User2 should not be able to delete User1's meeting");
    }
}
