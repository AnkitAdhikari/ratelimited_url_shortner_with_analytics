import { Alert, App, Button, Input, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import clockWait from '@/assets/lottie/clock-wait.json';
import successCheck from '@/assets/lottie/success-check.json';
import LottieBox from '@/components/LottieBox';
import { rateLimitCleared, selectRateLimitUntil } from '@/redux/feature/rateLimitSlice';
import { useCreateShortUrlMutation } from '@/redux/services/urls';
import { useAppDispatch, useAppSelector } from '@/redux/store/hooks';
import { DASHBOARD_ROUTE } from '@/routes/routeNames';
import { describeError } from '@/utils/apiError';
import { remainingSeconds } from './countdown';
import { getUrlError } from './schema';
import styles from './shorten.module.css';

export default function Shorten() {
  const { message } = App.useApp();
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
      // handled via the mutation error state and rateLimit slice
    }
  }

  return (
    <section className={styles.hero}>
      <div className={styles.gridBg} aria-hidden="true" />
      <div className={styles.orbA} aria-hidden="true" />
      <div className={styles.orbB} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.liveDot} aria-hidden="true" />
          live click tracking · zero config
        </div>

        <Typography.Title level={1} className={styles.headline}>
          Shorten long links.
          <br />
          Track every <span className={styles.accent}>click</span>.
        </Typography.Title>

        <Typography.Paragraph type="secondary" className={styles.subtitle}>
          Paste a URL and get a short 6-character alias. Every visit is recorded, so you can watch
          clicks build up on the dashboard.
        </Typography.Paragraph>

        <div className={styles.terminal}>
          <div className={styles.terminalBar}>
            <div className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className={styles.terminalTitle}>shorten.sh</div>
            <div className={styles.terminalSpacer} />
          </div>

          <div className={styles.terminalBody}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space.Compact style={{ width: '100%' }} size="large">
                <span className={styles.prompt} aria-hidden="true">
                  $
                </span>
                <Input
                  variant="borderless"
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
                  className={styles.submit}
                  onClick={() => void handleSubmit()}
                  loading={isLoading}
                  disabled={!canSubmit}
                >
                  shorten
                </Button>
              </Space.Compact>

              {/* fixed-height region so alerts appearing/disappearing never shift the layout */}
              <div className={styles.feedback} aria-live="polite">
                {validationMessage !== null && (
                  <Typography.Text type="danger" role="alert">
                    {validationMessage}
                  </Typography.Text>
                )}

                {rateLimitUntil !== null && (
                  <Alert
                    type="warning"
                    showIcon
                    icon={<LottieBox animationData={clockWait} size="2.5rem" ariaLabel="Waiting" />}
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
                    icon={
                      <LottieBox
                        animationData={successCheck}
                        loop={false}
                        size="2.5rem"
                        ariaLabel="Success"
                      />
                    }
                    message="Short URL created"
                    description={
                      <Typography.Text
                        copyable={{
                          text: created.shortURL,
                          onCopy: () => void message.success('Link copied to clipboard'),
                        }}
                      >
                        <a href={created.shortURL} target="_blank" rel="noreferrer">
                          {created.shortURL}
                        </a>
                      </Typography.Text>
                    }
                  />
                )}
              </div>
            </Space>
          </div>
        </div>

        <Typography.Text type="secondary" className={styles.helper}>
          Already shortened something? <Link to={DASHBOARD_ROUTE}>View analytics →</Link>
        </Typography.Text>
      </div>
    </section>
  );
}
