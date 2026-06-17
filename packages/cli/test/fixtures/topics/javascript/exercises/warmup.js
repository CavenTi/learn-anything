// Warmup exercise: Quick type-checking practice
// Run: node warmup.js

function typeCheck(value) {
  return typeof value;
}

// Test cases
console.log(typeCheck(42) === 'number');
console.log(typeCheck('hello') === 'string');
console.log(typeCheck(true) === 'boolean');
console.log(typeCheck(undefined) === 'undefined');
console.log(typeCheck(null) === 'object'); // known quirk
console.log(typeCheck({}) === 'object');
console.log(typeCheck([]) === 'object'); // arrays are objects
console.log(typeCheck(() => {}) === 'function');
