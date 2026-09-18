"use strict";

const r1 = "8" + 2;
console.log("Результат 1:", r1);
console.log("Тип результата 1:", typeof r1);

const r2 = "8" - 2;
console.log("Результат 2:", r2);
console.log("Тип результата 2:", typeof r2);

const r3 = Number("8") + 2;
console.log("Результат 3:", r3);
console.log("Тип результата 3:", typeof r3);

const r4 = "12" > "3";
console.log("Результат 4:", r4);
console.log("Тип результата 4:", typeof r4);

const r5 = 12 === "12";
console.log("Результат 5:", r5);
console.log("Тип результата 5:", typeof r5);

const r6 = Number("");
console.log("Результат 6:", r6);
console.log("Тип результата 6:", typeof r6);

const r7 = Number("text");
console.log("Результат 7:", r7);
console.log("Тип результата 7:", typeof r7);

const r8 = Boolean("false");
console.log("Результат 8:", r8);
console.log("Тип результата 8:", typeof r8);

const r9 = typeof null;
console.log("Значение выражения 9:", r9);
console.log("Тип результата 9:", typeof r9);

const r10 = typeof NaN;
console.log("Значение выражения 10:", r10);
console.log("Тип результата 10:", typeof r10);