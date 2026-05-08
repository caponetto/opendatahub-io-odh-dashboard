import * as React from 'react';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { UpdateObjectAtPropAndValue } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { translateDisplayNameForK8s } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { CreatingInferenceServiceObject } from '../../../types';

type NIMModelDeploymentNameSectionProps = {
  data: CreatingInferenceServiceObject;
  setData: UpdateObjectAtPropAndValue<CreatingInferenceServiceObject>;
};

const NIMModelDeploymentNameSection: React.FC<NIMModelDeploymentNameSectionProps> = ({
  data,
  setData,
}) => (
  <FormGroup label="Model deployment name" fieldId="model-deployment-name-section" isRequired>
    <TextInput
      isRequired
      id="model-deployment-name-section"
      data-testid="model-deployment-name-section"
      value={data.name}
      onChange={(e, name) => {
        setData('name', name);
        setData('k8sName', translateDisplayNameForK8s(name));
      }}
    />
  </FormGroup>
);

export default NIMModelDeploymentNameSection;
