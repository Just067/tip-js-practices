import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

// ============================================================
// 1. ОБЩИЙ СЦЕНАРИЙ (раздел 6.5) — на demoTasks
// ============================================================
console.log("=".repeat(70));
console.log("ПР2. Общий демонстрационный сценарий (demoTasks)");
console.log("=".repeat(70));

console.log("\n[Инфо] Задач в общем наборе:", demoTasks.length);
console.log("[Инфо] Номер варианта:", variantNumber);
console.log("[Инфо] Задач в наборе варианта:", variantTasks.length);

let currentTasks = demoTasks;

// --- Шаг 1. Исходные данные ---
console.log("\n--- Шаг 1. Исходные данные ---");
console.table(currentTasks);
const { total, completed, pending, progress } = getTaskStats(currentTasks);
console.log(`Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
if (total === 0) {
  console.log("Задач пока нет");
} else {
  console.log(`Прогресс: ${progress.toFixed(1)}%`);
}

// --- Шаг 2. Чтение ---
console.log("\n--- Шаг 2. Чтение ---");
console.log("findTaskById(4):", findTaskById(currentTasks, 4));
console.log("getPendingTasks:", getPendingTasks(currentTasks));
console.log("getTaskTitles:", getTaskTitles(currentTasks));

// --- Шаг 3. Добавление ---
console.log("\n--- Шаг 3. Добавить задачу id=20 (priority='high') ---");
const addResult = addTask(currentTasks, 20, "Добавить проверку", "high");
if (addResult.ok) {
  currentTasks = addResult.tasks;
  console.log("Успех. Сводка:", getTaskStats(currentTasks));
} else {
  console.log("Ошибка:", addResult.error);
}

console.log("\n--- Шаг 3a. Попытка добавить id=20 повторно (ожидается отказ) ---");
const dup = addTask(currentTasks, 20, "Дубликат", "high");
if (dup.ok) {
  currentTasks = dup.tasks;
} else {
  console.error("Ошибка:", dup.error);
}

// --- Шаг 4. Установить completed=true для id=4 ---
console.log("\n--- Шаг 4. completed=true для id=4 ---");
const completeResult = setTaskCompleted(currentTasks, 4, true);
if (completeResult.ok) {
  currentTasks = completeResult.tasks;
  console.log("Успех. Сводка:", getTaskStats(currentTasks));
} else {
  console.log("Ошибка:", completeResult.error);
}

// --- Шаг 5. Переименовать id=10 ---
console.log("\n--- Шаг 5. Переименовать id=10 ---");
const renameResult = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (renameResult.ok) {
  currentTasks = renameResult.tasks;
  console.log("Успех. Сводка:", getTaskStats(currentTasks));
} else {
  console.log("Ошибка:", renameResult.error);
}

// --- Шаг 6. Удалить id=7 ---
console.log("\n--- Шаг 6. Удалить id=7 ---");
const removeResult = removeTask(currentTasks, 7);
if (removeResult.ok) {
  currentTasks = removeResult.tasks;
  console.log("Успех. Сводка:", getTaskStats(currentTasks));
} else {
  console.log("Ошибка:", removeResult.error);
}

// --- Шаг 7. Итог ---
console.log("\n--- Шаг 7. Итоговое состояние ---");
console.table(currentTasks);

// Контроль иммутабельности demoTasks
const demoUnchanged =
  demoTasks.length === 4 &&
  demoTasks[0].id === 1 &&
  demoTasks[1].id === 4 &&
  demoTasks[2].id === 7 &&
  demoTasks[3].id === 10 &&
  demoTasks[2].completed === false;
console.log("demoTasks не мутирован:", demoUnchanged);



// ============================================================
// 2. ИНДИВИДУАЛЬНЫЙ СЦЕНАРИЙ. ВАРИАНТ 7
//    «Подготовка учебного релиза»
// ============================================================
console.log("\n" + "=".repeat(70));
console.log(`Вариант ${variantNumber}: Подготовка учебного релиза`);
console.log("=".repeat(70));

let variantCurrent = variantTasks;

// --- Шаг 1. Исходные данные и сводка ---
console.log("\n--- Шаг 1. Исходные данные и сводка ---");
console.table(variantCurrent);
console.log("Сводка:", getTaskStats(variantCurrent));

// --- Шаг 2. Добавить id=80 с приоритетом high ---
console.log("\n--- Шаг 2. Добавить id=80 (priority='high') ---");
const vAdd = addTask(variantCurrent, 80, "Финальная проверка релиза", "high");
if (vAdd.ok) {
  variantCurrent = vAdd.tasks;
  console.log("Успех. Сводка:", getTaskStats(variantCurrent));
} else {
  console.log("Ошибка:", vAdd.error);
}

// --- Шаг 3. completed=true для id=11 ---
console.log("\n--- Шаг 3. completed=true для id=11 ---");
const vComplete = setTaskCompleted(variantCurrent, 11, true);
if (vComplete.ok) {
  variantCurrent = vComplete.tasks;
  console.log("Успех. Сводка:", getTaskStats(variantCurrent));
} else {
  console.log("Ошибка:", vComplete.error);
}

// --- Шаг 4. Переименовать id=23 (остальные поля сохранить) ---
console.log("\n--- Шаг 4. Переименовать id=23 ---");
const vRename = renameTask(variantCurrent, 23, "Собрать подписанную сборку");
if (vRename.ok) {
  variantCurrent = vRename.tasks;
  console.log("Задача id=23:", findTaskById(variantCurrent, 23));
} else {
  console.log("Ошибка:", vRename.error);
}

// --- Шаг 5. Удалить id=37 ---
console.log("\n--- Шаг 5. Удалить id=37 ---");
const vRemove = removeTask(variantCurrent, 37);
if (vRemove.ok) {
  variantCurrent = vRemove.tasks;
  console.log("Успех. Сводка:", getTaskStats(variantCurrent));
} else {
  console.log("Ошибка:", vRemove.error);
}

// --- Шаг 6. Повторное добавление id=80 (ожидается отказ) ---
console.log("\n--- Шаг 6. Повторное добавление id=80 (ожидается отказ) ---");
const vLengthBefore = variantCurrent.length;
const vDuplicate = addTask(variantCurrent, 80, "Дубликат релиза", "high");
console.log("Результат:", vDuplicate);
console.log(
  "Длина списка не изменилась:",
  variantCurrent.length === vLengthBefore
);

// --- Шаг 7. Итог и подтверждение сохранности variantTasks ---
console.log("\n--- Шаг 7. Итоговое состояние набора варианта ---");
console.table(variantCurrent);
console.log("Сводка:", getTaskStats(variantCurrent));

console.log("\n[Проверка] variantTasks не был мутирован:");
console.table(variantTasks);

const variantUnchanged =
  variantTasks.length === 6 &&
  variantTasks[0].id === 11 &&
  variantTasks[1].id === 23 &&
  variantTasks[2].id === 37 &&
  variantTasks[3].id === 41 &&
  variantTasks[4].id === 58 &&
  variantTasks[5].id === 64 &&
  variantTasks.every((t) => t.completed === true);
console.log("variantTasks сохранён корректно:", variantUnchanged);