export const ALL = "*ALL*";

export const groupBy = <T extends { [key: string]: any }>(
  list: T[],
  key: string,
  valueCompareFn?: (a: T, b: T) => number
): Map<string, T[]> => {
  const sorted = sortObject(
    list.reduce((aggregate: { [key: string]: T[] }, current) => {
      (aggregate[current[key]] = aggregate[current[key]] || []).push(current);
      return aggregate;
    }, {})
  );
  for (const values of sorted.values()) {
    values.sort(valueCompareFn);
  }
  return sorted;
};

export const sortObject = <T>(unordered: {
  [key: string]: T;
}): Map<string, T> =>
  Object.keys(unordered)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .reduce((obj, key) => {
      obj.set(key, unordered[key]);
      return obj;
    }, new Map());

export const unique = (
  duplicates: object[],
  groupBy: string,
  keyToReplace: string,
  replaceValue: string
) =>
  duplicates
    .filter(
      (obj, index) =>
        index === duplicates.findIndex((o) => obj[groupBy] === o[groupBy])
    )
    .map((obj) => ({ ...obj, ...{ [keyToReplace]: replaceValue } }));
