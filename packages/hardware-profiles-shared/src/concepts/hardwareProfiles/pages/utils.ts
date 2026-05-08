import {
  HardwareProfileFeatureVisibility,
  HardwareProfileKind,
  LocalQueueKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  DisplayNameAnnotation,
  Identifier,
  IdentifierResourceType,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  CPU_UNITS,
  MEMORY_UNITS_FOR_SELECTION,
  OTHER,
  splitValueUnit,
  UnitOption,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/valueUnits';
import { z, type ZodEffects } from 'zod';
import {
  HardwareProfileWarningType,
  WarningNotification,
} from '#~/concepts/hardwareProfiles/types';
import { HARDWARE_PROFILES_MISSING_CPU_MEMORY_MESSAGE } from '#~/concepts/hardwareProfiles/const';
import {
  DEFAULT_CPU_IDENTIFIER,
  DEFAULT_MEMORY_IDENTIFIER,
  DEFAULT_PROFILE_NAME,
} from '#~/concepts/hardwareProfiles/constants';
import {
  validateDefaultCount,
  validateMaxCount,
  validateMinCount,
} from '#~/concepts/hardwareProfiles/pages/nodeResourceValidationUtils';

/** @shared — also used by hardware-profiles ManageNodeResourceSection */
export const hasCPUandMemory = (nodeResources: Identifier[]): boolean =>
  nodeResources.some(
    (identifier) =>
      identifier.resourceType === IdentifierResourceType.CPU ||
      identifier.identifier === DEFAULT_CPU_IDENTIFIER,
  ) &&
  nodeResources.some(
    (identifier) =>
      identifier.resourceType === IdentifierResourceType.MEMORY ||
      identifier.identifier === DEFAULT_MEMORY_IDENTIFIER,
  );

export enum HardwareProfileBannerWarningTitles {
  ALL_INVALID = 'All hardware profiles are invalid',
  ALL_DISABLED = 'All hardware profiles are disabled',
  SOME_INVALID = 'One or more hardware profiles are invalid',
  ALL_INCOMPLETE = 'All hardware profiles are incomplete',
  SOME_INCOMPLETE = 'One or more hardware profiles are incomplete',
}

export const determineIdentifierUnit = (nodeResource: Identifier): UnitOption[] => {
  if (
    nodeResource.resourceType === IdentifierResourceType.CPU ||
    nodeResource.identifier === DEFAULT_CPU_IDENTIFIER
  ) {
    return CPU_UNITS;
  }
  if (
    nodeResource.resourceType === IdentifierResourceType.MEMORY ||
    nodeResource.identifier === DEFAULT_MEMORY_IDENTIFIER
  ) {
    return MEMORY_UNITS_FOR_SELECTION;
  }
  return OTHER;
};

const generateWarningTitle = (
  hasEnabled: boolean,
  allInvalid: boolean,
  hasInvalid: boolean,
  allIncompleteCPUorMemory: boolean,
): string => {
  if (allInvalid) {
    return HardwareProfileBannerWarningTitles.ALL_INVALID;
  }
  if (!hasEnabled) {
    return HardwareProfileBannerWarningTitles.ALL_DISABLED;
  }
  if (hasInvalid) {
    return HardwareProfileBannerWarningTitles.SOME_INVALID;
  }
  if (allIncompleteCPUorMemory) {
    return HardwareProfileBannerWarningTitles.ALL_INCOMPLETE;
  }
  return HardwareProfileBannerWarningTitles.SOME_INCOMPLETE;
};

const generateWarningMessage = (
  hasEnabled: boolean,
  allInvalid: boolean,
  hasInvalid: boolean,
  allIncompleteCPUorMemory: boolean,
): string => {
  if (allInvalid) {
    return 'You must have at least one valid hardware profile enabled for users to create workbenches or deploy models. Take the appropriate actions below to re-validate your profiles.';
  }
  if (!hasEnabled) {
    return 'You must have at least one hardware profile enabled for users to create workbenches or deploy models. Enable one or more profiles in the table below.';
  }
  if (hasInvalid) {
    return 'One or more of your defined hardware profiles are invalid. Take the appropriate actions below to revalidate your profiles.';
  }
  if (allIncompleteCPUorMemory) {
    return 'All of your defined hardware profiles are missing either CPU or Memory. This is not recommended.';
  }
  return 'One or more of your defined hardware profiles are missing either CPU or Memory. This is not recommended.';
};

export const generateWarningForHardwareProfiles = (
  hardwareProfiles: HardwareProfileKind[],
): WarningNotification | undefined => {
  const hasInvalid = hardwareProfiles.some((profile) => {
    const warnings = validateProfileWarning(profile);
    return warnings.some(
      (warning) => warning.type !== HardwareProfileWarningType.HARDWARE_PROFILES_MISSING_CPU_MEMORY,
    );
  });
  const hasEnabled = hardwareProfiles.some((profile) => isHardwareProfileEnabled(profile));
  const allInvalid = hardwareProfiles.every((profile) => {
    const warnings = validateProfileWarning(profile);
    return warnings.some(
      (warning) => warning.type !== HardwareProfileWarningType.HARDWARE_PROFILES_MISSING_CPU_MEMORY,
    );
  });
  const allIncompleteCPUorMemory = hardwareProfiles.every((profile) => {
    const warnings = validateProfileWarning(profile);
    return warnings.some(
      (warning) => warning.type === HardwareProfileWarningType.HARDWARE_PROFILES_MISSING_CPU_MEMORY,
    );
  });

  const someIncompleteCPUorMemory = hardwareProfiles.some((profile) => {
    const warnings = validateProfileWarning(profile);
    return warnings.some(
      (warning) => warning.type === HardwareProfileWarningType.HARDWARE_PROFILES_MISSING_CPU_MEMORY,
    );
  });

  if (hardwareProfiles.length === 0 || (!hasInvalid && !someIncompleteCPUorMemory && hasEnabled)) {
    return undefined;
  }

  return {
    title: generateWarningTitle(hasEnabled, allInvalid, hasInvalid, allIncompleteCPUorMemory),
    message: generateWarningMessage(hasEnabled, allInvalid, hasInvalid, allIncompleteCPUorMemory),
  };
};

export const isHardwareProfileIdentifierValid = (identifier: Identifier): boolean => {
  try {
    if (
      identifier.minCount.toString().charAt(0) === '-' ||
      (identifier.maxCount && identifier.maxCount.toString().charAt(0) === '-') ||
      identifier.defaultCount.toString().charAt(0) === '-'
    ) {
      return false;
    }
    const minCount = splitValueUnit(
      identifier.minCount.toString(),
      determineIdentifierUnit(identifier),
      true,
    )[0];
    const [maxCount] = identifier.maxCount
      ? splitValueUnit(identifier.maxCount.toString(), determineIdentifierUnit(identifier), true)
      : [undefined];
    const defaultCount = splitValueUnit(
      identifier.defaultCount.toString(),
      determineIdentifierUnit(identifier),
      true,
    )[0];
    if (
      !Number.isInteger(minCount) ||
      (maxCount !== undefined && !Number.isInteger(maxCount)) ||
      !Number.isInteger(defaultCount) ||
      (maxCount && minCount !== undefined && minCount > maxCount) ||
      (defaultCount !== undefined && minCount !== undefined && defaultCount < minCount) ||
      (maxCount && defaultCount !== undefined && defaultCount > maxCount)
    ) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

type HardwareProfileWarning = {
  message: string;
  type: string | number;
};

export const createHardwareProfileWarningTitle = (hardwareProfile: HardwareProfileKind): string => {
  const complete = hasCPUandMemory(hardwareProfile.spec.identifiers ?? []);
  return `${complete ? 'Invalid' : 'Incomplete'} hardware profile`;
};

export const createIdentifierWarningMessage = (message: string): string =>
  `${message} Edit the profile to make the profile valid.`;

export const baseIdentifierSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required'),
  identifier: z.string().trim().min(1, 'Identifier is required'),
  resourceType: z.nativeEnum(IdentifierResourceType).optional(),
  defaultCount: z.union([z.string(), z.number()]),
  minCount: z.union([z.string(), z.number()]),
  maxCount: z.union([z.string(), z.number()]).optional(),
});

export const identifierSchema = baseIdentifierSchema.superRefine((identifier, ctx) => {
  const unitOptions = determineIdentifierUnit(identifier);

  const checkNegative = (fieldName: string, identifierName: string, value?: string | number) => {
    if (value?.toString().startsWith('-')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: createIdentifierWarningMessage(
          `${fieldName} for ${
            identifier.resourceType ?? identifier.displayName
          } cannot be negative.`,
        ),
        params: {
          code: HardwareProfileWarningType.CANNOT_BE_NEGATIVE,
        },
        path: ['identifiers', identifierName, fieldName],
      });
      return true;
    }
    return false;
  };

  const checkDecimal = (value: number, identifierName: string, fieldName: string) => {
    if (!Number.isInteger(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: createIdentifierWarningMessage(
          `${fieldName} for ${
            identifier.resourceType ?? identifier.displayName
          } cannot be a decimal.`,
        ),
        params: {
          code: HardwareProfileWarningType.CANNOT_BE_DECIMAL,
        },
        path: ['identifiers', identifierName, fieldName],
      });
    }
  };

  const minCountValidation = validateMinCount(identifier, unitOptions);
  if (!minCountValidation.isValid) {
    minCountValidation.issues?.forEach((issue) => ctx.addIssue(issue));
  }

  const defaultCountValidation = validateDefaultCount(identifier, unitOptions);
  if (!defaultCountValidation.isValid) {
    defaultCountValidation.issues?.forEach((issue) => ctx.addIssue(issue));
  }

  const maxCountValidation = validateMaxCount(identifier, unitOptions);
  if (!maxCountValidation.isValid) {
    maxCountValidation.issues?.forEach((issue) => ctx.addIssue(issue));
  }

  const hasNegative = [
    { value: identifier.minCount, identifierName: identifier.identifier, name: 'Minimum count' },
    { value: identifier.maxCount, identifierName: identifier.identifier, name: 'Maximum count' },
    {
      value: identifier.defaultCount,
      identifierName: identifier.identifier,
      name: 'Default count',
    },
  ].some(({ value, identifierName, name }) => checkNegative(name, identifierName, value));

  if (hasNegative) {
    return;
  }

  try {
    const parseCount = (count: string | number) =>
      splitValueUnit(count.toString(), unitOptions, true)[0];

    const minCount = parseCount(identifier.minCount);
    const maxCount = identifier.maxCount ? parseCount(identifier.maxCount) : undefined;
    const defaultCount = parseCount(identifier.defaultCount);

    if (minCount !== undefined) {
      checkDecimal(minCount, identifier.identifier, 'Minimum count');
    }
    if (defaultCount !== undefined) {
      checkDecimal(defaultCount, identifier.identifier, 'Default count');
    }
    if (maxCount !== undefined) {
      checkDecimal(maxCount, identifier.identifier, 'Maximum count');
    }
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: createIdentifierWarningMessage(
        `The resource count for ${
          identifier.resourceType ?? identifier.displayName
        } has an invalid unit.`,
      ),
      params: {
        code: HardwareProfileWarningType.INVALID_UNIT,
      },
      path: ['identifiers', identifier.identifier],
    });
  }
});

