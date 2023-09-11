export function splitOne(str, delim, defaultVal = "") {
  const index = str.indexOf(delim);
  if (index === -1) {
    return [str, defaultVal];
  }
  return [str.slice(0, index), str.slice(index + 1)];
}
