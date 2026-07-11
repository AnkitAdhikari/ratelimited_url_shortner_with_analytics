import { Empty, theme } from 'antd';
import { useMemo } from 'react';
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

import loaderCat from '@/assets/lottie/loder-cat.json';
import LottieBox from '@/components/LottieBox';
import type { DailyCount } from '@/types/urlTypes';
import styles from './dashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface Props {
  series: DailyCount[];
  loading: boolean;
}

export default function ClicksChart({ series, loading }: Props) {
  const { token } = theme.useToken();

  const options: ChartOptions<'line'> = useMemo(
    () => ({
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
    }),
    [token],
  );

  const data = useMemo(
    () => ({
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
    }),
    [series, token],
  );

  if (loading) {
    return (
      <div className={styles.centerBox}>
        <LottieBox animationData={loaderCat} size="6rem" ariaLabel="Loading click data" />
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