export const createHardwareProfileWarningSchema = (
  hardwareProfileName: string,
): ZodEffects<z.ZodArray<typeof identifierSchema>> =>
  z.array(identifierSchema).superRefine((data, ctx) => {
    if (!hasCPUandMemory(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: createIdentifierWarningMessage(HARDWARE_PROFILES_MISSING_CPU_MEMORY_MESSAGE),
        params: {
          code: HardwareProfileWarningType.HARDWARE_PROFILES_MISSING_CPU_MEMORY,
        },
        path: ['hardwareProfiles', hardwareProfileName, 'identifiers'],
      });
    }
  });

export const validateProfileWarning = (
  hardwareProfile: HardwareProfileKind,
): HardwareProfileWarning[] => {
  const warningMessages: HardwareProfileWarning[] = [];
  const identifiers = hardwareProfile.spec.identifiers ?? [];
  const schema = createHardwareProfileWarningSchema(hardwareProfile.metadata.name);
  const warnings = schema.safeParse(identifiers);

  if (warnings.error) {
    warnings.error.issues.forEach((issue) => {
      warningMessages.push({
        message: issue.message,
        type: 'params' in issue ? issue.params?.code : HardwareProfileWarningType.OTHER,
      });
    });
  }
  return warningMessages;
};

export const isHardwareProfileValid = (hardwareProfile: HardwareProfileKind): boolean => {
  const warnings = validateProfileWarning(hardwareProfile);
  return warnings.length === 0;
};

