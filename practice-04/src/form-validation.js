const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const TITLE_MAX_LENGTH = 100;

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const isEditMode = editingId !== null;
  let id;

  // --- id ---
  if (isEditMode) {
    id = editingId;
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
      errors.id = "Некорректный id редактируемой задачи";
    } else if (!tasks.some((task) => task.id === id)) {
      errors.id = "Редактируемая задача не найдена";
    }
  } else {
    const rawId = draft.id;
    if (rawId === "" || rawId === null || rawId === undefined) {
      errors.id = "Укажите идентификатор задачи";
    } else {
      id = Number(rawId);
      if (!Number.isSafeInteger(id) || id <= 0) {
        errors.id = "id должен быть положительным безопасным целым числом";
      } else if (tasks.some((task) => task.id === id)) {
        errors.id = "Задача с таким id уже существует";
      }
    }
  }

  // --- title ---
  let title;
  if (typeof draft.title !== "string") {
    errors.title = "Название должно быть строкой";
  } else {
    title = draft.title.trim();
    if (title.length === 0) {
      errors.title = "Название не должно быть пустым";
    } else if (title.length > TITLE_MAX_LENGTH) {
      errors.title = `Название не должно превышать ${TITLE_MAX_LENGTH} символов`;
    }
  }

  // --- priority ---
  const priority = draft.priority;
  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = 'Приоритет должен быть "low", "medium" или "high"';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { id, title, priority } };
}