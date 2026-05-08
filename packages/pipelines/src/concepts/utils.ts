import { deleteSecret } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import { allSettledPromises } from '@odh-dashboard/dashboard-foundation-frontend/utilities/allSettledPromises';
import { deletePipelineCR, getPipelinesCR } from '@odh-dashboard/pipelines/api/k8s';
import {
  DSPA_SECRET_NAME,
  ExternalDatabaseSecret,
} from '@odh-dashboard/pipelines/concepts/content/configurePipelinesServer/const';
import { ELYRA_SECRET_NAME } from '@odh-dashboard/pipelines/concepts/elyra/const';
import { PipelineRecurringRunKF, PipelineRunKF, PipelinesFilterOp } from './kfTypes';
import { PipelineParams } from './types';

export const deleteServer = async (namespace: string, crName: string): Promise<void> => {
  const dspa = await getPipelinesCR(namespace, crName);
  const dspaSecretName =
    dspa.spec.objectStorage.externalStorage?.s3CredentialsSecret.secretName ?? '';
  return allSettledPromises([
    deleteSecret(namespace, ExternalDatabaseSecret.NAME),
    deleteSecret(namespace, ELYRA_SECRET_NAME),
    deleteSecret(namespace, DSPA_SECRET_NAME),
    ...(isGeneratedDSPAExternalStorageSecret(dspaSecretName)
      ? [deleteSecret(namespace, dspaSecretName)]
      : []),
    deletePipelineCR(namespace, crName),
  ]).then(() => undefined);
};

/**
 * Whether the Secret resource is generated
 * If it's generated, it should be `secret-xxxxxx` or `dspa-secret`
 * Use this test to avoid deleting the user-created secret for the pipeline server
 */
export const isGeneratedDSPAExternalStorageSecret = (name: string): boolean =>
  /^secret-[a-z0-9]{6}$/.test(name);

export const isRunSchedule = (
  resource: PipelineRunKF | PipelineRecurringRunKF,
): resource is PipelineRecurringRunKF => 'trigger' in resource;

export const getNameEqualsFilter = (name: string): Pick<PipelineParams, 'filter'> => ({
  filter: {
    predicates: [
      {
        key: 'display_name',
        operation: PipelinesFilterOp.EQUALS,
        // eslint-disable-next-line camelcase
        string_value: name,
      },
    ],
  },
});
