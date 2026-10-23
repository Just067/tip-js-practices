import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
  addTask,
  findTaskById,
  removeTask,
  setTaskCompleted,
  updateTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderEmptyState, renderSummary, renderTaskList } from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import { loadTasks, removeSavedTasks, saveTasks } from "./task-storage.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
  storageStatus: document.querySelector("#storage-status"),
  form: document.querySelector("#task-form"),
  formHeading: document.querySelector("#form-heading"),
  formMode: document.querySelector("#form-mode"),
  formMessage: document.querySelector("#form-message"),
  idInput: document.querySelector("#task-id"),
  titleInput: document.querySelector("#task-title"),
  priorityInput: document.querySelector("#task-priority"),
  submitButton: document.querySelector("#form-submit"),
  cancelButton: document.querySelector("#cancel-edit"),
  resetButton: document.querySelector("#reset-data"),
};

const params = new URLSearchParams(window.location.search);
const isVariant = params.get("dataset") === "variant";
const isCheckRun = params.get("mode") === "check";
const initialTasks = isVariant ? variantTasks : demoTasks;
const datasetName = isVariant ? "variant" : "demo";
const storageKey = isCheckRun
  ? `tip-js-practice-04:checks:${datasetName}`
  : `tip-js-practice-04:${datasetName}`;

// Готовая граница запуска: даже незавершённый или ошибочный модуль хранилища
// не должен оставлять страницу без диагностического сообщения.
let loaded;
try {
  loaded = loadTasks(window.localStorage, storageKey, initialTasks);
} catch (error) {
  loaded = {
    ok: false,
    source: "fallback",
    tasks: initialTasks.map((task) => ({ ...task })),
    error: `Хранилище не инициализировано: ${error.message}`,
  };
  console.error(error);
}
let currentTasks = loaded.tasks;
let currentFilter = "all";
let editingId = null;

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

if (loaded.source === "storage") {
  elements.storageStatus.textContent = "Данные восстановлены из localStorage.";
} else if (loaded.ok) {
  elements.storageStatus.textContent = "Используется исходный набор; сохранённых данных пока нет.";
} else {
  elements.storageStatus.textContent = loaded.error;
  elements.storageStatus.classList.add("is-warning");
}

function renderApp() {
  const visible = getVisibleTasks(currentTasks, currentFilter);

  renderTaskList(elements.list, visible);
  renderSummary(elements.summary, currentTasks, visible.length);
  renderEmptyState(elements.empty, currentTasks.length, visible.length);

  elements.filters
    .querySelectorAll("button[data-filter]")
    .forEach((btn) => {
      const isActive = btn.dataset.filter === currentFilter;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
}

function clearFieldError(name) {
  const input = elements.form.elements.namedItem(name);
  const message = elements.form.querySelector(`[data-error-for="${name}"]`);
  if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
    input.setCustomValidity("");
    input.removeAttribute("aria-invalid");
  }
  if (message) message.textContent = "";
}

function clearFormErrors() {
  for (const name of ["id", "title", "priority"]) clearFieldError(name);
  elements.formMessage.textContent = "";
}

function showFormErrors(errors) {
  clearFormErrors();
  for (const [name, text] of Object.entries(errors)) {
    const input = elements.form.elements.namedItem(name);
    const message = elements.form.querySelector(`[data-error-for="${name}"]`);
    if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
      input.setCustomValidity(text);
      input.setAttribute("aria-invalid", "true");
    }
    if (message) message.textContent = text;
  }
  elements.form.reportValidity();
}

function setFormMode(id = null) {
  if (id === null) {
    editingId = null;
    elements.form.reset();
    clearFormErrors();
    elements.idInput.disabled = false;
    elements.formHeading.textContent = "Добавление задачи";
    elements.submitButton.textContent = "Добавить задачу";
    elements.cancelButton.hidden = true;
    if (elements.formMode) elements.formMode.textContent = "Создание";
    elements.idInput.focus();
    return;
  }

  const task = findTaskById(currentTasks, id);
  if (!task) {
    elements.message.textContent = `Не удалось перейти к редактированию: задача #${id} не найдена.`;
    return;
  }

  editingId = id;
  clearFormErrors();
  elements.idInput.value = String(task.id);
  elements.titleInput.value = task.title;
  elements.priorityInput.value = task.priority;
  elements.idInput.disabled = true;
  elements.formHeading.textContent = "Редактирование задачи";
  elements.submitButton.textContent = "Сохранить изменения";
  elements.cancelButton.hidden = false;
  if (elements.formMode) elements.formMode.textContent = `Редактирование #${id}`;
  elements.titleInput.focus();
}

