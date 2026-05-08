import type { ComponentType, SVGProps } from 'react';
import type { LabelProps } from '@patternfly/react-core';

export enum KueueWorkloadStatus {
  Queued = 'Queued',
  Failed = 'Failed',
  Preempted = 'Preempted',
  Inadmissible = 'Inadmissible',
  Running = 'Running',
  Admitted = 'Admitted',
  Complete = 'Complete',
}

export type KueueWorkloadStatusWithMessage = {
  status: KueueWorkloadStatus;
  message?: string;
  timestamp?: string;
  queueName?: string;
};

export type KueueStatusInfo = {
  label: string;
  status?: LabelProps['status'];
  color?: LabelProps['color'];
  IconComponent: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName?: string;
};

export const KUEUE_STATUSES_OVERRIDE_WORKBENCH: KueueWorkloadStatus[] = [
  KueueWorkloadStatus.Queued,
  KueueWorkloadStatus.Inadmissible,
  KueueWorkloadStatus.Failed,
  KueueWorkloadStatus.Preempted,
  KueueWorkloadStatus.Complete,
];
