
use diesel::prelude::*;
use diesel::result::Error;


use crate::{models::{sub_tasks::{NewSubTask, SubTask}, sub_tasks_assignee::{NewSubTaskAssignee, SubTaskWithAssignees,SubTaskWithAssignedUsers}, task::Task, user::User}, schema::{sub_tasks::{self}, subtask_assignees::{self, sub_task_id}, tasks::{self}}};

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
                task_id,
                assigned_at: Some(chrono::Utc::now().naive_utc()),
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


pub fn update_subtask(
    conn: &mut PgConnection,
    sub_task_id_param: i32,
    task_id: i32,
    user_id: i32,
    title: Option<&str>,
    description: Option<&str>,
    completed: Option<bool>,
    progress: Option<Progress>,
    priority: Option<Priority>,
    created_at: Option<String>,
    due_date: Option<String>,
    assigned_users: Option<Vec<i32>>,
) -> Result<SubTaskWithAssignedUsers, TaskError> {
    use crate::schema::{sub_tasks, subtask_assignees};

    // Validate dates only if `created_at` or `due_date` is provided
    let parsed_created_at = if let Some(date) = &created_at {
        Some(parse_and_validate_created_at(Some(date.clone()))?)
    } else {
        None
    };
    let parsed_due_date = parse_and_validate_due_date(due_date)?;

    conn.transaction(|conn| {
        // Validate that the subtask belongs to the correct task and user
        let _existing_subtask = sub_tasks::table
            .filter(
                sub_tasks::id.eq(sub_task_id_param)
                    .and(sub_tasks::task_id.eq(task_id))
                    .and(sub_tasks::user_id.eq(user_id)),
            )
            .first::<SubTask>(conn)
            .map_err(|_| TaskError {
                message: "Subtask not found or unauthorized".to_string(),
            })?;

        // Build the update query dynamically
        let updated_subtask = diesel::update(
            sub_tasks::table.filter(
                sub_tasks::id.eq(sub_task_id_param)
                    .and(sub_tasks::user_id.eq(user_id)),
            ),
        )
        .set((
            title.map(|t| sub_tasks::title.eq(t)),
            description.map(|desc| sub_tasks::description.eq(Some(desc))),
            completed.map(|comp| sub_tasks::completed.eq(comp)),
            progress.map(|prog| sub_tasks::progress.eq(prog)),
            priority.map(|pri| sub_tasks::priority.eq(pri)),
            Some(sub_tasks::updated_at.eq(chrono::Utc::now().naive_utc())), 
            parsed_created_at.map(|dt| sub_tasks::created_at.eq(dt)), 
            parsed_due_date.map(|dt| sub_tasks::due_date.eq(dt)),
        ))
        .get_result::<SubTask>(conn)?;

        // Update assigned users if provided
        if let Some(users) = assigned_users {
            // Remove existing assignments
            diesel::delete(
                subtask_assignees::table.filter(
                    subtask_assignees::sub_task_id.eq(sub_task_id_param),
                ),
            )
            .execute(conn)?;

            // Add new assignments
            let new_assignments: Vec<NewSubTaskAssignee> = users
                .into_iter()
                .map(|user_id| NewSubTaskAssignee {
                    sub_task_id: sub_task_id_param,
                    user_id,
                    task_id,
                    assigned_at: Some(chrono::Utc::now().naive_utc()),
                })
                .collect();

            diesel::insert_into(subtask_assignees::table)
                .values(new_assignments)
                .execute(conn)?;
        }

        // Query assigned users
        let assigned_users_query = subtask_assignees::table
            .filter(subtask_assignees::sub_task_id.eq(sub_task_id_param))
            .select(subtask_assignees::user_id)
            .load::<i32>(conn)?;

        Ok(SubTaskWithAssignedUsers {
            sub_task: updated_subtask,
            assignees: assigned_users_query,
            task_id,
            assigned_at: chrono::Utc::now().naive_utc(),
        })
    })
}


