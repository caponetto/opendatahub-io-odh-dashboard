import { K8sVerb } from '#~/k8sTypes';
import { useAccessReview } from '#~/api';
import { SupportedArea, useIsAreaAvailable } from '#~/concepts/areas';
import { useAppSelector } from '#~/redux/hooks';
import { PlatformType } from '#~/redux/types';

/**
 * Effectively this check is equivalent to checking if a user is a project admin, specifically on the verb passed.
 */

export const useProjectAccessReview = (
  verb: K8sVerb,
  projectName: string,
  shouldRunCheck?: boolean,
): ReturnType<typeof useAccessReview> => {
  const platform = useAppSelector((state) => state.platform);
  const isOpenShift = platform === PlatformType.OpenShift;
  return useAccessReview(
    {
      group: isOpenShift ? 'project.openshift.io' : '',
      resource: isOpenShift ? 'projects' : 'namespaces',
      name: projectName,
      verb,
    },
    shouldRunCheck,
  );
};

export const useProjectPermissionsAccessReview = (
  verb: K8sVerb,
  projectName: string,
  shouldRunCheck?: boolean,
): ReturnType<typeof useAccessReview> =>
  useAccessReview(
    {
      group: 'rbac.authorization.k8s.io',
      resource: 'rolebindings',
      namespace: projectName,
      verb,
    },
    shouldRunCheck,
  );

export const useProjectPermissionsTabVisible = (
  projectName: string,
  shouldRunCheck?: boolean,
): ReturnType<typeof useAccessReview> =>
  useAccessReview(
    {
      group: 'rbac.authorization.k8s.io',
      resource: 'rolebindings',
      namespace: projectName,
      verb: 'list',
    },
    shouldRunCheck,
  );

// TODO: expand this out to meet future needs
export const useProjectSettingsTabVisible = (): boolean =>
  useIsAreaAvailable(SupportedArea.BIAS_METRICS).status;
