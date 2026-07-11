import { ReloadOutlined } from '@ant-design/icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { Alert, Button, Card, Empty, Space } from 'antd';
import { useState } from 'react';

import { useGetAliasAnalyticsQuery, useGetUrlsQuery } from '@/redux/services/urls';
import ClicksChart from './ClicksChart';
import styles from './dashboard.module.css';
import UrlList from './UrlList';

export default function Dashboard() {
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

  function handleRefresh() {
    void refetchUrls();
    if (selectedAlias !== null) void refetchAnalytics();
  }

  return (
    <div className={styles.container}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title="Your URLs"
          extra={
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={urlsLoading}>
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
              <Empty description="Select a URL to see its click history" />
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
