import { PipelineNodeModel, RunStatus } from '@patternfly/react-topology';
import { PipelineTask } from './pipelineTaskTypes';

export type StandardTaskNodeData = {
  pipelineTask: PipelineTask;
  runStatus?: RunStatus;
  artifactType?: string;
};

export type PipelineNodeModelExpanded = PipelineNodeModel & {
  data?: StandardTaskNodeData;
};
