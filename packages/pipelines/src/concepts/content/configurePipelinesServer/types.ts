import { EnvVariableDataEntry } from '@odh-dashboard/connection-types-shared/concepts/workbench/envVariableFormTypes';

export type ObjectStorageNew = {
  newValue: EnvVariableDataEntry[];
};

export type PipelineServerConfigType = {
  database: {
    useDefault: boolean;
    value: EnvVariableDataEntry[];
  };
  objectStorage: ObjectStorageNew;
  enableInstructLab: boolean;
  storeYamlInKubernetes: boolean;
  enableCaching: boolean;
};
