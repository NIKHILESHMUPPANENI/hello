// // // use diesel::result::Error;
// // // use std::fmt;

// // // #[derive(Debug)]
// // // pub enum TaskError {
// // //     DateValidationError(String),
// // //     DatabaseError(Error),
// // // }

// // // impl fmt::Display for TaskError {
// // //     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
// // //         match self {
// // //             TaskError::DateValidationError(msg) => write!(f, "Date validation error: {}", msg),
// // //             TaskError::DatabaseError(e) => write!(f, "Database error: {}", e),
// // //         }
// // //     }
// // // }

// // // impl From<Error> for TaskError {
// // //     fn from(err: Error) -> TaskError {
// // //         TaskError::DatabaseError(err)
// // //     }
// // // }

// // use chrono::{NaiveDateTime, Utc}; use diesel::result::Error; use std::fmt; use std::error::Error as StdError; 
// // // Define custom TaskError 
// // #[derive(Debug)] 
// // pub enum TaskError { DateValidationError(String), DatabaseError(Error), }
// //  impl fmt::Display for TaskError { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { match self { TaskError::DateValidationError(msg) => write!(f, "Date validation error: {}", msg), TaskError::DatabaseError(e) => write!(f, "Database error: {}", e), } } } impl StdError for TaskError {} impl From<Error> for TaskError { fn from(err: Error) -> TaskError { TaskError::DatabaseError(err) }}

// // 


// use diesel::result::Error as DieselError;
// use std::fmt;
// use std::error::Error as StdError;

// #[derive(Debug)]
// pub enum TaskError {
//     DateValidationError(String),
//     DatabaseError(String),
// }

// impl fmt::Display for TaskError {
//     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
//         match self {
//             TaskError::DateValidationError(msg) => write!(f, "Date validation error: {}", msg),
//             TaskError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
//         }
//     }
// }

// impl StdError for TaskError {}

// impl From<TaskError> for DieselError {
//     fn from(err: TaskError) -> DieselError {
//         match err {
//             TaskError::DateValidationError(msg) => DieselError::DatabaseError(Box::new(msg)),
//             TaskError::DatabaseError(msg) => DieselError::DatabaseError(Box::new(msg)),
//         }
//     }
// }
