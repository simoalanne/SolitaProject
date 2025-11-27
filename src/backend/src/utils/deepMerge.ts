/**
 * Deeply merges two objects together. Note that this is not type-safe the cast is just a convenience.
 * @param a - The base object.
 * @param b - The object to merge into the base object.
 * @returns The merged object casted to the type of the base object.
 */
const deepMerge = <T>(a: any, b: any): T => {
  if (!b) return a;
  const out = structuredClone(a);
  Object.entries(b).forEach(([k, v]) => {
    out[k] =
      v && typeof v === "object" && !Array.isArray(v)
        ? deepMerge(out[k] ?? {}, v)
        : v;
  });
  return out as T;
};

export default deepMerge;
