import type { DailyCount, UrlSummary } from '@/types/urlTypes';

const BRAND_ARGB = 'FF2A1E5C';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

// quote fields containing commas, quotes or newlines (URLs often contain commas)
function csvField(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvBlob(header: string[], rows: (string | number)[][]): Blob {
  const lines = [header, ...rows].map((row) => row.map(csvField).join(','));
  return new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
}

function styleHeaderRow(sheet: import('exceljs').Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_ARGB } };
  header.alignment = { vertical: 'middle' };
  header.height = 20;
}

function addUrlsSheet(workbook: import('exceljs').Workbook, urls: UrlSummary[]) {
  const sheet = workbook.addWorksheet('All URLs');
  sheet.columns = [
    { header: 'Alias', key: 'alias', width: 12 },
    { header: 'Target URL', key: 'longURL', width: 60 },
    { header: 'Total Clicks', key: 'totalClicks', width: 12, style: { numFmt: '#,##0' } },
    { header: 'Created', key: 'createdAt', width: 22 },
  ];
  urls.forEach((url) =>
    sheet.addRow({
      alias: url.alias,
      longURL: url.longURL,
      totalClicks: url.totalClicks,
      createdAt: new Date(url.createdAt).toLocaleString(),
    }),
  );
  styleHeaderRow(sheet);
}

async function writeWorkbook(workbook: import('exceljs').Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  );
}

function parquetBlob(buffer: ArrayBuffer): Blob {
  return new Blob([buffer], { type: 'application/vnd.apache.parquet' });
}

export function exportClicksCsv(alias: string, series: DailyCount[]) {
  triggerDownload(
    csvBlob(
      ['day', 'clicks'],
      series.map((point) => [point.day, point.count]),
    ),
    `clicks-${alias}-${today()}.csv`,
  );
}

export async function exportClicksXlsx(alias: string, series: DailyCount[], urls: UrlSummary[]) {
  const { Workbook } = await import('exceljs');

  const workbook = new Workbook();
  workbook.created = new Date();

  const clicksSheet = workbook.addWorksheet(`Clicks ${alias}`.slice(0, 31));
  clicksSheet.columns = [
    { header: 'Day', key: 'day', width: 14 },
    { header: 'Clicks', key: 'clicks', width: 10, style: { numFmt: '#,##0' } },
  ];
  series.forEach((point) => clicksSheet.addRow({ day: point.day, clicks: point.count }));
  styleHeaderRow(clicksSheet);

  addUrlsSheet(workbook, urls);

  await writeWorkbook(workbook, `clicks-${alias}-${today()}.xlsx`);
}

export async function exportClicksParquet(alias: string, series: DailyCount[]) {
  const { parquetWriteBuffer } = await import('hyparquet-writer');

  const buffer = parquetWriteBuffer({
    // uncompressed: tiny data, and every parquet reader can open it
    codec: 'UNCOMPRESSED',
    columnData: [
      { name: 'day', data: series.map((point) => point.day), type: 'STRING' },
      { name: 'clicks', data: series.map((point) => point.count), type: 'INT32' },
    ],
  });

  triggerDownload(parquetBlob(buffer), `clicks-${alias}-${today()}.parquet`);
}

export function exportUrlsCsv(urls: UrlSummary[]) {
  triggerDownload(
    csvBlob(
      ['alias', 'target_url', 'total_clicks', 'created_at'],
      urls.map((url) => [url.alias, url.longURL, url.totalClicks, url.createdAt]),
    ),
    `urls-${today()}.csv`,
  );
}

export async function exportUrlsXlsx(urls: UrlSummary[]) {
  const { Workbook } = await import('exceljs');

  const workbook = new Workbook();
  workbook.created = new Date();
  addUrlsSheet(workbook, urls);

  await writeWorkbook(workbook, `urls-${today()}.xlsx`);
}

export async function exportUrlsParquet(urls: UrlSummary[]) {
  const { parquetWriteBuffer } = await import('hyparquet-writer');

  const buffer = parquetWriteBuffer({
    codec: 'UNCOMPRESSED',
    columnData: [
      { name: 'alias', data: urls.map((url) => url.alias), type: 'STRING' },
      { name: 'target_url', data: urls.map((url) => url.longURL), type: 'STRING' },
      { name: 'total_clicks', data: urls.map((url) => url.totalClicks), type: 'INT32' },
      { name: 'created_at', data: urls.map((url) => new Date(url.createdAt)), type: 'TIMESTAMP' },
    ],
  });

  triggerDownload(parquetBlob(buffer), `urls-${today()}.parquet`);
}
