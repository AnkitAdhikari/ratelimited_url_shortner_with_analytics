import { ReloadOutlined } from '@ant-design/icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { Alert, App, Button, Card, Empty, Space } from 'antd';
import { useState } from 'react';

import loaderCat from '@/assets/lottie/loder-cat.json';
import LottieBox from '@/components/LottieBox';
import { useGetAliasAnalyticsQuery, useGetUrlsQuery } from '@/redux/services/urls';
import ClicksChart from './ClicksChart';
import styles from './dashboard.module.css';
import UrlList from './UrlList';

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
            <Button icon={<ReloadOutlined />} onClick={() => void handleRefresh()} loading={urlsLoading}>
              Refresh
            </Button>
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

        <Card title="Clicks (last 7 days)">
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
            <ClicksChart series={analytics?.series ?? []} loading={analyticsLoading} />
          )}
        </Card>
      </Space>
    </div>
  );
}