function persistCurrentTasks(successMessage) {
  const saved = saveTasks(window.localStorage, storageKey, currentTasks);
  elements.storageStatus.classList.toggle("is-warning", !saved.ok);
  elements.storageStatus.textContent = saved.ok
    ? "Изменения сохранены в localStorage."
    : saved.error;
  elements.message.textContent = saved.ok ? successMessage : `${successMessage} ${saved.error}`;
  renderApp();
  return saved;
}

// Готовая вспомогательная функция из логики ПР3. После полной перерисовки
// возвращает фокус на действие той же задачи либо на активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const draft = {
    id: formData.get("id"),
    title: formData.get("title"),
    priority: formData.get("priority"),
  };

  const validation = validateTaskDraft(draft, currentTasks, editingId);
  if (!validation.ok) {
    showFormErrors(validation.errors);
    return;
  }

  const { id, title, priority } = validation.value;
  const wasEditing = editingId !== null;

  const result = wasEditing
    ? updateTask(currentTasks, id, title, priority)
    : addTask(currentTasks, id, title, priority);

  if (!result.ok) {
    // Защита границы: сервис тоже валидирует, даже если чистая проверка прошла.
    showFormErrors({ id: result.error });
    return;
  }

  currentTasks = result.tasks;
  setFormMode(); // очистка формы и выход из режима редактирования
  persistCurrentTasks(wasEditing ? "Задача обновлена." : "Задача добавлена.");
}

function handleTaskListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest("[data-task-id]");
  if (!card) return;
  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) return;
  const action = button.dataset.action;

  if (action === "edit") {
    setFormMode(id);
    return;
  }

  if (action === "toggle") {
    const task = findTaskById(currentTasks, id);
    if (!task) return;
    const result = setTaskCompleted(currentTasks, id, !task.completed);
    if (!result.ok) {
      elements.message.textContent = result.error;
      return;
    }
    currentTasks = result.tasks;
    persistCurrentTasks("Статус задачи изменён.");
    restoreTaskFocus(id, "toggle");
    return;
  }

  if (action === "delete") {
    const result = removeTask(currentTasks, id);
    if (!result.ok) {
      elements.message.textContent = result.error;
      return;
    }
    const wasEditingDeleted = editingId === id;
    currentTasks = result.tasks;
    if (wasEditingDeleted) setFormMode();
    persistCurrentTasks("Задача удалена.");
    restoreTaskFocus(id, "delete");
    return;
  }
}

function handleFilterClick(event) {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  const filter = button.dataset.filter;
  if (!["all", "pending", "completed"].includes(filter)) return;
  currentFilter = filter;
  renderApp();
  button.focus();
}

function handleResetClick() {
  const result = removeSavedTasks(window.localStorage, storageKey);
  if (!result.ok) {
    elements.storageStatus.textContent = result.error;
    elements.storageStatus.classList.add("is-warning");
    elements.message.textContent = `Не удалось удалить сохранённые данные: ${result.error}`;
    return;
  }

  currentTasks = initialTasks.map((task) => ({ ...task }));
  currentFilter = "all";
  setFormMode();
  elements.storageStatus.classList.remove("is-warning");
  elements.storageStatus.textContent =
    "Сохранённые данные удалены; используется исходный набор.";
  elements.message.textContent = "Данные сброшены к исходному набору.";
  renderApp();
}

elements.form.addEventListener("submit", handleFormSubmit);
elements.form.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    clearFieldError(event.target.name);
  }
});
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.cancelButton.addEventListener("click", () => setFormMode());
elements.resetButton.addEventListener("click", handleResetClick);

try {
  setFormMode();
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}
