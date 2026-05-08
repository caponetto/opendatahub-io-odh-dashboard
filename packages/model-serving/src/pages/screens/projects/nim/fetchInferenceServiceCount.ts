import { getInferenceServiceContext } from '../../../../api/k8s/inferenceServices';

export const fetchInferenceServiceCount = async (namespace: string): Promise<number> => {
  try {
    const inferenceServices = await getInferenceServiceContext(namespace);
    return inferenceServices.length;
  } catch (error) {
    throw new Error(
      `Failed to fetch inference services for namespace "${namespace}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};
