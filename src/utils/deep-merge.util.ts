export function deepMerge<T extends Record<string, any>>(
  ...objs: (Record<string, any> | undefined)[]
): T {
  const isObject = (item: any): item is Record<string, any> => {
    return item && typeof item === 'object' && !Array.isArray(item);
  };

  return objs.reduce(
    (prev, current) => {
      if (!current) return prev;

      const p = prev as Record<string, any>;
      const c = current as Record<string, any>;

      Object.keys(c).forEach((key) => {
        if (isObject(p[key]) && isObject(c[key])) {
          p[key] = deepMerge(p[key], c[key]);
        } else {
          p[key] = c[key];
        }
      });

      return p;
    },
    {} as Record<string, any>,
  ) as T;
}
