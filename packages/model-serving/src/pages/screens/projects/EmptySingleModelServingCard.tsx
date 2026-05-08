import * as React from 'react';
import {
  Bullseye,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { NamespaceApplicationCase } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/types';
import ModelServingPlatformSelectButton from './ModelServingPlatformSelectButton';

type EmptySingleModelServingCardProps = {
  setErrorSelectingPlatform: (e?: Error) => void;
};

const EmptySingleModelServingCard: React.FC<EmptySingleModelServingCardProps> = ({
  setErrorSelectingPlatform,
}) => {
  const { currentProject } = React.useContext(ProjectDetailsContext);

  return (
    <Card
      style={{
        height: '100%',
        border: '1px solid var(--pf-t--global--border--color--default)',
        borderRadius: 16,
      }}
      data-testid="kserve-platform-card"
    >
      <CardTitle>
        <Content component={ContentVariants.h2}>Single-model serving platform</Content>
      </CardTitle>
      <CardBody>
        Each model is deployed on its own model server. Choose this option when you want to deploy a
        large model such as a large language model (LLM).
      </CardBody>
      <CardFooter>
        <Bullseye>
          <ModelServingPlatformSelectButton
            namespace={currentProject.metadata.name}
            servingPlatform={NamespaceApplicationCase.KSERVE_PROMOTION}
            setError={setErrorSelectingPlatform}
            variant="secondary"
            data-testid="kserve-select-button"
          />
        </Bullseye>
      </CardFooter>
    </Card>
  );
};

export default EmptySingleModelServingCard;
