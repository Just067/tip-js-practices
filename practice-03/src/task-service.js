// Заготовка модуля. throw ниже отмечает отсутствие реализации,
// а не способ обработки некорректных данных в готовом решении.
// Для предусмотренных ошибок необходимо возвращать { ok: false, error: "..." }.
// console.log(), prompt(), document и чтение внешнего состояния здесь не нужны.

const TITLE_MAX_LENGTH = 100;

export function createTask(id, title, priority = "medium") {
  // Проверка id
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }

  // Проверка title
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const normalizedTitle = title.trim();
  if (normalizedTitle.length === 0) {
    return { ok: false, error: "Название не должно быть пустым" };
  }
  if (normalizedTitle.length > TITLE_MAX_LENGTH) {
    return { ok: false, error: `Название не должно превышать ${TITLE_MAX_LENGTH} символов` };
  }

  // Проверка priority
  const allowedPriorities = ["low", "medium", "high"];
  if (!allowedPriorities.includes(priority)) {
    return { ok: false, error: 'priority должен быть "low", "medium" или "high"' };
  }

  return {
    ok: true,
    task: {
      id,
      title: normalizedTitle,
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

// Возвращает МАССИВ ЗАДАЧ, а не идентификаторов.
export function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  if (tasks.some((task) => task.id === id)) {
    return { ok: false, error: "Задача с таким id уже существует" };
  }

  const creation = createTask(id, title, priority);
  if (!creation.ok) {
    return creation;
  }
  return { ok: true, tasks: [...tasks, creation.task] };
}

function isValidId(id) {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0;
}

export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть true или false" };
  }
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return { ok: false, error: "Задача не найдена" };
  }
  const updated = { ...tasks[index], completed };
  const newTasks = tasks.map((task, i) => (i === index ? updated : task));
  return { ok: true, tasks: newTasks };
}

export function renameTask(tasks, id, title) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const normalizedTitle = title.trim();
  if (normalizedTitle.length === 0) {
    return { ok: false, error: "Название не должно быть пустым" };
  }
  if (normalizedTitle.length > TITLE_MAX_LENGTH) {
    return { ok: false, error: `Название не должно превышать ${TITLE_MAX_LENGTH} символов` };
  }
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return { ok: false, error: "Задача не найдена" };
  }
  const updated = { ...tasks[index], title: normalizedTitle };
  const newTasks = tasks.map((task, i) => (i === index ? updated : task));
  return { ok: true, tasks: newTasks };
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: "Задача не найдена" };
  }
  const newTasks = tasks.filter((task) => task.id !== id);
  return { ok: true, tasks: newTasks };
}