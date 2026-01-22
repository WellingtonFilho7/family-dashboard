export const getVisibleWithOverflow = <T,>(items: T[], limit: number) => {
  const visible = items.slice(0, Math.max(0, limit));
  const overflow = Math.max(items.length - visible.length, 0);
  return { visible, overflow };
};
