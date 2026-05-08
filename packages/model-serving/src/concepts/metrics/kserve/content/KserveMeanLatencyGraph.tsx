import React from 'react';
import { TimeframeTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import MetricsChart from '../../../../pages/screens/metrics/MetricsChart';
import { useFetchKserveMeanLatencyData } from '../../../../api/prometheus/kservePerformanceMetrics';
import { convertPrometheusNaNToZero } from '../../../../pages/screens/metrics/utils';
import { KserveMetricGraphDefinition } from '../types';

type KserveMeanLatencyGraphProps = {
  graphDefinition: KserveMetricGraphDefinition;
  timeframe: TimeframeTitle;
  end: number;
  namespace: string;
};

const KserveMeanLatencyGraph: React.FC<KserveMeanLatencyGraphProps> = ({
  graphDefinition,
  timeframe,
  end,
  namespace,
}) => {
  const {
    data: { requestLatency, inferenceLatency },
  } = useFetchKserveMeanLatencyData(graphDefinition, timeframe, end, namespace);

  return (
    <MetricsChart
      metrics={[
        {
          name: graphDefinition.queries[0].title,
          metric: {
            ...inferenceLatency,
            data: convertPrometheusNaNToZero(inferenceLatency.data),
          },
        },
        ...(graphDefinition.queries[1]
          ? [
              {
                name: graphDefinition.queries[1].title,
                metric: {
                  ...requestLatency,
                  data: convertPrometheusNaNToZero(requestLatency.data),
                },
              },
            ]
          : []),
      ]}
      color="green"
      title={graphDefinition.title}
    />
  );
};

export default KserveMeanLatencyGraph;
