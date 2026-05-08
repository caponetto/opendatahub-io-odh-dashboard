export enum ServingRuntimeVersionStatusLabel {
  LATEST = 'Latest',
  OUTDATED = 'Outdated',
}

export const getServingRuntimeVersionStatus = (
  servingRuntimeVersion: string | undefined,
  templateVersion: string | undefined,
): string | undefined => {
  if (!servingRuntimeVersion || !templateVersion) {
    return undefined;
  }
  return servingRuntimeVersion === templateVersion
    ? ServingRuntimeVersionStatusLabel.LATEST
    : ServingRuntimeVersionStatusLabel.OUTDATED;
};
