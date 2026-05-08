import * as React from 'react';
import { Label, Content, ContentVariants } from '@patternfly/react-core';
import { TemplateKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ServingRuntimeAPIProtocol } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { getAPIProtocolFromTemplate } from './utils';

type CustomServingRuntimeAPIProtocolLabelProps = {
  template: TemplateKind;
};

const CustomServingRuntimeAPIProtocolLabel: React.FC<CustomServingRuntimeAPIProtocolLabelProps> = ({
  template,
}) => {
  const apiProtocol = getAPIProtocolFromTemplate(template);

  if (!apiProtocol || !Object.values(ServingRuntimeAPIProtocol).includes(apiProtocol)) {
    return <Content component={ContentVariants.small}>Not defined</Content>;
  }

  return <Label color="yellow">{apiProtocol}</Label>;
};

export default CustomServingRuntimeAPIProtocolLabel;
