export const cropString = (value: string, cropValue: number = 35) => {
  return value.length > cropValue
    ? value.substring(0, cropValue) + '...'
    : value;
};
