import type { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import type {
  K8sDSGResource,
  ServingRuntimeKind,
  TemplateKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ServingRuntimeAPIProtocol } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { asEnumMember } from '@odh-dashboard/dashboard-foundation-frontend/utilities/utils';

export const getAPIProtocolFromServingRuntime = (
  resource: ServingRuntimeKind,
): ServingRuntimeAPIProtocol | undefined => {
  if (!resource.metadata.annotations?.['opendatahub.io/apiProtocol']) {
    return undefined;
  }
  return (
    asEnumMember(
      resource.metadata.annotations['opendatahub.io/apiProtocol'],
      ServingRuntimeAPIProtocol,
    ) ?? undefined
  );
};

export const getDisplayNameFromServingRuntimeTemplate = (resource: ServingRuntimeKind): string => {
  const templateName =
    resource.metadata.annotations?.['opendatahub.io/template-display-name'] ||
    resource.metadata.annotations?.['opendatahub.io/template-name'];
  const legacyTemplateName =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- K8s resources can arrive without spec at runtime
    resource.spec?.builtInAdapter?.serverType === 'ovms' ? 'OpenVINO Model Server' : undefined;

  return templateName || legacyTemplateName || 'Unknown Serving Runtime';
};

export const isTemplateKind = (resource: K8sResourceCommon): resource is TemplateKind =>
  resource.kind === 'Template';

export const isServingRuntimeKind = (
  obj: K8sResourceCommon | K8sDSGResource,
): obj is ServingRuntimeKind => {
  if (obj.kind !== 'ServingRuntime') {
    const error = new Error('kind: must be ServingRuntime.');
    error.name = 'Invalid parameter';
    throw error;
  }
  if (!obj.spec?.containers) {
    const error = new Error('spec.containers: is required.');
    error.name = 'Missing parameter';
    throw error;
  }
  if (!obj.spec.supportedModelFormats) {
    const error = new Error('spec.supportedModelFormats: is required.');
    error.name = 'Missing parameter';
    throw error;
  }
  return true;
};

export const getServingRuntimeVersion = (
  resource: ServingRuntimeKind | TemplateKind | undefined,
): string | undefined => {
  if (!resource) {
    return undefined;
  }
  if (isTemplateKind(resource)) {
    return (
      resource.objects[0].metadata.annotations?.['opendatahub.io/runtime-version'] || undefined
    );
  }
  return resource.metadata.annotations?.['opendatahub.io/runtime-version'] || undefined;
};

export const getTemplateNameFromServingRuntime = (
  resource: ServingRuntimeKind,
): string | undefined => resource.metadata.annotations?.['opendatahub.io/template-name'];

export const getServingRuntimeNameFromTemplate = (template: TemplateKind): string | undefined =>
  template.metadata.annotations?.['opendatahub.io/template-name'];

export const findTemplateByName = (
  templates: TemplateKind[],
  templateName: string,
): TemplateKind | undefined =>
  templates.find(
    (t) =>
      getServingRuntimeNameFromTemplate(t) === templateName || t.metadata.name === templateName,
  );
