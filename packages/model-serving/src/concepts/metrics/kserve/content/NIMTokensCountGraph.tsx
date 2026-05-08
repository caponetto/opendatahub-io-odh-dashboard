import React from 'react';
import { TimeframeTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import { useFetchNimTokensCountData } from '../../../../api/prometheus/kservePerformanceMetrics';
import MetricsChart from '../../../../pages/screens/metrics/MetricsChart';
import { MetricsChartTypes } from '../../../../pages/screens/metrics/types';
import { convertPrometheusNaNToZero } from '../../../../pages/screens/metrics/utils';
import { NimMetricGraphDefinition } from '../types';

// Graph #3 - Total Prompt Token Count and Total Generation Token Count
type NimTokensCountGraphProps = {
  graphDefinition: NimMetricGraphDefinition;
  timeframe: TimeframeTitle;
  end: number;
  namespace: string;
};

const NimTokensCountGraph: React.FC<NimTokensCountGraphProps> = ({
  graphDefinition,
  timeframe,
  end,
  namespace,
}) => {
  const {
    data: { totalPromptTokenCount, totalGenerationTokenCount },
  } = useFetchNimTokensCountData(graphDefinition, timeframe, end, namespace);

  return (
    <MetricsChart
      title={graphDefinition.title}
      metrics={[
        ...(graphDefinition.queries[0]
          ? [
              {
                name: graphDefinition.queries[0].title, // "Total Prompt Token Count"
                metric: {
                  ...totalPromptTokenCount,
                  data: convertPrometheusNaNToZero(totalPromptTokenCount.data),
                },
              },
            ]
          : []),
        ...(graphDefinition.queries[1]
          ? [
              {
                name: graphDefinition.queries[1].title, // "Total Generation Token Count"
                metric: {
                  ...totalGenerationTokenCount,
                  data: convertPrometheusNaNToZero(totalGenerationTokenCount.data),
                },
              },
            ]
          : []),
      ]}
      type={MetricsChartTypes.LINE}
    />
  );
};

export default NimTokensCountGraph;
