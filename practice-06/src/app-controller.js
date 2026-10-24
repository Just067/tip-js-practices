import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

function isAbortError(error) {
  if (error instanceof ApiError) return error.kind === "aborted";
  return Boolean(error && (error.name === "AbortError" || error.code === 20));
}

function extractFieldErrors(error) {
  if (!(error instanceof ApiError)) return null;
  if (error.kind !== "http" || error.code !== "VALIDATION_ERROR") return null;
  if (!error.details || typeof error.details !== "object") return null;
  const fields = {};
  for (const name of ["title", "priority", "categoryId"]) {
    const value = error.details[name];
    if (typeof value === "string" && value.trim() !== "") fields[name] = value;
  }
  return Object.keys(fields).length > 0 ? fields : null;
}

export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  // Проверка зависимостей — тест 23 ожидает TypeError для {}, { api: {} }, { view: {} }.
  if (!api || typeof api !== "object"
      || (typeof api.loadInitialData !== "function" && typeof api.getTasks !== "function")) {
    throw new TypeError("api должен содержать методы getTasks или loadInitialData.");
  }
  if (!view || typeof view !== "object" || typeof view.setTasks !== "function") {
    throw new TypeError("view должен содержать метод setTasks.");
  }

  const state = {
    tasks: [],
    categories: [],
    filters: {},
    editingId: null,
    categoriesLoaded: false,
    loadSeq: 0,
    loadController: null,
    destroyed: false,
    mutationPending: false,
  };

  function cancelActiveLoad() {
    if (state.loadController) {
      state.loadController.abort();
      state.loadController = null;
    }
  }

  function applyLoadedTasks(tasks, meta) {
    state.tasks = tasks;
    view.setTasks(state.tasks, state.categories);
    const total = meta && typeof meta.total === "number" ? meta.total : tasks.length;
    view.setTotal(total);
    view.setListState(tasks.length === 0 ? "empty" : "ready");
  }

  async function performLoad({ initial, silent }) {
    cancelActiveLoad();
    const seq = ++state.loadSeq;
    const controller = new AbortController();
    state.loadController = controller;
    if (!silent) view.setListState("loading");

    try {
      const result = initial
        ? await api.loadInitialData(state.filters, { signal: controller.signal })
        : await api.getTasks(state.filters, { signal: controller.signal });

      // Устаревший или отменённый ответ — молча выходим.
      if (seq !== state.loadSeq || state.destroyed) return false;

      if (initial) {
        state.categories = result.categories;
        state.categoriesLoaded = true;
        view.setCategories(state.categories);
      }
      applyLoadedTasks(result.tasks, result.meta);
      return true;
    } catch (error) {
      if (seq !== state.loadSeq || state.destroyed) return false;
      if (controller.signal.aborted) return false;
      if (isAbortError(error)) return false;
      view.setTasks([], state.categories);
      view.setTotal(0);
      view.setListState("error", messageForError(error));
      return false;
    } finally {
      if (state.loadController === controller) state.loadController = null;
    }
  }

  async function refreshInternal({ silent = false } = {}) {
    // Первая загрузка и retry до получения категорий — loadInitialData,
    // все последующие загрузки — getTasks.
    if (state.categoriesLoaded) {
      return performLoad({ initial: false, silent });
    }
    return performLoad({ initial: true, silent });
  }

  async function runMutation(action, successMessage) {
    if (state.mutationPending) return false;
    state.mutationPending = true;
    view.setMutationPending(true);
    try {
      await action();
      view.notify(successMessage, "success");
      await refreshInternal({ silent: true });
      return true;
    } catch (error) {
      view.notify(messageForError(error), "error");
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors) view.showFormErrors(fieldErrors);
      return false;
    } finally {
      state.mutationPending = false;
      view.setMutationPending(false);
    }
  }

  async function start(filters = {}) {
    state.filters = { ...filters };
    state.editingId = null;
    view.setFormTask(null);
    await performLoad({ initial: true, silent: false });
  }

  async function applyFilters(filters = {}) {
    // setFilters на view НЕ вызываем: форма уже обновлена в dom-app.js,
    // а URL-фильтр применён в main.js до создания контроллера.
    state.filters = { ...filters };
    await refreshInternal({ silent: false });
  }

  async function refresh() {
    await refreshInternal({ silent: false });
  }

  async function submit(draft) {
    if (state.mutationPending) return;
    const result = validateDraft(draft, state.categories);
    if (!result.valid) {
      view.showFormErrors(result.errors);
      return;
    }
    const value = result.value;
    const editingId = state.editingId;
    const wasEditing = editingId !== null;

    const ok = await runMutation(
      () => wasEditing ? api.updateTask(editingId, value) : api.createTask(value),
      wasEditing ? "Изменения сохранены." : "Задача создана.",
    );

    if (ok) {
      state.editingId = null;
      view.setFormTask(null);
      view.showFormErrors({});
    }
  }

  function beginEdit(id) {
    if (state.mutationPending) return;
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    state.editingId = id;
    view.setFormTask(task);
    view.showFormErrors({});
  }

  function cancelEdit() {
    state.editingId = null;
    view.setFormTask(null);
    view.showFormErrors({});
  }

  async function toggleTask(id) {
    if (state.mutationPending) return;
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    await runMutation(
      () => api.setTaskCompleted(id, !task.completed),
      task.completed ? "Задача возвращена в работу." : "Задача завершена.",
    );
  }

  async function deleteTask(id) {
    if (state.mutationPending) return;
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    const ok = await runMutation(() => api.deleteTask(id), "Задача удалена.");
    if (ok && state.editingId === id) {
      state.editingId = null;
      view.setFormTask(null);
      view.showFormErrors({});
    }
  }

  async function resetData() {
    if (state.mutationPending) return;
    await runMutation(() => api.resetDemoData(), "Данные восстановлены.");
  }

  function destroy() {
    state.destroyed = true;
    cancelActiveLoad();
  }

  return {
    start,
    applyFilters,
    refresh,
    submit,
    beginEdit,
    cancelEdit,
    toggleTask,
    deleteTask,
    resetData,
    destroy,
  };
}