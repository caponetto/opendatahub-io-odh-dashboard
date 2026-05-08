import type { K8sStatus } from './types';

const isRecord = (data: unknown): data is Record<string, unknown> =>
  !!data && typeof data === 'object';

export const isK8sStatus = (data: unknown): data is K8sStatus =>
  isRecord(data) &&
  data.kind === 'Status' &&
  ('message' in data || 'status' in data || 'code' in data);

export class K8sStatusError extends Error {
  public statusObject: K8sStatus & { details?: { kind?: string } };

  constructor(statusObject: K8sStatus) {
    super(
      statusObject.message ||
        `Kubernetes request failed with status ${statusObject.code ?? 'unknown'}`,
    );
    this.name = 'K8sStatusError';
    this.statusObject = statusObject;
  }
}
