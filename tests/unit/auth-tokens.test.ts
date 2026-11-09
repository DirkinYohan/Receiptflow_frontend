import { beforeEach, describe, expect, it } from 'vitest';
import {
  IDLE_TIMEOUT_MS,
  clearTokens,
  getAccessToken,
  isSessionIdle,
  markActivity,
  setTokens,
} from '@/lib/auth-tokens';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('auth tokens', () => {
  it('keeps a normal session only for the browser session', () => {
    setTokens({ access: 'a', refresh: 'r' }, false);
    expect(sessionStorage.getItem('receiptflow_access_token')).toBe('a');
    expect(localStorage.getItem('receiptflow_access_token')).toBeNull();
    expect(getAccessToken()).toBe('a');
  });

  it('keeps a remembered session across browser restarts', () => {
    setTokens({ access: 'a', refresh: 'r' }, true);
    expect(localStorage.getItem('receiptflow_access_token')).toBe('a');
    expect(sessionStorage.getItem('receiptflow_access_token')).toBeNull();
  });

  it('expires a normal session after the idle timeout', () => {
    setTokens({ access: 'a', refresh: 'r' }, false);
    markActivity(Date.now() - IDLE_TIMEOUT_MS - 1000);
    expect(isSessionIdle()).toBe(true);
    expect(getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('receiptflow_access_token')).toBeNull();
  });

  it('never idles out a remembered session', () => {
    setTokens({ access: 'a', refresh: 'r' }, true);
    markActivity(0);
    expect(isSessionIdle(Date.now() + IDLE_TIMEOUT_MS * 10)).toBe(false);
    expect(getAccessToken()).toBe('a');
  });

  it('keeps the chosen storage when a token is renewed', () => {
    setTokens({ access: 'a', refresh: 'r' }, true);
    setTokens({ access: 'b', refresh: 'r2' });
    expect(localStorage.getItem('receiptflow_access_token')).toBe('b');
  });

  it('logs out everywhere', () => {
    setTokens({ access: 'a', refresh: 'r' }, true);
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('receiptflow_remember')).toBeNull();
  });
});
