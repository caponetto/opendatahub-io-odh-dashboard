export function validatePackageList(
  wantedNames: string[],
  availableNames: string[],
  source: string,
): string[];

export function resolveSelectedPackages(
  availableNames: string[],
  assemblerDir?: string,
  options?: { prependPackages?: string[] },
): string[];
