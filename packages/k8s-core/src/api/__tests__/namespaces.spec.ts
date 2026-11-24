import { k8sGetResource, k8sPatchResource } from '@openshift/dynamic-plugin-sdk-utils';
import {
  buildNamespaceMetadataPatches,
  patchNamespaceMetadata,
  type NamespaceMetadataChange,
} from '../namespaces';
import { NamespaceModel } from '../models';
import type { ProjectKind } from '../../index';

jest.mock('@openshift/dynamic-plugin-sdk-utils', () => ({
  k8sGetResource: jest.fn(),
  k8sPatchResource: jest.fn(),
}));

const k8sGetResourceMock = jest.mocked(k8sGetResource);
const k8sPatchResourceMock = jest.mocked(k8sPatchResource);

const namespace = (labels?: Record<string, string>, annotations?: Record<string, string>) =>
  ({
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
      name: 'model-project',
      ...(labels !== undefined && { labels }),
      ...(annotations !== undefined && { annotations }),
    },
  } as ProjectKind);

describe('buildNamespaceMetadataPatches', () => {
  it('should add a missing label', () => {
    const change: NamespaceMetadataChange = { labels: { key: 'value' } };
    expect(buildNamespaceMetadataPatches(namespace({ other: 'value' }), change)).toEqual([
      { op: 'add', path: '/metadata/labels/key', value: 'value' },
    ]);
  });

  it('should replace an existing label with a different value', () => {
    const change: NamespaceMetadataChange = { labels: { key: 'value' } };
    expect(buildNamespaceMetadataPatches(namespace({ key: 'old' }), change)).toEqual([
      { op: 'replace', path: '/metadata/labels/key', value: 'value' },
    ]);
  });

  it('should produce no patch when the label already matches', () => {
    const change: NamespaceMetadataChange = { labels: { key: 'value' } };
    expect(buildNamespaceMetadataPatches(namespace({ key: 'value' }), change)).toEqual([]);
  });

  it('should create the labels map when the namespace has none', () => {
    const change: NamespaceMetadataChange = { labels: { key: 'value' } };
    expect(buildNamespaceMetadataPatches(namespace(undefined, undefined), change)).toEqual([
      { op: 'add', path: '/metadata/labels', value: { key: 'value' } },
    ]);
  });

  it('should keep every entry when creating an absent map with multiple keys', () => {
    const change: NamespaceMetadataChange = { labels: { first: '1', second: '2' } };
    expect(buildNamespaceMetadataPatches(namespace(undefined, undefined), change)).toEqual([
      { op: 'add', path: '/metadata/labels', value: { first: '1' } },
      { op: 'add', path: '/metadata/labels/second', value: '2' },
    ]);
  });

  it('should remove an existing label but skip a missing one', () => {
    const change: NamespaceMetadataChange = { labels: { key: null } };
    expect(buildNamespaceMetadataPatches(namespace({ key: 'value' }), change)).toEqual([
      { op: 'remove', path: '/metadata/labels/key' },
    ]);
    expect(buildNamespaceMetadataPatches(namespace({ other: 'value' }), change)).toEqual([]);
  });

  it('should escape JSON Patch path segments in annotation keys', () => {
    const change: NamespaceMetadataChange = { annotations: { 'a/b~c': null } };
    expect(
      buildNamespaceMetadataPatches(namespace(undefined, { 'a/b~c': 'value' }), change),
    ).toEqual([{ op: 'remove', path: '/metadata/annotations/a~1b~0c' }]);
  });

  it('should skip annotation removal when the annotations map is absent', () => {
    const change: NamespaceMetadataChange = { annotations: { key: null } };
    expect(buildNamespaceMetadataPatches(namespace({ key: 'value' }), change)).toEqual([]);
  });
});

describe('patchNamespaceMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should patch the namespace metadata', async () => {
    k8sGetResourceMock.mockResolvedValue(namespace({ key: 'old' }));

    await expect(
      patchNamespaceMetadata('model-project', { labels: { key: 'value' } }),
    ).resolves.toBe('model-project');

    expect(k8sGetResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: NamespaceModel,
        queryOptions: expect.objectContaining({ name: 'model-project' }),
      }),
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: NamespaceModel,
        queryOptions: expect.objectContaining({ name: 'model-project' }),
        patches: [{ op: 'replace', path: '/metadata/labels/key', value: 'value' }],
      }),
    );
  });

  it('should not issue a patch when the namespace already matches', async () => {
    k8sGetResourceMock.mockResolvedValue(namespace({ key: 'value' }));

    await expect(
      patchNamespaceMetadata('model-project', { labels: { key: 'value' } }),
    ).resolves.toBe('model-project');

    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should pass dry-run through both the read and the patch', async () => {
    k8sGetResourceMock.mockResolvedValue(namespace());

    await patchNamespaceMetadata('model-project', { labels: { key: 'value' } }, { dryRun: true });

    expect(k8sGetResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({
          queryParams: expect.objectContaining({ dryRun: 'All' }),
        }),
      }),
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({
          queryParams: expect.objectContaining({ dryRun: 'All' }),
        }),
      }),
    );
  });

  it('should propagate a missing namespace instead of resolving', async () => {
    k8sGetResourceMock.mockRejectedValue(new Error('Not found'));

    await expect(patchNamespaceMetadata('missing', { labels: { key: 'value' } })).rejects.toThrow(
      'Not found',
    );
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should propagate a rejected patch instead of resolving', async () => {
    k8sGetResourceMock.mockResolvedValue(namespace());
    k8sPatchResourceMock.mockRejectedValue(new Error('Forbidden'));

    await expect(
      patchNamespaceMetadata('model-project', { labels: { key: 'value' } }),
    ).rejects.toThrow('Forbidden');
  });
});
