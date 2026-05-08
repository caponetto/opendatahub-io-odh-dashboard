import * as React from 'react';
import { ExpandableRowContent, Tbody, Td } from '@patternfly/react-table';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import {
  DeploymentMode,
  InferenceServiceKind,
  ServingRuntimeKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import ResourceTr from '@odh-dashboard/dashboard-foundation-frontend/components/ResourceTr';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import InferenceServiceTableRow from '../../global/InferenceServiceTableRow';
import ServingRuntimeDetails from '../ServingRuntimeDetails';
import ServingRuntimeTokensTable from '../../../../concepts/kserve/ServingRuntimeTokensTable';
import { isInferenceServiceTokenEnabled } from '../utils';

type KServeInferenceServiceTableRowProps = {
  project?: string;
  obj: InferenceServiceKind;
  onEditKServe: (obj: {
    inferenceService: InferenceServiceKind;
    servingRuntime?: ServingRuntimeKind;
  }) => void;
  onDeleteKServe: (obj: {
    inferenceService: InferenceServiceKind;
    servingRuntime?: ServingRuntimeKind;
  }) => void;
  rowIndex: number;
  columnNames: string[];
};

const KServeInferenceServiceTableRow: React.FC<KServeInferenceServiceTableRowProps> = ({
  project,
  obj,
  rowIndex,
  columnNames,
  onEditKServe,
  onDeleteKServe,
}) => {
  const isAuthAvailable =
    useIsAreaAvailable(SupportedArea.K_SERVE_AUTH).status ||
    obj.metadata.annotations?.['serving.kserve.io/deploymentMode'] === DeploymentMode.RawDeployment;

  const [isExpanded, setExpanded] = React.useState(false);
  const {
    servingRuntimes: {
      data: { items: servingRuntimes },
    },
    inferenceServices,
  } = React.useContext(ProjectDetailsContext);

  const frameworkName = obj.spec.predictor.model?.modelFormat?.name || '';
  const frameworkVersion = obj.spec.predictor.model?.modelFormat?.version;

  const servingRuntime = servingRuntimes.find(
    (sr) => sr.metadata.name === obj.spec.predictor.model?.runtime,
  );

  return (
    <Tbody isExpanded={isExpanded}>
      <ResourceTr resource={obj}>
        <Td
          data-testid="kserve-model-row-item"
          expand={{
            rowIndex,
            expandId: 'kserve-model-row-item',
            isExpanded,
            onToggle: () => setExpanded(!isExpanded),
          }}
        />
        <InferenceServiceTableRow
          obj={obj}
          columnNames={columnNames}
          servingRuntime={servingRuntime}
          refresh={inferenceServices.refresh}
          onDeleteInferenceService={() => onDeleteKServe({ inferenceService: obj, servingRuntime })}
          onEditInferenceService={() => onEditKServe({ inferenceService: obj, servingRuntime })}
        />
      </ResourceTr>
      <ResourceTr isExpanded={isExpanded} resource={obj}>
        <Td />
        <Td dataLabel="Information" colSpan={5}>
          <ExpandableRowContent>
            <Stack hasGutter>
              <StackItem>
                <DescriptionList isHorizontal horizontalTermWidthModifier={{ default: '250px' }}>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Framework</DescriptionListTerm>
                    <DescriptionListDescription>
                      {frameworkVersion ? `${frameworkName}-${frameworkVersion}` : frameworkName}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </StackItem>
              {servingRuntime && (
                <StackItem>
                  <ServingRuntimeDetails project={project} obj={servingRuntime} isvc={obj} />
                </StackItem>
              )}
              {isAuthAvailable && (
                <StackItem>
                  <DescriptionList
                    {...(!isInferenceServiceTokenEnabled(obj) && {
                      isHorizontal: true,
                      horizontalTermWidthModifier: { default: '250px' },
                    })}
                  >
                    <DescriptionListGroup>
                      <DescriptionListTerm>Token authentication</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ServingRuntimeTokensTable
                          obj={obj}
                          isTokenEnabled={isInferenceServiceTokenEnabled(obj)}
                        />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </StackItem>
              )}
            </Stack>
          </ExpandableRowContent>
        </Td>
      </ResourceTr>
    </Tbody>
  );
};

export default KServeInferenceServiceTableRow;
