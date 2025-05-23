use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::{models::{task::Task, user::User}, schema::task_assignees};

#[derive(Insertable, Associations, Identifiable, Queryable, Debug)]
#[diesel(table_name = task_assignees)]
#[diesel(belongs_to(Task))]
#[diesel(belongs_to(User))]
#[diesel(primary_key(task_id, user_id))] 
pub struct TaskAssignee {
    pub task_id: i32,
    pub user_id: i32,
    pub assigned_at: Option<chrono::NaiveDateTime>, 
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TaskWithAssignees {
    pub task: Task,
    pub assignees: Vec<User>,
}

#[derive(Insertable)]
#[diesel(table_name = task_assignees)]
pub struct NewTaskAssignee {
    pub task_id: i32,
    pub user_id: i32,
}

#[derive(Serialize,Deserialize)]
pub struct TaskWithAssignedUsers {
    pub task: Task,
    pub assigned_users: Vec<i32>, 
}