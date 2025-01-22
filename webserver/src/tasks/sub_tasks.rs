use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::{models::user::User, schema::{sub_tasks, subtask_assignees}};

use super::{enums::{Priority, Progress}, task::Task};




#[derive(Serialize, Deserialize, Debug)]
pub struct TaskWithSubTasks {
    pub task: Task,
    pub subtasks: Vec<SubTask>,
}

#[derive(
    Queryable, Selectable, Serialize, Deserialize, Debug, Associations, Identifiable, PartialEq,
)]
#[diesel(table_name = sub_tasks)]
#[belongs_to(Task)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct SubTask {
    pub id: i32,
    pub task_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub due_date: Option<NaiveDateTime>,
    pub priority: Priority,
    pub progress : Progress,
    pub user_id: i32,
    pub completed:bool,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = sub_tasks)]
pub struct NewSubTask<'a> {
    pub task_id : i32,
    pub title: &'a str,
    pub description: &'a str,
    pub created_at : NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub due_date : Option<NaiveDateTime>,
    pub priority : Priority,
    pub progress : Progress,
    pub user_id: i32,
    pub completed:bool

}

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