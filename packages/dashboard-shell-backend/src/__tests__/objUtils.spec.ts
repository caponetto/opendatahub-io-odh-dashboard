import { smartMergeArraysWithNameObjects } from '@odh-dashboard/dashboard-foundation-backend/objUtils';

describe('objUtils', () => {
  describe('smartMergeArraysWithNameObjects', () => {
    const smartMergeArraysWithNameObjectsWithUsedParams = (v1: any, v2: any) =>
      smartMergeArraysWithNameObjects(v1, v2, '' as any, {} as any, {} as any, undefined);

    it('should do nothing with nulls', () => {
      expect(smartMergeArraysWithNameObjectsWithUsedParams(null, null)).toBe(undefined);
    });

    it('should do nothing with objects', () => {
      expect(
        smartMergeArraysWithNameObjectsWithUsedParams({ a: true }, { a: false, b: true }),
      ).toBe(undefined);
    });

    it('should do nothing with string[]', () => {
      expect(smartMergeArraysWithNameObjectsWithUsedParams(['test'], ['test2'])).toBe(undefined);
    });

    it('should do nothing with invalid object arrays', () => {
      expect(
        smartMergeArraysWithNameObjectsWithUsedParams([{ id: 'test' }], [{ id: 'test2' }]),
      ).toBe(undefined);
    });

    it('should replace 2nd object if given two same correct objects arrays', () => {
      expect(
        smartMergeArraysWithNameObjectsWithUsedParams(
          [{ name: 'test', value: '1' }],
          [{ name: 'test', value: '2' }],
        ),
      ).toEqual([{ name: 'test', value: '2' }]);
    });

    it('should add 2nd object if given two different correct object arrays', () => {
      expect(
        smartMergeArraysWithNameObjectsWithUsedParams(
          [{ name: 'test', value: '1' }],
          [{ name: 'test2', value: '2' }],
        ),
      ).toEqual([
        { name: 'test', value: '1' },
        { name: 'test2', value: '2' },
      ]);
    });

    it('should replace and add as appropriate if given two correct object arrays', () => {
      expect(
        smartMergeArraysWithNameObjectsWithUsedParams(
          [
            { name: 'test', value: '1' },
            { name: 'test3', value: '3' },
          ],
          [
            { name: 'test', value: '1b' },
            { name: 'test2', value: '2' },
          ],
        ),
      ).toEqual([
        { name: 'test', value: '1b' },
        { name: 'test3', value: '3' },
        { name: 'test2', value: '2' },
      ]);
    });
  });
});
