import { QueryTypes } from 'sequelize';
import { sequelize } from '../db/client.js';

interface DailyClickCount {
  day: string;
  count: number;
}

interface GetClicksOptions {
  urlId?: number | null; // undefined/null = all URLs combined
  days?: number; // default 7
  endDate?: Date; // default now
}

export async function getDailyClicks({
  urlId = null,
  days = 7,
  endDate,
}: GetClicksOptions): Promise<DailyClickCount[]> {
  const rows = await sequelize.query<{ day: string; count: string }>(
    `
    WITH series AS (
      SELECT generate_series(
        date_trunc('day', COALESCE($3::timestamptz, now())) - ($2::int - 1) * INTERVAL '1 day',
        date_trunc('day', COALESCE($3::timestamptz, now())),
        INTERVAL '1 day'
      ) AS day
    )
    SELECT
      to_char(s.day, 'YYYY-MM-DD') AS day,
      COUNT(c.id) AS count
    FROM series s
    LEFT JOIN clicks c
      ON ($1::int IS NULL OR c."urlId" = $1::int)
      AND c."clickedAt" >= s.day
      AND c."clickedAt" <  s.day + INTERVAL '1 day'
    GROUP BY s.day
    ORDER BY s.day
    `,
    {
      bind: [urlId, days, endDate ?? null],
      type: QueryTypes.SELECT,
    },
  );

  return rows.map((row) => ({ day: row.day, count: Number(row.count) }));
}
