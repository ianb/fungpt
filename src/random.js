export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function pickMany(array, count = 1) {
  // Picks count number of unique elements from the array
  let result = [];
  let indices = [];
  while (result.length < count) {
    let index = Math.floor(Math.random() * array.length);
    if (!indices.includes(index)) {
      result.push(array[index]);
      indices.push(index);
    }
  }
  return result;
}
