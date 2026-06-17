/**
 * Variables and Data Types — Starter Code
 *
 * Complete the functions below. Each function has a description
 * of what it should do and some starter code.
 */

// 1. formatUser — use template literals
//    Input: formatUser("Alice", 25) → "User: Alice, Age: 25"
function formatUser(name, age) {
  // TODO: return a template string
}

// 2. getTypeDescription — return the typeof the input as a string
//    Input: getTypeDescription(42) → "number"
//    Input: getTypeDescription("hello") → "string"
//    Input: getTypeDescription([1,2,3]) → "object"
function getTypeDescription(value) {
  // TODO
}

// 3. createCounter — use let for mutable state
//    Returns an object with { increment(), decrement(), getValue() }
function createCounter(initial = 0) {
  // TODO: use let here

  return {
    increment() {
      // TODO
    },
    decrement() {
      // TODO
    },
    getValue() {
      // TODO
    },
  };
}

// 4. isMutable — return true if the value is a mutable reference type
//    (objects, arrays, functions), false for primitives
function isMutable(value) {
  // TODO
}

export { formatUser, getTypeDescription, createCounter, isMutable };
