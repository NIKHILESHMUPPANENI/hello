use chrono::{NaiveDateTime, Utc};


pub fn validate_created_at(created_at: Option<String>) -> Result<Option<NaiveDateTime>, String> {
    if let Some(date_str) = created_at {
        let parsed_date = NaiveDateTime::parse_from_str(&format!("{} 00:00:00", date_str), "%Y-%m-%d %H:%M:%S")
            .map_err(|_| "Invalid date format. Use 'YYYY-MM-DD'.".to_string())?;

        if parsed_date > Utc::now().naive_utc() {
            return Err("The created_at date cannot be in the future.".to_string());
        }

        Ok(Some(parsed_date))
    } else {
        Ok(Some(Utc::now().naive_utc()))
    }
}

pub fn validate_due_date(due_date: Option<String>) -> Result<Option<NaiveDateTime>, String> {
    if let Some(date_str) = due_date {
        let parsed_date = NaiveDateTime::parse_from_str(&format!("{} 00:00:00", date_str), "%Y-%m-%d %H:%M:%S")
            .map_err(|_| "Invalid date format. Use 'YYYY-MM-DD'.".to_string())?;

        if parsed_date < Utc::now().naive_utc() {
            return Err("The due_date cannot be in the past.".to_string());
        }

        Ok(Some(parsed_date))
    } else {
        Ok(None)
    }
}