export const groupBy = <T extends { [key: string]: any }>(
  list: T[],
  key: string
): { [group: string]: T[] } =>
  list.reduce((aggregate: { [key: string]: T[] }, current) => {
    (aggregate[current[key]] = aggregate[current[key]] || []).push(current);
    return aggregate;
  }, {});
