import React from 'react';
import {
  assembleSecret,
  createSecret,
  deleteSecret,
} from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import {
  TrustyDBData,
  TrustyStatusStates,
} from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import useTrustyAINamespaceCR from '@odh-dashboard/trustyai/concepts/useTrustyAINamespaceCR';
import { createTrustyAICR, deleteTrustyAICR } from '@odh-dashboard/trustyai/api/k8s';
import { getTrustyStatusState } from '@odh-dashboard/trustyai/concepts/utils';
import { TRUSTYAI_SECRET_NAME } from '@odh-dashboard/trustyai/concepts/const';
import useTrustyBrowserStorage from '@odh-dashboard/trustyai/concepts/content/useTrustyBrowserStorage';

export type UseManageTrustyAICRReturnType = {
  statusState: TrustyStatusStates;
  installCRForNewDB: (secretData: TrustyDBData) => Promise<void>;
  installCRForExistingDB: (secretName: string) => Promise<void>;
  deleteCR: () => Promise<void>;
};

const useManageTrustyAICR = (namespace: string): UseManageTrustyAICRReturnType => {
  const state = useTrustyAINamespaceCR(namespace);
  const [cr, , , refresh] = state;
  const successDetails = useTrustyBrowserStorage(cr);

  const statusState = getTrustyStatusState(state, successDetails);

  const installCRForExistingDB = React.useCallback<
    UseManageTrustyAICRReturnType['installCRForExistingDB']
  >(
    async (secretName) => {
      await createTrustyAICR(namespace, secretName).then(refresh);
    },
    [namespace, refresh],
  );
  const installCRForNewDB = React.useCallback<UseManageTrustyAICRReturnType['installCRForNewDB']>(
    async (data) => {
      const submitNewSecret = async (dryRun: boolean) => {
        await Promise.all([
          createSecret(assembleSecret(namespace, data, 'generic', TRUSTYAI_SECRET_NAME), {
            dryRun,
          }),
          createTrustyAICR(namespace, TRUSTYAI_SECRET_NAME, { dryRun }),
        ]);
      };

      await submitNewSecret(true);
      await submitNewSecret(false);
      await refresh();
    },
    [namespace, refresh],
  );

  const deleteCR = React.useCallback<UseManageTrustyAICRReturnType['deleteCR']>(async () => {
    let deleteGeneratedSecret = false;
    if (cr?.spec.storage.format === 'DATABASE') {
      if (cr.spec.storage.databaseConfigurations === TRUSTYAI_SECRET_NAME) {
        deleteGeneratedSecret = true;
      }
    }

    await deleteTrustyAICR(namespace);
    if (deleteGeneratedSecret) {
      await deleteSecret(namespace, TRUSTYAI_SECRET_NAME);
    }
    await refresh();
  }, [cr, namespace, refresh]);

  return {
    statusState,
    installCRForExistingDB,
    installCRForNewDB,
    deleteCR,
  };
};

export default useManageTrustyAICR;
