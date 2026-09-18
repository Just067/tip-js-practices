"use strict";

const totalTasks = 10;
const completedTasks = 7;
const dailyLimit = 4;

if (typeof totalTasks !== 'number' || typeof completedTasks !== 'number') {
    console.log("Ошибка: вместо числа передана строка.");
} 

else if (Number.isNaN(totalTasks) || Number.isNaN(completedTasks)) {
    console.log("Ошибка: недопустимое числовое значение.");
} 

else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
    console.log("Ошибка: дробное количество.");
} 

else if (totalTasks < 0 || completedTasks < 0) {
    console.log("Ошибка: отрицательное количество.");
} 

else if (totalTasks > 1000) {
    console.log("Ошибка: превышена верхняя граница.");
} 

else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше, чем существует.");
} 

else if (totalTasks === 0 && completedTasks === 0) {
    console.log("Задач пока нет");
}
else if (dailyLimit > 1000)  {
    console.log("Ошибка: превышена верхняя граница нормы")
}
else if (dailyLimit < 1) {
    console.log("Ошибка: цикл не запускается")
}
else if (!Number.isInteger(dailyLimit)) {
    console.log("Ошибка: дробной дневной нормы быть не должно")
}
else if (typeof dailyLimit !== 'number') {
    console.log("Ошибка: дневная норма задана строкой.");
}
else {
    let remainingTasks = totalTasks - completedTasks;
    
    if (remainingTasks === 0) {
        console.log("Все задачи уже выполнены.");
        console.log("Потребуется дней: 0");
    }
    else {
        console.log(`Осталось задач: ${remainingTasks}`);
        let days = 0;
        
        while (remainingTasks > 0) {
            days++;
            const tasksToday = Math.min(remainingTasks, dailyLimit);
            remainingTasks -= tasksToday;
            
            console.log(`День ${days}: выполнено ${tasksToday}, осталось ${remainingTasks}`);
        }
        
        console.log(`Потребуется дней: ${days}`);
    }
}