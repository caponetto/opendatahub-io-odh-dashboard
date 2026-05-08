import { useFeatureFlag } from '@odh-dashboard/plugin-core';
import { GUARDRAILS } from '~/odh/extensions';

const useGuardrailsEnabled = (): boolean => {
  const [guardrailsEnabled] = useFeatureFlag(GUARDRAILS);
  return guardrailsEnabled;
};

export default useGuardrailsEnabled;
