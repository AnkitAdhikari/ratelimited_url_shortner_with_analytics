import { Empty, Spin } from 'antd';
import {
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { DailyCount } from '@/types/urlTypes';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const CHART_HEIGHT = 320;

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
    },
  },
};

interface Props {
  series: DailyCount[];
  loading: boolean;
}

export default function ClicksChart({ series, loading }: Props) {
  if (loading) {
    return (
      <div style={{ height: CHART_HEIGHT, display: 'grid', placeItems: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div style={{ height: CHART_HEIGHT, display: 'grid', placeItems: 'center' }}>
        <Empty description="No click data" />
      </div>
    );
  }

  const data = {
    labels: series.map((point) => point.day),
    datasets: [
      {
        label: 'Clicks',
        data: series.map((point) => point.count),
        borderColor: '#1677ff',
        backgroundColor: 'rgba(22, 119, 255, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  return (
    <div style={{ height: CHART_HEIGHT }}>
      <Line
        data={data}
        options={options}
        role="img"
        aria-label="Daily click counts over the last 7 days"
      />
    </div>
  );
}
