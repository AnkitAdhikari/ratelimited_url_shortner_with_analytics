import { Table, type TableColumnsType, Tooltip, Typography } from 'antd';

import type { UrlSummary } from '@/types/urlTypes';

interface Props {
  urls: UrlSummary[];
  loading: boolean;
  selectedAlias: string | null;
  onSelect: (alias: string) => void;
}

// each table row acts as radio button
export default function UrlList({ urls, loading, selectedAlias, onSelect }: Props) {
  const columns: TableColumnsType<UrlSummary> = [
    {
      title: 'Alias',
      dataIndex: 'alias',
      width: 110,
      render: (alias: string) => <Typography.Text code>{alias}</Typography.Text>,
    },
    {
      title: 'Target URL',
      dataIndex: 'longURL',
      // showTitle off: the Tooltip already shows the full URL
      ellipsis: { showTitle: false },
      render: (longURL: string) => (
        <Tooltip title={longURL}>
          <a
            href={longURL}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            {longURL}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Clicks',
      dataIndex: 'totalClicks',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.totalClicks - b.totalClicks,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      width: 190,
      responsive: ['sm'],
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
    },
  ];

  return (
    <Table<UrlSummary>
      rowKey="alias"
      columns={columns}
      dataSource={urls}
      loading={loading}
      pagination={{ pageSize: 5, hideOnSinglePage: true }}
      rowSelection={{
        type: 'radio',
        selectedRowKeys: selectedAlias === null ? [] : [selectedAlias],
        onChange: (keys) => {
          const [key] = keys;
          if (key !== undefined) onSelect(String(key));
        },
      }}
      onRow={(record) => ({
        onClick: () => onSelect(record.alias),
        style: { cursor: 'pointer' },
      })}
    />
  );
}
