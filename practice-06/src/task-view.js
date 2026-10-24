const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function createActionButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  const span = document.createElement("span");
  span.className = "action-label";
  span.textContent = label;
  button.append(span);
  return button;
}

export function createTaskElement(task, category) {
  const item = document.createElement("li");
  item.className = "task-card";
  item.dataset.taskId = String(task.id);
  if (task.completed) item.classList.add("is-completed");

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("p");
  meta.className = "task-meta";

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнено" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = `Приоритет: ${PRIORITY_LABELS[task.priority] ?? task.priority}`;

  const categoryEl = document.createElement("span");
  categoryEl.className = "task-category";
  categoryEl.textContent = category
    ? category.name
    : `Категория #${task.categoryId}`;

  meta.append(status, priority, categoryEl);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(
    createActionButton("toggle", task.completed ? "Вернуть в работу" : "Завершить"),
    createActionButton("edit", "Изменить"),
    createActionButton("delete", "Удалить"),
  );

  item.append(title, meta, actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map();
  for (const category of categories ?? []) {
    if (category && Number.isSafeInteger(category.id)) {
      byId.set(category.id, category);
    }
  }

  const fragment = document.createDocumentFragment();
  for (const task of tasks ?? []) {
    fragment.append(createTaskElement(task, byId.get(task.categoryId)));
  }
  list.replaceChildren(fragment);
}