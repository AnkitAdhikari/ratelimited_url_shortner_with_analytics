import { Empty, Spin, theme } from 'antd';
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
import styles from './dashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface Props {
  series: DailyCount[];
  loading: boolean;
}

export default function ClicksChart({ series, loading }: Props) {
  // chart colors come from the active antd theme so both modes stay readable
  const { token } = theme.useToken();

  if (loading) {
    return (
      <div className={styles.centerBox}>
        <Spin />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className={styles.centerBox}>
        <Empty description="No click data" />
      </div>
    );
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: token.colorTextSecondary },
        grid: { color: token.colorSplit },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: token.colorTextSecondary },
        grid: { color: token.colorSplit },
      },
    },
  };

  const data = {
    labels: series.map((point) => point.day),
    datasets: [
      {
        label: 'Clicks',
        data: series.map((point) => point.count),
        borderColor: token.colorPrimary,
        backgroundColor: token.colorPrimaryBg,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  return (
    <div className={styles.chartBox}>
      <Line
        data={data}
        options={options}
        role="img"
        aria-label="Daily click counts over the last 7 days"
      />
    </div>
  );
}
