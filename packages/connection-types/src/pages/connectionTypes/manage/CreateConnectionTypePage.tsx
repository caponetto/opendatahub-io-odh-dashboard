import * as React from 'react';
import { createConnectionType } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/connectionTypesService';
import { ConnectionTypeConfigMapObj } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import ManageConnectionTypePage from './ManageConnectionTypePage';

type Props = {
  prefill?: ConnectionTypeConfigMapObj;
};

const CreateConnectionTypePage: React.FC<Props> = ({ prefill }) => (
  <ManageConnectionTypePage
    prefill={prefill}
    onSave={async (obj) => {
      const response = await createConnectionType(obj);
      if (response.error) {
        throw new Error(response.error);
      }
    }}
  />
);

export default CreateConnectionTypePage;