pub fn delete_subtask(
    conn: &mut PgConnection,
    sub_task_id_param: i32,
    task_id: i32,
    user_id: &i32,
) -> Result<(), Error> {
    use crate::schema::{sub_tasks, subtask_assignees};

    // Check if the subtask belongs to the specified task and was created by the user
    let subtask_details: Option<(i32, i32)> = sub_tasks::table
        .filter(sub_tasks::id.eq(sub_task_id_param))
        .select((sub_tasks::task_id, sub_tasks::user_id))
        .first(conn)
        .optional()?;

    match subtask_details {
        Some((existing_task_id, existing_user_id)) if existing_task_id == task_id && existing_user_id == *user_id => {
            // Delete associated assignees first
            diesel::delete(subtask_assignees::table.filter(subtask_assignees::sub_task_id.eq(sub_task_id)))
                .execute(conn)?;

            // Delete the subtask
            diesel::delete(sub_tasks::table.filter(sub_tasks::id.eq(sub_task_id_param)))
                .execute(conn)?;

            Ok(())
        },
        _ => Err(Error::NotFound)
    }
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
#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::test_db::TestDb;
    use crate::services::{project_service, sub_tasks_service, task_service, user_service};
    use chrono::Utc;
    use diesel::result::Error;

    #[test]
    fn test_update_subtask_success() {
        let db = TestDb::new();
        let conn = &mut db.conn();

        // Create test user
        let user = user_service::register_user(
            conn,
            "test user",
            "testpassword",
            "test@email.com",
        )
        .expect("Failed to register user");

        // Create test project
        let project = project_service::create_project(
            conn,
            "test project",
            "test project description",
            &user.id,
        )
        .expect("Failed to create project");

        // Create test task
        let task = task_service::create_task(
            conn,
            "task description",
            100,
            project.id,
            user.id,
            "task title",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
        )
        .expect("Failed to create task");

        // Create test subtask
        let subtask = sub_tasks_service::create_subtask(
            conn,
            task.id,
            "initial subtask",
            "initial subtask description",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
            Priority::Medium,
            Progress::ToDo,
            user.id,
            Some(vec![user.id]),
        )
        .expect("Failed to create subtask");

        // Update subtask
        let updated_subtask = update_subtask(
            conn,
            subtask.id,
            task.id,
            user.id,
            Some("Updated Subtask"),
            Some("Updated description"),
            Some(true),
            Some(Progress::InProgress),
            Some(Priority::High),
            None,
            None,
            Some(vec![user.id]),
        )
        .expect("Failed to update subtask");

        assert_eq!(updated_subtask.sub_task.title, "Updated Subtask");
        assert_eq!(updated_subtask.sub_task.description, Some("Updated description".to_string()));
        assert!(updated_subtask.sub_task.completed);
        assert_eq!(updated_subtask.sub_task.progress, Progress::InProgress);
        assert_eq!(updated_subtask.sub_task.priority, Priority::High);
    }

    #[test]
    fn test_update_subtask_unauthorized() {
        let db = TestDb::new();
        let conn = &mut db.conn();

        // Create test users
        let user1 = user_service::register_user(
            conn,
            "test user 1",
            "testpassword",
            "test1@email.com",
        )
        .expect("Failed to register user");

        let user2 = user_service::register_user(
            conn,
            "test user 2",
            "testpassword",
            "test2@email.com",
        )
        .expect("Failed to register user");

        // Create test project
        let project = project_service::create_project(
            conn,
            "test project",
            "test project description",
            &user1.id,
        )
        .expect("Failed to create project");

        // Create test task
        let task = task_service::create_task(
            conn,
            "task description",
            100,
            project.id,
            user1.id,
            "task title",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
        )
        .expect("Failed to create task");

        // Create test subtask
        let subtask = sub_tasks_service::create_subtask(
            conn,
            task.id,
            "initial subtask",
            "initial subtask description",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
            Priority::Medium,
            Progress::ToDo,
            user1.id,
            Some(vec![user1.id]),
        )
        .expect("Failed to create subtask");

        // Try to update subtask with unauthorized user
        let update_result = update_subtask(
            conn,
            subtask.id,
            task.id,
            user2.id,
            Some("Updated Subtask"),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        );

        assert!(update_result.is_err());
    }

    #[test]
    fn test_delete_subtask_success() {
        let db = TestDb::new();
        let conn = &mut db.conn();

        // Create test user
        let user = user_service::register_user(
            conn,
            "test user",
            "testpassword",
            "test@email.com",
        )
        .expect("Failed to register user");

        // Create test project
        let project = project_service::create_project(
            conn,
            "test project",
            "test project description",
            &user.id,
        )
        .expect("Failed to create project");

        // Create test task
        let task = task_service::create_task(
            conn,
            "task description",
            100,
            project.id,
            user.id,
            "task title",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
        )
        .expect("Failed to create task");

        // Create test subtask
        let subtask = sub_tasks_service::create_subtask(
            conn,
            task.id,
            "subtask",
            "subtask description",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
            Priority::Medium,
            Progress::ToDo,
            user.id,
            Some(vec![user.id]),
        )
        .expect("Failed to create subtask");

        // Delete subtask
        let delete_result = delete_subtask(
            conn,
            subtask.id,
            task.id,
            &user.id,
        );

        assert!(delete_result.is_ok());
    }

    #[test]
    fn test_delete_subtask_unauthorized() {
        let db = TestDb::new();
        let conn = &mut db.conn();

        // Create test users
        let user1 = user_service::register_user(
            conn,
            "test user 1",
            "testpassword",
            "test1@email.com",
        )
        .expect("Failed to register user");

        let user2 = user_service::register_user(
            conn,
            "test user 2",
            "testpassword",
            "test2@email.com",
        )
        .expect("Failed to register user");

        // Create test project
        let project = project_service::create_project(
            conn,
            "test project",
            "test project description",
            &user1.id,
        )
        .expect("Failed to create project");

        // Create test task
        let task = task_service::create_task(
            conn,
            "task description",
            100,
            project.id,
            user1.id,
            "task title",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
        )
        .expect("Failed to create task");

        // Create test subtask
        let subtask = sub_tasks_service::create_subtask(
            conn,
            task.id,
            "subtask",
            "subtask description",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
            Priority::Medium,
            Progress::ToDo,
            user1.id,
            Some(vec![user1.id]),
        )
        .expect("Failed to create subtask");

        // Try to delete subtask with unauthorized user
        let delete_result = delete_subtask(
            conn,
            subtask.id,
            task.id,
            &user2.id,
        );

        assert!(delete_result.is_err());
        assert!(matches!(delete_result, Err(Error::NotFound)));
    }

    #[test]
    fn test_delete_subtask_wrong_task() {
        let db = TestDb::new();
        let conn = &mut db.conn();

        // Create test user
        let user = user_service::register_user(
            conn,
            "test user",
            "testpassword",
            "test@email.com",
        )
        .expect("Failed to register user");

        // Create test projects
        let project1 = project_service::create_project(
            conn,
            "test project 1",
            "test project description",
            &user.id,
        )
        .expect("Failed to create project");

        let project2 = project_service::create_project(
            conn,
            "test project 2",
            "test project description",
            &user.id,
        )
        .expect("Failed to create project");

        // Create test tasks
        let task1 = task_service::create_task(
            conn,
            "task description 1",
            100,
            project1.id,
            user.id,
            "task title 1",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
        )
        .expect("Failed to create task");

        let task2 = task_service::create_task(
            conn,
            "task description 2",
            100,
            project2.id,
            user.id,
            "task title 2",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
        )
        .expect("Failed to create task");

        // Create test subtask
        let subtask = sub_tasks_service::create_subtask(
            conn,
            task1.id,
            "subtask",
            "subtask description",
            Some(Utc::now().format("%d-%m-%Y").to_string()),
            None,
            Priority::Medium,
            Progress::ToDo,
            user.id,
            Some(vec![user.id]),
        )
        .expect("Failed to create subtask");

        // Try to delete subtask with wrong task ID
        let delete_result = delete_subtask(
            conn,
            subtask.id,
            task2.id,
            &user.id,
        );

        assert!(delete_result.is_err());
        assert!(matches!(delete_result, Err(Error::NotFound)));
    }
}

}