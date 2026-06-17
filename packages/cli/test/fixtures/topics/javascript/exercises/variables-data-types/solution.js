/**
 * Variables and Data Types — Solution
 */

function formatUser(name, age) {
  return `User: ${name}, Age: ${age}`;
}

function getTypeDescription(value) {
  return typeof value;
}

function createCounter(initial = 0) {
  let count = initial;

  return {
    increment() {
      count += 1;
    },
    decrement() {
      count -= 1;
    },
    getValue() {
      return count;
    },
  };
}

function isMutable(value) {
  const type = typeof value;
  return type === 'object' || type === 'function';
}

export { formatUser, getTypeDescription, createCounter, isMutable };
