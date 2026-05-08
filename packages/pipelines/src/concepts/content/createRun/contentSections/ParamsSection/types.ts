import { RuntimeConfigParamValue } from '@odh-dashboard/pipelines/concepts/kfTypes';

export type InputParamProps = {
  id: string;
  value: RuntimeConfigParamValue;
  onChange: (event: React.ChangeEvent<unknown> | null, value: string | number | boolean) => void;
};
