import * as React from 'react';
import SimpleSelect, { SimpleSelectOption } from '#~/components/SimpleSelect';
import { MetricsCommonContext } from '#~/concepts/metrics/MetricsCommonContext';
import { RefreshIntervalTitle } from '#~/concepts/metrics/types';
import { isRefreshIntervalTitle } from '#~/concepts/metrics/utils';
import { asEnumMember, enumIterator } from '#~/utilities/utils';

export const MetricsRefreshIntervalSelect: React.FC = () => {
  const { currentRefreshInterval, setCurrentRefreshInterval } =
    React.useContext(MetricsCommonContext);

  return (
    <SimpleSelect
      value={currentRefreshInterval}
      onChange={(selection) => {
        const value = asEnumMember(selection, RefreshIntervalTitle);
        if (isRefreshIntervalTitle(value)) {
          setCurrentRefreshInterval(value);
        }
      }}
      options={enumIterator(RefreshIntervalTitle).map(
        ([, value]): SimpleSelectOption => ({
          key: value,
          label: value,
        }),
      )}
      toggleProps={{
        id: 'metrics-toolbar-refresh-interval-select-toggle',
        style: { width: '15ch' },
      }}
      data-testid="metrics-toolbar-refresh-interval-select"
      popperProps={{ maxWidth: undefined }}
    />
  );
};
