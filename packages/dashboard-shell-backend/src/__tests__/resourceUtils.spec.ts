import {
  OdhPlatformType,
  DataScienceClusterKindStatus,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';

const mockGetClusterStatus = jest.fn<DataScienceClusterKindStatus | undefined, [unknown]>();

jest.mock('@odh-dashboard/dashboard-foundation-backend/resourceUtils', () => {
  const { OdhPlatformType: PT } = jest.requireActual(
    '@odh-dashboard/dashboard-foundation-backend/backendTypes',
  );
  return {
    getClusterStatus: (...args: unknown[]) => mockGetClusterStatus(args[0]),
    isRHOAI: (fastify: unknown): boolean => {
      const releaseName = mockGetClusterStatus(fastify)?.release?.name;
      return releaseName === PT.SELF_MANAGED_RHOAI || releaseName === PT.MANAGED_RHOAI;
    },
  };
});

import { isRHOAI } from '@odh-dashboard/dashboard-foundation-backend/resourceUtils';

describe('resourceUtils', () => {
  describe('isRHOAI', () => {
    const mockFastify = { log: { error: jest.fn() } } as any;
    const mockStatus = (name: string): DataScienceClusterKindStatus => ({
      conditions: [
        {
          type: 'Ready',
          status: 'True',
        },
      ],
      components: {},
      phase: 'Running',
      release: {
        name,
      },
    });

    afterEach(() => {
      mockGetClusterStatus.mockReset();
    });

    it('returns true for Self-managed RHOAI', () => {
      mockGetClusterStatus.mockReturnValue(mockStatus(OdhPlatformType.SELF_MANAGED_RHOAI));
      expect(isRHOAI(mockFastify)).toBe(true);
    });

    it('returns true for Managed RHOAI', () => {
      mockGetClusterStatus.mockReturnValue(mockStatus(OdhPlatformType.MANAGED_RHOAI));
      expect(isRHOAI(mockFastify)).toBe(true);
    });

    it('returns false for Opendatahub', () => {
      mockGetClusterStatus.mockReturnValue(mockStatus(OdhPlatformType.OPEN_DATA_HUB));
      expect(isRHOAI(mockFastify)).toBe(false);
    });

    it('returns false when error', () => {
      mockGetClusterStatus.mockReturnValue(undefined);
      expect(isRHOAI(mockFastify)).toBe(false);
    });
  });
});
