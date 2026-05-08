import { z } from 'zod';
import {
  SchedulingType,
  TolerationEffect,
  TolerationOperator,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  baseIdentifierSchema,
  identifierSchema,
  createHardwareProfileWarningSchema,
} from '#~/concepts/hardwareProfiles/pages/utils';
import {
  HARDWARE_PROFILE_DISPLAY_NAME_CHAR_LIMIT,
  HARDWARE_PROFILE_DESCRIPTION_CHAR_LIMIT,
} from './const';

export { baseIdentifierSchema, identifierSchema, createHardwareProfileWarningSchema };

const k8sNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

export const tolerationSchema = z.object({
  key: z.string().trim().min(1, 'Key is required'),
  operator: z.nativeEnum(TolerationOperator).optional(),
  value: z.string().optional(),
  effect: z.nativeEnum(TolerationEffect).optional(),
  tolerationSeconds: z.number().optional(),
});

export const nodeSelectorSchema = z.record(z.string().min(1), z.string().min(1));

export const schedulingSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(SchedulingType.QUEUE),
    kueue: z.object({
      localQueueName: z.string().min(1, 'Local queue name is required'),
      priorityClass: z.string().optional(),
    }),
    node: z.never().optional(),
  }),
  z.object({
    type: z.literal(SchedulingType.NODE),
    node: z.object({
      nodeSelector: nodeSelectorSchema.optional(),
      tolerations: z.array(tolerationSchema).optional(),
    }),
    kueue: z.never().optional(),
  }),
]);

export const manageHardwareProfileValidationSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(
      HARDWARE_PROFILE_DISPLAY_NAME_CHAR_LIMIT,
      `Display name cannot exceed ${HARDWARE_PROFILE_DISPLAY_NAME_CHAR_LIMIT} characters`,
    ),
  enabled: z.boolean(),
  identifiers: z.array(identifierSchema),
  name: z.string().trim().min(1).max(253).regex(k8sNameRegex),
  description: z
    .string()
    .max(
      HARDWARE_PROFILE_DESCRIPTION_CHAR_LIMIT,
      `Description cannot exceed ${HARDWARE_PROFILE_DESCRIPTION_CHAR_LIMIT} characters`,
    )
    .optional(),
  visibility: z.array(z.string()),
  scheduling: schedulingSchema.optional(),
});
