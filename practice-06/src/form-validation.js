const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
// Ошибки записываются по ключам title, priority и categoryId.
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const source = draft && typeof draft === "object" ? draft : {};
  const categoryList = Array.isArray(categories) ? categories : [];

  // title
  const rawTitle = typeof source.title === "string" ? source.title : "";
  const title = rawTitle.trim();
  if (title.length === 0) {
    errors.title = "Введите название задачи.";
  } else if (title.length > 100) {
    errors.title = "Название не должно быть длиннее 100 символов.";
  }

  // priority
  const rawPriority = typeof source.priority === "string" ? source.priority : "";
  const priority = rawPriority.trim().toLowerCase();
  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите приоритет: low, medium или high.";
  }

  // categoryId
  const rawCategory = source.categoryId;
  let categoryId = null;
  if (typeof rawCategory === "number" && Number.isSafeInteger(rawCategory)) {
    categoryId = rawCategory;
  } else if (typeof rawCategory === "string" && rawCategory.trim() !== "") {
    const parsed = Number(rawCategory);
    if (Number.isSafeInteger(parsed)) categoryId = parsed;
  }

  if (categoryId === null || categoryId <= 0) {
    errors.categoryId = "Выберите категорию.";
  } else if (!categoryList.some((item) => item && item.id === categoryId)) {
    errors.categoryId = "Выбранная категория недоступна.";
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    value: {
      title,
      priority,
      categoryId,
    },
    errors,
  };
}