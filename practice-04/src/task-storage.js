export const STORAGE_VERSION = 1;

function isValidId(id) {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0;
}

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const seenIds = new Set();
  for (const task of value) {
    if (typeof task !== "object" || task === null) return false;
    if (!isValidId(task.id)) return false;
    if (seenIds.has(task.id)) return false;
    seenIds.add(task.id);
    if (typeof task.title !== "string") return false;
    const trimmed = task.title.trim();
    if (trimmed.length === 0 || trimmed.length > 100) return false;
    if (typeof task.completed !== "boolean") return false;
    if (!["low", "medium", "high"].includes(task.priority)) return false;
  }
  return true;
}

function cloneTask(task) {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    priority: task.priority,
  };
}

function cloneTasks(tasks) {
  return tasks.map(cloneTask);
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = cloneTasks(fallbackTasks);
  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return { ok: true, source: "initial", tasks: fallback };
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        ok: false,
        source: "fallback",
        tasks: fallback,
        error: "Сохранённые данные повреждены: некорректный JSON",
      };
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {
        ok: false,
        source: "fallback",
        tasks: fallback,
        error: "Сохранённые данные имеют неверный формат",
      };
    }
    if (parsed.version !== STORAGE_VERSION) {
      return {
        ok: false,
        source: "fallback",
        tasks: fallback,
        error: `Несовместимая версия схемы: ожидалась ${STORAGE_VERSION}`,
      };
    }
    if (!isValidTaskList(parsed.tasks)) {
      return {
        ok: false,
        source: "fallback",
        tasks: fallback,
        error: "Сохранённые задачи не соответствуют схеме",
      };
    }
    return { ok: true, source: "storage", tasks: cloneTasks(parsed.tasks) };
  } catch (error) {
    return {
      ok: false,
      source: "fallback",
      tasks: fallback,
      error: `Ошибка чтения хранилища: ${error.message}`,
    };
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Некорректный список задач; запись не выполнена" };
  }
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Ошибка записи в хранилище: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Ошибка удаления из хранилища: ${error.message}` };
  }
}