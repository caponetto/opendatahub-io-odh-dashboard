import type { DSPAMlflowIntegrationMode } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  mockDataSciencePipelineApplicationK8sResource,
  mockK8sResourceList,
} from '@odh-dashboard/test-mocks';
import { DataSciencePipelineApplicationModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models';

export const MLFLOW_BFF_STATUS_URL = '/_bff/mlflow/api/v1/status';

export const interceptMlflowStatus = (configured = true): void => {
  cy.intercept('GET', MLFLOW_BFF_STATUS_URL, { body: { configured } }).as('mlflowStatus');
};

export const interceptDSPAMlflowIntegration = (
  namespace: string,
  mlflowIntegrationMode?: DSPAMlflowIntegrationMode,
): void => {
  cy.interceptK8sList(
    DataSciencePipelineApplicationModel,
    mockK8sResourceList([
      mockDataSciencePipelineApplicationK8sResource({
        namespace,
        mlflowIntegrationMode,
      }),
    ]),
  );
  cy.interceptK8s(
    DataSciencePipelineApplicationModel,
    mockDataSciencePipelineApplicationK8sResource({
      namespace,
      name: 'dspa',
      mlflowIntegrationMode,
    }),
  );
};
