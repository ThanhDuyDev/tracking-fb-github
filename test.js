// import { nextAcc } from "./crawFunc";

let counterTest = 0;

export function testA(page) {
  counterTest++;
  console.log(`testA from ${page.url()}`, counterTest);
}

export function testB(page) {
  counterTest++;
  console.log(`testB from ${page.url()}`, counterTest);
}

console.log("Global", counterTest);
// const acc = [{ a: "1" }, { b: "2" }, { c: "3" }, { d: "4" }];
// let b = acc.some((_, i) => {
//   acc[i] === "1", console.log("In accSome", acc[i]);
// });
// console.log(b);
// testA(),
// testB()

let counter = 0;

while (counter < 5) {
  counter++;
}
console.log(counter, "afterWhile");
