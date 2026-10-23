export function getVisibleTasks(tasks, filter = "all") {
  if (filter === "pending") {
    return tasks.filter((task) => task.completed === false);
  }
  if (filter === "completed") {
    return tasks.filter((task) => task.completed === true);
  }
  // "all" и любое недопустимое значение при прямом вызове — полный снимок
  return tasks.slice();
}