export const getHardwareProfileDisplayName = (hardwareProfile: HardwareProfileKind): string =>
  hardwareProfile.metadata.annotations?.[DisplayNameAnnotation.ODH_DISP_NAME] ||
  hardwareProfile.metadata.name;

export const getHardwareProfileCrName = (hardwareProfile: HardwareProfileKind): string =>
  hardwareProfile.metadata.name;

export const isDefaultHardwareProfile = (hardwareProfile: HardwareProfileKind): boolean =>
  getHardwareProfileCrName(hardwareProfile) === DEFAULT_PROFILE_NAME;

export const getHardwareProfileDescription = (
  hardwareProfile: HardwareProfileKind,
): string | undefined => hardwareProfile.metadata.annotations?.[DisplayNameAnnotation.ODH_DESC];

export const isHardwareProfileEnabled = (hardwareProfile: HardwareProfileKind): boolean =>
  hardwareProfile.metadata.annotations?.['opendatahub.io/disabled'] === 'false' ||
  hardwareProfile.metadata.annotations?.['opendatahub.io/disabled'] === undefined;

export const alphaSortHardwareProfilesByName = (
  profiles: HardwareProfileKind[],
): HardwareProfileKind[] => {
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  return profiles.toSorted((a, b) => collator.compare(a.metadata.name, b.metadata.name));
};

