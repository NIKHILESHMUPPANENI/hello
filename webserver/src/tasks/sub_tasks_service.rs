
use diesel::prelude::*;
use diesel::result::Error;


use crate::{models::user::User, schema::{sub_tasks, subtask_assignees, tasks::{self}}};

use super::{enums::{Priority, Progress}, herlpers::{parse_and_validate_created_at, parse_and_validate_due_date}, sub_tasks::{NewSubTask, NewSubTaskAssignee, SubTask, SubTaskWithAssignees}, task::Task, task_error::TaskError};

pub fn create_subtask(
    conn: &mut PgConnection,
    task_id: i32,
    title: &str,
    description: &str,
    created_at:Option<String>,
    due_date: Option<String>,
    priority: Priority,
    progress: Progress,
    user_id: i32,
    assignee_user: Option<Vec<i32>>,
) -> Result<SubTask, TaskError> {
    // Validate parent task exists
    tasks::table
        .find(task_id)
        .first::<Task>(conn)
        .map_err(|_| TaskError {
            message: format!("Task with id {} not found", task_id),
        })?;

    // Parse due date
    let parsed_due_date = parse_and_validate_due_date(due_date)?;
    let parsed_created_at = parse_and_validate_created_at(created_at)?;

    // Insert new subtask
    let new_subtask = NewSubTask {
        task_id,
        title,
        description,
        created_at: parsed_created_at,
        updated_at: chrono::Utc::now().naive_utc(),
        due_date: parsed_due_date,
        priority,
        progress,
        user_id,
        completed:false,
        
    };

    let created_subtask = diesel::insert_into(sub_tasks::table)
        .values(&new_subtask)
        .returning(SubTask::as_returning())
        .get_result(conn)?;

    // Insert assignee users if provided
    if let Some(assignees) = assignee_user {
        let new_assignees: Vec<NewSubTaskAssignee> = assignees
            .into_iter()
            .map(|user_id| NewSubTaskAssignee {
                sub_task_id: created_subtask.id,
                user_id,
            })
            .collect();

        diesel::insert_into(subtask_assignees::table)
            .values(new_assignees)
            .execute(conn)?;
    }

    Ok(created_subtask)
}


pub(crate) fn get_sub_tasks(conn: &mut PgConnection, users_id: i32) -> Result<Vec<SubTask>, Error> {
    use crate::schema::sub_tasks::dsl::*;

    sub_tasks
        .filter(user_id.eq(users_id))
        .select(SubTask::as_select()) // Ensure correct Diesel mapping
        .load::<SubTask>(conn)
}

pub(crate) fn get_sub_tasks_with_assignees(
    conn: &mut PgConnection,
    task_id: i32,
) -> Result<Vec<SubTaskWithAssignees>, Error> {
    use crate::schema::{sub_tasks, subtask_assignees, users};

    let results = sub_tasks::table
        .filter(sub_tasks::task_id.eq(task_id)) // Filter subtasks by task ID
        .load::<SubTask>(conn)?; // Load all subtasks for the task

    let subtasks_with_assignees = results
        .into_iter()
        .map(|subtask| {
            let assignees = users::table
                .inner_join(subtask_assignees::table.on(subtask_assignees::user_id.eq(users::id)))
                .filter(subtask_assignees::sub_task_id.eq(subtask.id))
                .select(users::all_columns)
                .load::<User>(conn)?; // Load all assigned users for the subtask
             
            Ok(SubTaskWithAssignees {
                sub_task: subtask,
                assignees,
            })
        })
        .collect::<Result<Vec<SubTaskWithAssignees>, Error>>()?;

    Ok(subtasks_with_assignees)
}
