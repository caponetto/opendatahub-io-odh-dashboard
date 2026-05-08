import { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import { HardwareProfileKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { BYONImage, BYONImagePackage } from '@odh-dashboard/dashboard-foundation-frontend/types';

export const convertBYONImageToK8sResource = (image: BYONImage): K8sResourceCommon => ({
  kind: 'ImageStream',
  apiVersion: 'image.openshift.io/v1',
  metadata: {
    name: image.name,
    annotations: {
      'openshift.io/display-name': image.display_name,
    },
  },
});

enum ImageEnabledStatus {
  ENABLED = 1,
  DISABLED = 0,
  ERROR = -1,
}

export const getEnabledStatus = (image: BYONImage): number =>
  image.visible && !image.error
    ? ImageEnabledStatus.ENABLED
    : image.error
    ? ImageEnabledStatus.ERROR
    : ImageEnabledStatus.DISABLED;

export const filterBlankPackages = (packages: BYONImagePackage[]): BYONImagePackage[] =>
  packages.filter((p) => p.name.trim() || p.version.trim());

export const filterHardwareProfilesByRecommendedIdentifiers = (
  hardwareProfiles: HardwareProfileKind[],
  recommendedIdentifiers: string[],
): HardwareProfileKind[] =>
  hardwareProfiles.filter((cr) =>
    recommendedIdentifiers.some((i) =>
      cr.spec.identifiers?.map((identifier) => identifier.identifier).includes(i),
    ),
  );
