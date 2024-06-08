export const groupBy = <T extends { [key: string]: any }>(
  list: T[],
  key: string,
  valuesCol: string
): { [group: string]: T[] } => {
  const sorted = sortObject(
    list.reduce((aggregate: { [key: string]: T[] }, current) => {
      (aggregate[current[key]] = aggregate[current[key]] || []).push(current);
      return aggregate;
    }, {})
  );
  for (const values of Object.values(sorted)) {
    values.sort((ic1, ic2) => ic1[valuesCol].localeCompare(ic2[valuesCol]));
  }
  return sorted;
};

export const sortObject = <T>(unordered: {
  [key: string]: T;
}): { [key: string]: T } =>
  Object.keys(unordered)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unordered[key];
      return obj;
    }, {});
