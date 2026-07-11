import { Table, type TableColumnsType, Tooltip } from 'antd';

import AnimatedTableRow from '@/components/AnimatedTableRow';
import type { UrlSummary } from '@/types/urlTypes';
import styles from './dashboard.module.css';

interface Props {
  urls: UrlSummary[];
  loading: boolean;
  selectedAlias: string | null;
  onSelect: (alias: string) => void;
}

const columns: TableColumnsType<UrlSummary> = [
  {
    title: 'Alias',
    dataIndex: 'alias',
    width: 110,
    render: (alias: string) => <span className={styles.aliasBadge}>{alias}</span>,
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

// each table row acts as a radio button
export default function UrlList({ urls, loading, selectedAlias, onSelect }: Props) {
  return (
    <Table<UrlSummary>
      rowKey="alias"
      columns={columns}
      dataSource={urls}
      loading={loading}
      components={{ body: { row: AnimatedTableRow } }}
      pagination={{
        hideOnSinglePage: true,
        showSizeChanger: true,
        pageSizeOptions: [10, 15, 25, 50],
        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
      }}
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
