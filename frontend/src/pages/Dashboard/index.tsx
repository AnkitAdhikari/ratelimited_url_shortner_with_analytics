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

const EXPORT_FORMATS = [
  { key: 'csv', label: 'CSV (.csv)' },
  { key: 'xlsx', label: 'Excel (.xlsx)' },
  { key: 'parquet', label: 'Parquet (.parquet)' },
];

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

  async function handleExportClicks(format: string) {
    if (selectedAlias === null) return;
    try {
      if (format === 'csv') {
        exportClicksCsv(selectedAlias, series);
      } else if (format === 'xlsx') {
        await exportClicksXlsx(selectedAlias, series, urls);
      } else {
        await exportClicksParquet(selectedAlias, series);
      }
      void message.success(`Exported clicks as ${format.toUpperCase()}`);
    } catch {
      void message.error('Export failed. Try again.');
    }
  }

  async function handleExportUrls(format: string) {
    try {
      if (format === 'csv') {
        exportUrlsCsv(urls);
      } else if (format === 'xlsx') {
        await exportUrlsXlsx(urls);
      } else {
        await exportUrlsParquet(urls);
      }
      void message.success(`Exported URLs as ${format.toUpperCase()}`);
    } catch {
      void message.error('Export failed. Try again.');
    }
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
              <Dropdown
                disabled={urls.length === 0}
                menu={{
                  items: EXPORT_FORMATS,
                  onClick: ({ key }) => void handleExportUrls(key),
                }}
              >
                <Button icon={<DownloadOutlined />}>Export</Button>
              </Dropdown>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => void handleRefresh()}
                loading={urlsLoading}
              >
                Refresh
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
            <Dropdown
              disabled={selectedAlias === null || series.length === 0}
              menu={{
                items: EXPORT_FORMATS,
                onClick: ({ key }) => void handleExportClicks(key),
              }}
            >
              <Button icon={<DownloadOutlined />}>Export</Button>
            </Dropdown>
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
