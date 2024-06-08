export const groupBy = <T extends { [key: string]: any }>(
  list: T[],
  key: string,
  valueCompareFn?: (a: T, b: T) => number
): { [group: string]: T[] } => {
  const sorted = sortObject(
    list.reduce((aggregate: { [key: string]: T[] }, current) => {
      (aggregate[current[key]] = aggregate[current[key]] || []).push(current);
      return aggregate;
    }, {})
  );
  for (const values of Object.values(sorted)) {
    values.sort(valueCompareFn);
  }
  return sorted;
};

export const sortObject = <T>(unordered: {
  [key: string]: T;
}): { [key: string]: T } =>
  Object.keys(unordered)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .reduce((obj, key) => {
      obj[key] = unordered[key];
      return obj;
    }, {});
