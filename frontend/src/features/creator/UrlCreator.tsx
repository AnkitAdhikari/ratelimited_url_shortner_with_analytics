import { Alert, Button, Card, Input, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { createShortUrl } from '../../api/client';
import { remainingSeconds } from './countdown';

interface SuccessState {
  alias: string;
  shortURL: string;
}

export default function UrlCreator() {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (rateLimitUntil === null) return;
    setSecondsLeft(remainingSeconds(rateLimitUntil, Date.now()));
    const id = setInterval(() => {
      const remaining = remainingSeconds(rateLimitUntil, Date.now());
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setRateLimitUntil(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  const disabled = submitting || rateLimitUntil !== null;

  async function handleSubmit() {
    const trimmed = url.trim();
    if (!trimmed) {
      setSuccess(null);
      setError('Please enter a URL to shorten.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await createShortUrl(trimmed);
      console.log(result);
      if (result.ok) {
        setSuccess({ alias: '', shortURL: result.shortURL });
      } else if ('retryAfterSeconds' in result) {
        setRateLimitUntil(Date.now() + result.retryAfterSeconds * 1000);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Shorten a URL">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="https://example.com/some/long/path"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onPressEnter={() => void handleSubmit()}
            disabled={disabled}
            allowClear
          />
          <Button
            type="primary"
            onClick={() => void handleSubmit()}
            loading={submitting}
            disabled={disabled}
          >
            Shorten
          </Button>
        </Space.Compact>

        {rateLimitUntil !== null && (
          <Alert
            type="warning"
            showIcon
            message="Rate limit reached"
            description={`Too many requests. You can try again in ${secondsLeft}s.`}
          />
        )}

        {rateLimitUntil === null && error !== null && (
          <Alert type="error" showIcon closable message={error} onClose={() => setError(null)} />
        )}

        {rateLimitUntil === null && success !== null && (
          <Alert
            type="success"
            showIcon
            message="Short URL created"
            description={
              <Typography.Text copyable={{ text: success.shortURL }}>
                <a href={success.shortURL} target="_blank" rel="noreferrer">
                  {success.shortURL}
                </a>
              </Typography.Text>
            }
          />
        )}
      </Space>
    </Card>
  );
}
