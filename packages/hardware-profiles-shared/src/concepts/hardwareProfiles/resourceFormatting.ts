import { IdentifierResourceType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  splitValueUnit,
  CPU_UNITS,
  MEMORY_UNITS_FOR_PARSING,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/valueUnits';

/** Shared by validation schemas and CR formatting (kept separate from utils to avoid circular imports). */
export const formatResourceValue = (
  v: string | number,
  resourceType?: IdentifierResourceType,
): string | number => {
  const valueStr = typeof v === 'number' ? v.toString() : v;
  switch (resourceType) {
    case IdentifierResourceType.CPU: {
      const [cpuValue, cpuUnit] = splitValueUnit(valueStr, CPU_UNITS);
      return `${cpuValue ?? ''} ${cpuUnit.name}`;
    }
    case IdentifierResourceType.MEMORY: {
      const [memoryValue, memoryUnit] = splitValueUnit(valueStr, MEMORY_UNITS_FOR_PARSING);
      return `${memoryValue ?? ''} ${memoryUnit.name}`;
    }
    default:
      return v;
  }
};
