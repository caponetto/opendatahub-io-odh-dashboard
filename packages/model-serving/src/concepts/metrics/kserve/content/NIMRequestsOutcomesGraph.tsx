import React from 'react';
import { TimeframeTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import { useFetchNimRequestsOutcomesData } from '../../../../api/prometheus/kservePerformanceMetrics';
import MetricsChart from '../../../../pages/screens/metrics/MetricsChart';
import { MetricsChartTypes } from '../../../../pages/screens/metrics/types';
import { NimMetricGraphDefinition } from '../types';

type NimRequestsOutcomesGraphProps = {
  graphDefinition: NimMetricGraphDefinition;
  timeframe: TimeframeTitle;
  end: number;
  namespace: string;
};

const NimRequestsOutcomesGraph: React.FC<NimRequestsOutcomesGraphProps> = ({
  graphDefinition,
  timeframe,
  end,
  namespace,
}) => {
  const {
    data: { successCount, failedCount },
  } = useFetchNimRequestsOutcomesData(graphDefinition, timeframe, end, namespace);

  return (
    <MetricsChart
      metrics={[
        ...(graphDefinition.queries[0]
          ? [
              {
                name: `Successful`,
                metric: successCount,
              },
            ]
          : []),
        ...(graphDefinition.queries[1]
          ? [
              {
                name: `Failed`,
                metric: failedCount,
              },
            ]
          : []),
      ]}
      color="blue"
      title={graphDefinition.title}
      isStack
      type={MetricsChartTypes.DONUT}
    />
  );
};

export default NimRequestsOutcomesGraph;
