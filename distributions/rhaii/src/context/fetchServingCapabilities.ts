import { isRecord } from '../utils/typeGuards';

export type ServingCapabilities = {
  llmdServing: boolean;
  kServe: boolean;
};

const SERVING_API_GROUP = 'serving.kserve.io';
const LLMD_RESOURCE = 'llminferenceservices';
const KSERVE_RESOURCE = 'inferenceservices';

const parseGroupVersions = (value: unknown): string[] => {
  if (!isRecord(value) || !Array.isArray(value.versions)) {
    throw new Error('Invalid serving API discovery response.');
  }
  return value.versions.flatMap((version): string[] =>
    isRecord(version) && typeof version.groupVersion === 'string' && version.groupVersion !== ''
      ? [version.groupVersion]
      : [],
  );
};

const parseResourceNames = (value: unknown): string[] => {
  if (!isRecord(value) || !Array.isArray(value.resources)) {
    throw new Error('Invalid serving resource discovery response.');
  }
  return value.resources.flatMap((resource): string[] =>
    isRecord(resource) && typeof resource.name === 'string' && resource.name !== ''
      ? [resource.name]
      : [],
  );
};

/** A 404 on the group means it is not served — an unsupported capability, not an error. */
export const fetchServingCapabilities = async (
  signal?: AbortSignal,
): Promise<ServingCapabilities> => {
  const groupResponse = await fetch(`/api/k8s/apis/${SERVING_API_GROUP}`, { signal });
  if (groupResponse.status === 404) {
    return { llmdServing: false, kServe: false };
  }
  if (!groupResponse.ok) {
    throw new Error(`Unable to discover the serving APIs (HTTP ${groupResponse.status}).`);
  }

  const versions = parseGroupVersions(await groupResponse.json());
  const resourceNames = new Set<string>();
  for (const groupVersion of versions) {
    const listResponse = await fetch(`/api/k8s/apis/${groupVersion}`, { signal });
    if (listResponse.status === 404) {
      // The version was removed between the two discovery calls; the remaining
      // versions still describe the group.
      continue;
    }
    if (!listResponse.ok) {
      throw new Error(
        `Unable to discover the ${groupVersion} resources (HTTP ${listResponse.status}).`,
      );
    }
    for (const name of parseResourceNames(await listResponse.json())) {
      resourceNames.add(name);
    }
  }

  return {
    llmdServing: resourceNames.has(LLMD_RESOURCE),
    kServe: resourceNames.has(KSERVE_RESOURCE),
  };
};
