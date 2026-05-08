import React from 'react';
import { ZodErrorHelperText } from '@odh-dashboard/dashboard-foundation-frontend/components/ZodErrorFormHelperText';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { useZodFormValidation } from '@odh-dashboard/dashboard-foundation-frontend/hooks/useZodFormValidation';
import StorageClassSelect from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/StorageClassSelect';
import { useDefaultStorageClass } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/useDefaultStorageClass';
import { useGetStorageClassConfig } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/useGetStorageClassConfig';
import { storageClassSchema } from '@odh-dashboard/pipelines/concepts/content/modelCustomizationForm/modelCustomizationFormSchema/validationUtils';

type TrainingStorageClassSelectProps = {
  data: string;
  setData: (data: string) => void;
};

const TrainingStorageClassSelect: React.FC<TrainingStorageClassSelectProps> = ({
  data,
  setData,
}) => {
  const isStorageClassesAvailable = useIsAreaAvailable(SupportedArea.STORAGE_CLASSES).status;
  const { getFieldValidation, getFieldValidationProps, markFieldTouched } = useZodFormValidation(
    data,
    storageClassSchema,
  );
  const [defaultStorageClass] = useDefaultStorageClass();
  const { storageClasses, storageClassesLoaded, selectedStorageClassConfig } =
    useGetStorageClassConfig();

  // when storageClass is unavailable
  React.useEffect(() => {
    if (!isStorageClassesAvailable && defaultStorageClass) {
      setData(defaultStorageClass.metadata.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStorageClassesAvailable, defaultStorageClass]);

  if (!isStorageClassesAvailable) {
    return null;
  }

  return (
    <>
      <StorageClassSelect
        storageClasses={storageClasses}
        storageClassesLoaded={storageClassesLoaded}
        selectedStorageClassConfig={selectedStorageClassConfig}
        isRequired
        storageClassName={data}
        setStorageClassName={(name) => {
          setData(name);
          markFieldTouched();
        }}
        validated={getFieldValidationProps().validated}
      />
      <ZodErrorHelperText zodIssue={getFieldValidation()} />
    </>
  );
};

export default TrainingStorageClassSelect;
