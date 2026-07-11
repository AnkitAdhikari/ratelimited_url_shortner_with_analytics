import { Alert, Button, Card, Input, Space, Typography } from 'antd';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { rateLimitCleared, selectRateLimitUntil } from '@/redux/feature/rateLimitSlice';
import { useCreateShortUrlMutation } from '@/redux/services/urls';
import { useAppDispatch, useAppSelector } from '@/redux/store/hooks';
import { DASHBOARD_ROUTE } from '@/routes/routeNames';
import { remainingSeconds } from './countdown';
import { getUrlError } from './schema';
import styles from './shorten.module.css';

function describeError(
  error: FetchBaseQueryError | { message?: string } | undefined,
): string | null {
  if (error === undefined) return null;

  if ('status' in error) {
    if (error.status === 429) return null;
    if (error.status === 'FETCH_ERROR') {
      return 'Could not reach the server. Check your connection and try again.';
    }
    if (typeof error.data === 'object' && error.data !== null) {
      const body = error.data as { message?: unknown; error?: unknown };
      const message = body.message ?? body.error;
      if (typeof message === 'string') return message;
    }
    return 'Request failed';
  }

  return error.message ?? 'Request failed';
}

export default function Shorten() {
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [createShortUrl, { data: created, error, isLoading, reset }] = useCreateShortUrlMutation();

  const dispatch = useAppDispatch();
  const rateLimitUntil = useAppSelector(selectRateLimitUntil);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (rateLimitUntil === null) return;
    setSecondsLeft(remainingSeconds(rateLimitUntil, Date.now()));
    const id = setInterval(() => {
      const remaining = remainingSeconds(rateLimitUntil, Date.now());
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        dispatch(rateLimitCleared());
      }
    }, 1000);
    return () => clearInterval(id);
  }, [rateLimitUntil, dispatch]);

  const trimmedUrl = url.trim();

  const validationMessage = trimmedUrl === '' ? null : getUrlError(trimmedUrl);

  const disabled = isLoading || rateLimitUntil !== null;
  const canSubmit = !disabled && trimmedUrl !== '' && validationMessage === null;

  const apiError = describeError(error);
  const errorMessage = formError ?? apiError;

  function handleChange(value: string) {
    setUrl(value);

    if (formError !== null) setFormError(null);
    if (created !== undefined || error !== undefined) reset();
  }

  async function handleSubmit() {
    if (trimmedUrl === '') {
      setFormError('Please enter a URL to shorten.');
      return;
    }

    if (validationMessage !== null) return;

    setFormError(null);
    try {
      await createShortUrl(trimmedUrl).unwrap();
    } catch {
      // surfaced through the mutation's error state and the rateLimit slice
    }
  }

  return (
    <section className={styles.hero}>
      <Typography.Title level={1} className={styles.headline}>
        Shorten long links. Track every click.
      </Typography.Title>

      <Typography.Paragraph type="secondary" className={styles.subtitle}>
        Paste a URL and get a short 6-character alias. Every visit is recorded, so you can watch
        clicks build up on the dashboard.
      </Typography.Paragraph>

      <Card className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%' }} size="large">
            <Input
              placeholder="https://example.com/some/long/path"
              value={url}
              status={validationMessage !== null ? 'error' : undefined}
              onChange={(event) => handleChange(event.target.value)}
              onPressEnter={() => void handleSubmit()}
              disabled={disabled}
              allowClear
            />
            <Button
              type="primary"
              onClick={() => void handleSubmit()}
              loading={isLoading}
              disabled={!canSubmit}
            >
              Shorten
            </Button>
          </Space.Compact>

          {validationMessage !== null && (
            <Typography.Text type="danger" role="alert">
              {validationMessage}
            </Typography.Text>
          )}

          {rateLimitUntil !== null && (
            <Alert
              type="warning"
              showIcon
              message="Rate limit reached"
              description={`Too many requests. You can try again in ${secondsLeft}s.`}
            />
          )}

          {rateLimitUntil === null && errorMessage !== null && (
            <Alert
              type="error"
              showIcon
              closable
              message={errorMessage}
              onClose={() => {
                setFormError(null);
                reset();
              }}
            />
          )}

          {rateLimitUntil === null && created !== undefined && (
            <Alert
              type="success"
              showIcon
              message="Short URL created"
              description={
                <Typography.Text copyable={{ text: created.shortURL }}>
                  <a href={created.shortURL} target="_blank" rel="noreferrer">
                    {created.shortURL}
                  </a>
                </Typography.Text>
              }
            />
          )}
        </Space>
      </Card>

      <Typography.Text type="secondary">
        Already shortened something? <Link to={DASHBOARD_ROUTE}>View analytics</Link>
      </Typography.Text>
    </section>
  );
}
