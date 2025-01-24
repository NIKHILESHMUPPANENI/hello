
use diesel::prelude::*;
use diesel::result::Error;


use crate::{models::{sub_tasks::{NewSubTask, SubTask}, sub_tasks_assignee::{NewSubTaskAssignee, SubTaskWithAssignees}, task::Task, user::User}, schema::{sub_tasks, subtask_assignees, tasks::{self}}};

use crate::tasks::{enums::{Priority, Progress}, herlpers::{parse_and_validate_created_at, parse_and_validate_due_date}, task_error::TaskError};

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

#[cfg(test)]
mod tests {
    use crate::database::test_db::TestDb;
    use crate::services::project_service::create_project;
    use crate::services::user_service::register_user;
    use crate::services::task_service::create_task;

    use super::*;
#[test]
fn create_subtask_success() {
    let db = TestDb::new();
    let conn = &mut db.conn();

    let user = register_user(conn, "test user", "testpassword", "test@test.com")
        .expect("Failed to register user");
    let project = create_project(conn, "test project", "test project description", &user.id)
        .expect("Failed to create project");
    let task = create_task(
        conn,
        "test task",
        100,
        project.id,
        user.id,
        "task title",
        Some("01-01-2025".to_string()),
        None,
    )
    .expect("Failed to create task");

    let subtask = create_subtask(
        conn,
        task.id,
        "subtask title",
        "subtask description",
        Some("01-01-2025".to_string()),
        None,
        Priority::Medium,
        Progress::ToDo,
        user.id,
        Some(vec![user.id]),
    );

    assert!(subtask.is_ok(), "Subtask creation failed when it should have succeeded");
}


#[test]
fn create_subtask_invalid_task_id() {
    let db = TestDb::new();
    let conn = &mut db.conn();

    let user = register_user(conn, "test user", "testpassword", "test@test.com")
        .expect("Failed to register user");

    let result = create_subtask(
        conn,
        999, // Non-existent task ID
        "subtask title",
        "subtask description",
        Some("01-01-2025".to_string()),
        None,
        Priority::Medium,
        Progress::ToDo,
        user.id,
        Some(vec![user.id]),
    );

    assert!(
        result.is_err(),
        "Subtask creation succeeded with an invalid task ID"
    );
}
#[test]
fn get_sub_tasks_success() {
    let db = TestDb::new();
    let conn = &mut db.conn();

    let user = register_user(conn, "test user", "testpassword", "test@test.com")
        .expect("Failed to register user");
    let project = create_project(conn, "test project", "test project description", &user.id)
        .expect("Failed to create project");
    let task = create_task(
        conn,
        "test task",
        100,
        project.id,
        user.id,
        "task title",
        Some("01-01-2025".to_string()),
        None,
    )
    .expect("Failed to create task");

    create_subtask(
        conn,
        task.id,
        "subtask title",
        "subtask description",
        Some("01-01-2025".to_string()),
        None,
        Priority::Medium,
        Progress::ToDo,
        user.id,
        None,
    )
    .expect("Failed to create subtask");

    let subtasks = get_sub_tasks(conn, user.id).expect("Failed to fetch subtasks");

    assert_eq!(subtasks.len(), 1, "Expected one subtask to be retrieved");
}
#[test]
fn get_sub_tasks_with_assignees_success() {
    let db = TestDb::new();
    let conn = &mut db.conn();

    let user = register_user(conn, "test user", "testpassword", "test@test.com")
        .expect("Failed to register user");
    let project = create_project(conn, "test project", "test project description", &user.id)
        .expect("Failed to create project");
    let task = create_task(
        conn,
        "test task",
        100,
        project.id,
        user.id,
        "task title",
        Some("01-01-2025".to_string()),
        None,
    )
    .expect("Failed to create task");

    let _subtask = create_subtask(
        conn,
        task.id,
        "subtask title",
        "subtask description",
        Some("01-01-2025".to_string()),
        None,
        Priority::Medium,
        Progress::ToDo,
        user.id,
        Some(vec![user.id]),
    )
    .expect("Failed to create subtask");

    let subtasks_with_assignees =
        get_sub_tasks_with_assignees(conn, task.id).expect("Failed to fetch subtasks with assignees");

    assert_eq!(subtasks_with_assignees.len(), 1, "Expected one subtask to be retrieved");
    assert_eq!(
        subtasks_with_assignees[0].assignees.len(),
        1,
        "Expected one assignee for the subtask"
    );
}

}