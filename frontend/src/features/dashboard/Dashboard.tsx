import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, Space } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import { listUrls, type UrlSummary } from '../../api/client';
import ClicksChart from './ClicksChart';
import UrlList from './UrlList';
import { useAnalytics } from './useAnalytics';

const PANEL_HEIGHT = 320;

export default function Dashboard() {
  const [urls, setUrls] = useState<UrlSummary[]>([]);
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [urlsError, setUrlsError] = useState<string | null>(null);
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);

  const loadUrls = useCallback(async () => {
    setUrlsLoading(true);
    setUrlsError(null);
    try {
      setUrls(await listUrls());
    } catch {
      setUrlsError('Could not load the URL list.');
    } finally {
      setUrlsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUrls();
  }, [loadUrls]);

  const {
    series,
    loading: analyticsLoading,
    error: analyticsError,
    refresh,
  } = useAnalytics(selectedAlias);

  function handleRefresh() {
    void loadUrls();
    refresh();
  }

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="Your URLs"
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={urlsLoading}>
            Refresh
          </Button>
        }
      >
        {urlsError !== null ? (
          <Alert
            type="error"
            showIcon
            title={urlsError}
            action={
              <Button size="small" onClick={() => void loadUrls()}>
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
          <div style={{ height: PANEL_HEIGHT, display: 'grid', placeItems: 'center' }}>
            <Empty description="Select a URL to see its click history" />
          </div>
        ) : analyticsError !== null ? (
          <Alert
            type="error"
            showIcon
            title={analyticsError}
            action={
              <Button size="small" onClick={refresh}>
                Retry
              </Button>
            }
          />
        ) : (
          <ClicksChart series={series} loading={analyticsLoading} />
        )}
      </Card>
    </Space>
  );
}
