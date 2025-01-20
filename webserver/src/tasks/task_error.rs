
use std::error::Error;
use std::fmt;


#[derive(Debug)]
pub struct TaskError {
    pub(crate) message: String,
   
}

impl fmt::Display for TaskError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl Error for TaskError {}

