export type PlatformStatus = {
  enabled: boolean;
  installed: boolean;
};

export type ServingPlatformStatuses = {
  kServe: PlatformStatus;
  kServeNIM: PlatformStatus;
  platformEnabledCount: number;
  refreshNIMAvailability: () => Promise<boolean | undefined>;
};

export type ModelStatus = {
  failedToSchedule: boolean;
  failureMessage?: string | null;
};