export const orderHardwareProfiles = (
  profiles: HardwareProfileKind[],
  hardwareProfileOrder: string[] = [],
): HardwareProfileKind[] => {
  if (hardwareProfileOrder.length > 0) {
    const alphaOrderedNames = alphaSortHardwareProfilesByName(profiles).map(
      (hwp) => hwp.metadata.name,
    );
    const existingNames = new Set(alphaOrderedNames);
    const persistedOrder = hardwareProfileOrder.filter((name) => existingNames.has(name));
    const persistedOrderSet = new Set(persistedOrder);
    const newProfiles = alphaOrderedNames.filter((name) => !persistedOrderSet.has(name));
    const currentOrder = [...persistedOrder, ...newProfiles];
    const profilesMap = new Map(profiles.map((profile) => [profile.metadata.name, profile]));
    return currentOrder.flatMap((name) => {
      const profile = profilesMap.get(name);
      return profile ? [profile] : [];
    });
  }
  return alphaSortHardwareProfilesByName(profiles);
};

export const getClusterQueueNameFromLocalQueues = (
  localQueueName: string | undefined,
  localQueues: { data: LocalQueueKind[]; loaded: boolean },
): string | undefined => {
  if (
    !localQueueName ||
    !localQueues.loaded ||
    !Array.isArray(localQueues.data) ||
    localQueues.data.length === 0
  ) {
    return undefined;
  }
  const queue = localQueues.data.find((q) => q.metadata?.name === localQueueName);
  return queue?.spec.clusterQueue;
};

export const filterRecognizedVisibility = (
  visibleIn: string[],
): HardwareProfileFeatureVisibility[] => {
  const recognized: string[] = Object.values(HardwareProfileFeatureVisibility);
  return visibleIn.filter((v): v is HardwareProfileFeatureVisibility => recognized.includes(v));
};
