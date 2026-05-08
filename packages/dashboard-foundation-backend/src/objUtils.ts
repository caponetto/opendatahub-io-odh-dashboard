import { MergeWithCustomizer } from 'lodash';

/**
 * When given two object arrays that have "name" keys, replace when keys are the same, or add to
 * the end when new key.
 *
 * Note: returns `undefined` if invalid data is provided.
 *
 * @see mergeWith -- lodash mergeWith customizer
 */
export const smartMergeArraysWithNameObjects: MergeWithCustomizer = (objValue, srcValue) => {
  type GoodArray = { name: string }[];
  const isGoodArray = (v: unknown): v is GoodArray => Array.isArray(v) && v.length > 0 && v[0].name;
  if (isGoodArray(objValue) && isGoodArray(srcValue)) {
    return srcValue.reduce<GoodArray>((acc, elm) => {
      const key = elm.name;
      const index = acc.findIndex(({ name }) => name === key);
      if (index >= 0) {
        return acc.map((item, i) => (i === index ? elm : item));
      }
      return [...acc, elm];
    }, objValue);
  }
  return undefined;
};
