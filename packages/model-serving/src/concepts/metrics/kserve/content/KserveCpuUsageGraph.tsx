import React from 'react';
import { TimeframeTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import { useFetchKserveCpuUsageData } from '../../../../api/prometheus/kservePerformanceMetrics';
import MetricsChart from '../../../../pages/screens/metrics/MetricsChart';
import { toPercentage } from '../../../../pages/screens/metrics/utils';
import { KserveMetricGraphDefinition } from '../types';

type KserveCpuUsageGraphProps = {
  graphDefinition: KserveMetricGraphDefinition;
  timeframe: TimeframeTitle;
  end: number;
  namespace: string;
};

const KserveCpuUsageGraph: React.FC<KserveCpuUsageGraphProps> = ({
  graphDefinition,
  timeframe,
  end,
  namespace,
}) => {
  const {
    data: { cpuUsage },
  } = useFetchKserveCpuUsageData(graphDefinition, timeframe, end, namespace);

  return (
    <MetricsChart
      title={graphDefinition.title}
      metrics={{ metric: cpuUsage, translatePoint: toPercentage }}
      color="purple"
      domain={() => ({
        y: [0, 100],
      })}
    />
  );
};

export default KserveCpuUsageGraph;
