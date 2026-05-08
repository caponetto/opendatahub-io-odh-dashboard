import useGenericObjectState, {
  GenericObjectState,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useGenericObjectState';

export type CreateExperimentData = {
  name: string;
  description: string;
};

const useCreateExperimentData = (): GenericObjectState<CreateExperimentData> =>
  useGenericObjectState<CreateExperimentData>({
    name: '',
    description: '',
  });

export default useCreateExperimentData;
