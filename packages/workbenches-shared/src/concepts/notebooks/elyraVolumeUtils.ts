import { Patch } from '@odh-dashboard/k8s-browser';
import type { Volume, VolumeMount } from '@odh-dashboard/dashboard-foundation-frontend/types';

const ELYRA_SECRET_NAME = 'ds-pipeline-config';
const RUNTIME_MOUNT_PATH = '/opt/app-root/runtimes';

export const ELYRA_VOLUME_NAME = 'elyra-dsp-details';

export const getElyraVolumeMount = (): VolumeMount => ({
  name: ELYRA_VOLUME_NAME,
  mountPath: RUNTIME_MOUNT_PATH,
});

export const getElyraVolume = (): Volume => ({
  name: ELYRA_VOLUME_NAME,
  secret: {
    secretName: ELYRA_SECRET_NAME,
    optional: true,
  },
});

export const getPipelineVolumePatch = (): Patch => ({
  path: '/spec/template/spec/volumes/-',
  op: 'add',
  value: getElyraVolume(),
});

export const getPipelineVolumeMountPatch = (): Patch => ({
  path: '/spec/template/spec/containers/0/volumeMounts/-',
  op: 'add',
  value: getElyraVolumeMount(),
});
