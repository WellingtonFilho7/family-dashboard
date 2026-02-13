export const getDesktopOverrideFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  if (params.get('mode') === 'tv') return true;
  if (!params.has('desktop')) return null;
  return params.get('desktop') === '1';
};

export const resolveDesktopOverride = (search: string, storedValue: string | null) => {
  const fromSearch = getDesktopOverrideFromSearch(search);
  if (fromSearch !== null) return fromSearch;
  if (storedValue === '1') return true;
  if (storedValue === '0') return false;
  return false;
};
