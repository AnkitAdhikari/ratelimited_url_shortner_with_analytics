import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { Alert, App, Button, Card, Dropdown, Empty, Space } from 'antd';
import { useState } from 'react';

import loaderCat from '@/assets/lottie/loder-cat.json';
import LottieBox from '@/components/LottieBox';
import { useGetAliasAnalyticsQuery, useGetUrlsQuery } from '@/redux/services/urls';
import {
  exportClicksCsv,
  exportClicksParquet,
  exportClicksXlsx,
  exportUrlsCsv,
  exportUrlsParquet,
  exportUrlsXlsx,
} from '@/utils/exportData';
import ClicksChart from './ClicksChart';
import styles from './dashboard.module.css';
import UrlList from './UrlList';

type ExportFormat = 'csv' | 'xlsx' | 'parquet';
type ExportJobs = Record<ExportFormat, () => void | Promise<void>>;

const EXPORT_FORMATS = [
  { key: 'csv', label: 'CSV (.csv)' },
  { key: 'xlsx', label: 'Excel (.xlsx)' },
  { key: 'parquet', label: 'Parquet (.parquet)' },
];

function ExportDropdown({
  disabled,
  onExport,
}: {
  disabled: boolean;
  onExport: (format: ExportFormat) => void;
}) {
  return (
    <Dropdown
      disabled={disabled}
      menu={{
        items: EXPORT_FORMATS,
        onClick: ({ key }) => onExport(key as ExportFormat),
      }}
    >
      <Button icon={<DownloadOutlined />}>export</Button>
    </Dropdown>
  );
}

export default function Dashboard() {
  const { message } = App.useApp();
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);

  const {
    data: urls = [],
    isFetching: urlsLoading,
    isError: urlsError,
    refetch: refetchUrls,
  } = useGetUrlsQuery();

  const {
    data: analytics,
    isFetching: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useGetAliasAnalyticsQuery(selectedAlias ?? skipToken);

  const series = analytics?.series ?? [];

  async function runExport(scope: string, format: ExportFormat, jobs: ExportJobs) {
    try {
      await jobs[format]();
      void message.success(`Exported ${scope} as ${format.toUpperCase()}`);
    } catch {
      void message.error('Export failed. Try again.');
    }
  }

  function handleExportClicks(format: ExportFormat) {
    if (selectedAlias === null) return;
    void runExport('clicks', format, {
      csv: () => exportClicksCsv(selectedAlias, series),
      xlsx: () => exportClicksXlsx(selectedAlias, series, urls),
      parquet: () => exportClicksParquet(selectedAlias, series),
    });
  }

  function handleExportUrls(format: ExportFormat) {
    void runExport('URLs', format, {
      csv: () => exportUrlsCsv(urls),
      xlsx: () => exportUrlsXlsx(urls),
      parquet: () => exportUrlsParquet(urls),
    });
  }

  async function handleRefresh() {
    const jobs: Promise<unknown>[] = [refetchUrls().unwrap()];
    if (selectedAlias !== null) jobs.push(refetchAnalytics().unwrap());

    try {
      await Promise.all(jobs);
      void message.success('Dashboard refreshed');
    } catch {
      void message.error('Could not refresh. Try again.');
    }
  }

  return (
    <div className={styles.container}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title="Your URLs"
          extra={
            <Space>
              <ExportDropdown disabled={urls.length === 0} onExport={handleExportUrls} />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => void handleRefresh()}
                loading={urlsLoading}
              >
                refresh
              </Button>
            </Space>
          }
        >
          {urlsError ? (
            <Alert
              type="error"
              showIcon
              title="Could not load the URL list."
              action={
                <Button size="small" onClick={() => void refetchUrls()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <UrlList
              urls={urls}
              loading={urlsLoading}
              selectedAlias={selectedAlias}
              onSelect={setSelectedAlias}
            />
          )}
        </Card>

        <Card
          title="Clicks (last 7 days)"
          extra={
            <ExportDropdown
              disabled={selectedAlias === null || series.length === 0}
              onExport={handleExportClicks}
            />
          }
        >
          {selectedAlias === null ? (
            <div className={styles.centerBox}>
              <Empty
                image={<LottieBox animationData={loaderCat} size="6rem" ariaLabel="" />}
                description="Select a URL to see its click history"
              />
            </div>
          ) : analyticsError ? (
            <Alert
              type="error"
              showIcon
              title="Could not load analytics for this URL."
              action={
                <Button size="small" onClick={() => void refetchAnalytics()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <ClicksChart series={series} loading={analyticsLoading} />
          )}
        </Card>
      </Space>
    </div>
  );
}
