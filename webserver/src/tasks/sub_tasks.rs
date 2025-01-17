use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::schema::sub_tasks;

use super::task::Task;




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
    pub priority: String,
    pub assignee_id: Option<i32>,
}
