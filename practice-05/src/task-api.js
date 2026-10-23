import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

function assertUniqueIds(items, collectionName) {
  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) {
      throw invalidResponse(
        `Коллекция ${collectionName} содержит повторяющийся id ${item.id}.`,
      );
    }
    ids.add(item.id);
  }
}

function normalizeFilters(filters) {
  if (filters === undefined) return {};

  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("filters должен быть объектом.");
  }

  for (const key of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw new TypeError(`Неизвестный фильтр: ${key}.`);
    }
  }

  const normalized = {};

  if (filters.completed !== undefined && filters.completed !== null) {
    if (typeof filters.completed !== "boolean") {
      throw new TypeError("Фильтр completed должен быть boolean.");
    }
    normalized.completed = filters.completed;
  }

  if (filters.priority !== undefined && filters.priority !== null) {
    if (!ALLOWED_PRIORITIES.has(filters.priority)) {
      throw new TypeError("Фильтр priority должен быть low, medium или high.");
    }
    normalized.priority = filters.priority;
  }

  if (filters.categoryId !== undefined && filters.categoryId !== null) {
    if (!isPositiveSafeInteger(filters.categoryId)) {
      throw new TypeError("Фильтр categoryId должен быть положительным целым числом.");
    }
    normalized.categoryId = filters.categoryId;
  }

  if (filters.q !== undefined && filters.q !== null) {
    if (typeof filters.q !== "string") {
      throw new TypeError("Фильтр q должен быть строкой.");
    }
    const trimmed = filters.q.trim();
    if (trimmed.length > 100) {
      throw new TypeError("Фильтр q не должен быть длиннее 100 символов.");
    }
    if (trimmed !== "") {
      normalized.q = trimmed;
    }
  }

  return normalized;
}

// client — объект, созданный createApiClient.
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client.requestJson должен быть функцией.");
  }

  async function getTasks(filters = {}) {
    const normalizedFilters = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", {
      query: normalizedFilters,
    });

    if (
      !isPlainObject(payload)
      || !Array.isArray(payload.data)
      || !isPlainObject(payload.meta)
    ) {
      throw invalidResponse("Ответ /tasks должен содержать data и meta.");
    }

    const tasks = payload.data;
    if (!tasks.every(isTask)) {
      throw invalidResponse("Одна или несколько задач не соответствуют схеме.");
    }
    assertUniqueIds(tasks, "tasks");

    if (payload.meta.total !== tasks.length) {
      throw invalidResponse("meta.total не совпадает с количеством задач.");
    }

    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id задачи должен быть положительным целым числом.");
    }

    const payload = await client.requestJson(`/tasks/${id}`);

    const task = isPlainObject(payload)
      && Object.prototype.hasOwnProperty.call(payload, "data")
      ? payload.data
      : payload;

    if (!isTask(task)) {
      throw invalidResponse(`Задача с id ${id} не соответствует схеме.`);
    }
    if (task.id !== id) {
      throw invalidResponse(`Получена задача с id ${task.id}, ожидалась ${id}.`);
    }

    return task;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");

    let categories;
    if (Array.isArray(payload)) {
      categories = payload;
    } else if (isPlainObject(payload) && Array.isArray(payload.data)) {
      categories = payload.data;
    } else {
      throw invalidResponse("Ответ /categories должен содержать массив категорий.");
    }

    if (!categories.every(isCategory)) {
      throw invalidResponse("Одна или несколько категорий не соответствуют схеме.");
    }
    assertUniqueIds(categories, "categories");

    if (
      isPlainObject(payload)
      && Object.prototype.hasOwnProperty.call(payload, "meta")
    ) {
      if (!isPlainObject(payload.meta)) {
        throw invalidResponse("meta ответа /categories должен быть объектом.");
      }
      if (payload.meta.total !== categories.length) {
        throw invalidResponse("meta.total не совпадает с количеством категорий.");
      }
    }

    return categories;
  }

  async function loadInitialData(filters = {}) {
    const normalizedFilters = normalizeFilters(filters);

    // Оба запроса стартуют до общего await.
    const tasksPromise = getTasks(normalizedFilters);
    const categoriesPromise = getCategories();

    const [taskResult, categories] = await Promise.all([
      tasksPromise,
      categoriesPromise,
    ]);

    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}