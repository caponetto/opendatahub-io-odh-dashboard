export enum PeriodicOptions {
  MINUTE = 'Minute',
  HOUR = 'Hour',
  DAY = 'Day',
  WEEK = 'Week',
}

export const periodicOptionAsSeconds: Record<PeriodicOptions, number> = {
  [PeriodicOptions.MINUTE]: 60,
  [PeriodicOptions.HOUR]: 60 * 60,
  [PeriodicOptions.DAY]: 24 * 60 * 60,
  [PeriodicOptions.WEEK]: 7 * 24 * 60 * 60,
};

export type RunDateTime = { date: string; time: string };
