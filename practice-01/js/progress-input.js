"use strict";

const totalTasks = "10";
const completedTasks = "7";

if (typeof totalTasks !== 'string' || typeof completedTasks !== 'string') {
    console.log("Ошибка: входные данные должны быть строками.");
}
else {

    const trimmedTotal = totalTasks.trim();
    const trimmedCompleted = completedTasks.trim();

    if (trimmedTotal === "" || trimmedCompleted === "") {
        console.log("Ошибка: пустая строка.");
    }
    else {

        const total = Number(trimmedTotal);
        const completed = Number(trimmedCompleted);

        if (Number.isNaN(total) || Number.isNaN(completed)) {
            console.log("Ошибка: недопустимое числовое значение.");
        }

        else if (!Number.isInteger(total) || !Number.isInteger(completed)) {
            console.log("Ошибка: дробное количество.");
        }

        else if (total < 0 || completed < 0) {
            console.log("Ошибка: отрицательное количество.");
        }

        else if (total > 1000) {
            console.log("Ошибка: превышена верхняя граница.");
        }

        else if (completed > total) {
            console.log("Ошибка: выполнено больше, чем существует.");
        }

        else if (total === 0 && completed === 0) {
            console.log("Задач пока нет");
        }

        else {
            const remainingTasks = total - completed;
            const percentage = (completed / total) * 100;
            let status = "";

            if (completed === 0) {
                status = "Не начато";
            } else if (completed === total) {
                status = "Завершено";
            } else {
                status = "В работе";
            }

            console.log(`Всего задач: ${total}`);
            console.log(`Выполнено: ${completed}`);
            console.log(`Осталось: ${remainingTasks}`);
            console.log(`Прогресс: ${percentage.toFixed(1)}%`);
            console.log(`Статус: ${status}`);
        }
    }
}