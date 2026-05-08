export const isMLflowConsoleLink = (linkName?: string): boolean =>
  !!linkName && linkName.startsWith('mlflow');
