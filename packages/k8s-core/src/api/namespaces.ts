import { k8sGetResource, k8sPatchResource, type Patch } from '@openshift/dynamic-plugin-sdk-utils';
import { NamespaceModel } from './models';
import { applyK8sAPIOptions, type K8sAPIOptions, type ProjectKind } from '../index';

/** A `null` value removes the key. */
export type NamespaceMetadataChange = {
  labels?: Record<string, string | null>;
  annotations?: Record<string, string | null>;
};

const METADATA_MAPS = ['labels', 'annotations'] as const;

type MetadataMap = (typeof METADATA_MAPS)[number];

export const getNamespace = (name: string, opts?: K8sAPIOptions): Promise<ProjectKind> =>
  k8sGetResource<ProjectKind>(
    applyK8sAPIOptions({ model: NamespaceModel, queryOptions: { name } }, opts),
  );

const escapeJsonPatchSegment = (segment: string): string =>
  segment.replace(/~/g, '~0').replace(/\//g, '~1');

type ExistingMetadata = {
  values: Record<string, string | undefined>;
  present: boolean;
};

/** Reads a namespace metadata string map without assuming its declared shape. */
const readMetadataMap = (namespace: ProjectKind, map: MetadataMap): ExistingMetadata => {
  const raw: unknown = namespace.metadata[map];
  if (typeof raw !== 'object' || raw === null) {
    return { values: {}, present: false };
  }
  const values: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      values[key] = value;
    }
  }
  return { values, present: true };
};

const buildEntryPatch = (
  map: MetadataMap,
  key: string,
  value: string | null,
  existing: ExistingMetadata,
): Patch | undefined => {
  const path = `/metadata/${map}/${escapeJsonPatchSegment(key)}`;
  if (value === null) {
    // JSON Patch "remove" fails on a missing key, so only remove what exists.
    return key in existing.values ? { op: 'remove', path } : undefined;
  }
  if (key in existing.values) {
    return existing.values[key] === value ? undefined : { op: 'replace', path, value };
  }
  if (!existing.present) {
    // The map itself is absent; create it with this entry.
    return { op: 'add', path: `/metadata/${map}`, value: { [key]: value } };
  }
  return { op: 'add', path, value };
};

export const buildNamespaceMetadataPatches = (
  namespace: ProjectKind,
  change: NamespaceMetadataChange,
): Patch[] => {
  const patches: Patch[] = [];
  for (const map of METADATA_MAPS) {
    const existing = readMetadataMap(namespace, map);
    for (const [key, value] of Object.entries(change[map] ?? {})) {
      const patch = buildEntryPatch(map, key, value, existing);
      if (patch) {
        patches.push(patch);
        // Once any patch applies, the map exists: later entries take the normal add path.
        existing.present = true;
      }
    }
  }
  return patches;
};

/**
 * Apply a metadata change to a namespace through the caller's configured
 * Kubernetes transport; the API server enforces the mutation. The namespace is
 * read first so removals target keys that exist, and an already-matching
 * namespace resolves without issuing a patch.
 */
export const patchNamespaceMetadata = async (
  name: string,
  change: NamespaceMetadataChange,
  opts?: K8sAPIOptions,
): Promise<string> => {
  const namespace = await getNamespace(name, opts);
  const patches = buildNamespaceMetadataPatches(namespace, change);
  if (patches.length > 0) {
    await k8sPatchResource<ProjectKind>(
      applyK8sAPIOptions({ model: NamespaceModel, queryOptions: { name }, patches }, opts),
    );
  }
  return name;
};
