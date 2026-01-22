export const isDebugEnabled = (search: string) => {
  const params = new URLSearchParams(search);
  return params.get('debug') === '1';
};
