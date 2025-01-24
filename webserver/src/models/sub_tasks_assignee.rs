use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::schema::subtask_assignees;

use super::{sub_tasks::SubTask, user::User};

#[derive(Insertable)]
#[diesel(table_name = subtask_assignees)]
pub struct NewSubTaskAssignee {
    pub sub_task_id: i32,
    pub user_id: i32,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct SubTaskWithAssignees {
    pub sub_task:SubTask ,
    pub assignees: Vec<User>,
}


//user to sub_task many to many relationship
impl SubTask {
    pub fn with_assignees(self, assignees: Vec<User>) -> SubTaskWithAssignees {
        SubTaskWithAssignees {
            sub_task: self,
            assignees,
        }
    }
}

impl SubTaskWithAssignees {
    pub fn new(sub_task: SubTask, assignees: Vec<User>) -> Self {
        SubTaskWithAssignees { sub_task, assignees }
    }
}