// let counter = 0;

// function testCatch() {
//   try {
//     counter++;
//     if (counter > 5) {
//       console.log("try in testCatch Err", counter);
//       throw "counter >5 Err";
//     }
//   } catch (error) {
//     console.log("catch in testCatch Err", error);
//     throw error;
//   }
// }

// while (counter < 10) {
//   try {
//     testCatch();
//     console.log("WhileLoop", counter);
//   } catch (error) {
//     console.log("catch in whileLoop", counter);
//     break;
//   }
// }

let a = [
  { name: "a", type: "1" },
  { name: "b", type: "2" },
  { name: "c", type: "3" },
  { name: "d", type: "4" },
  { name: "e", type: "5" },
];

let b = [
  { name: "b", type: "b2" },
  { name: "a", type: "b1" },
  { name: "c", type: "3" },
];

function upsert(array1, obj, key) {
  const index = array1.findIndex((item) => item[`${key}`] === obj[`${key}`]);
  index > -1 ? (array1[index] = obj) : array1.push(obj);
}
// let testA = a["name"];
b.forEach((obj) => upsert(a, obj, "name"));
console.log(a);
