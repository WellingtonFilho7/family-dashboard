import { describe, expect, it } from 'vitest';

import { isPasswordRecoveryLocation } from '../api/admin-auth';

describe('admin-auth recovery detection', () => {
  it('detects explicit recovery mode in query string', () => {
    expect(
      isPasswordRecoveryLocation({
        search: '?mode=recovery',
        hash: '',
      }),
    ).toBe(true);
  });

  it('detects recovery tokens in hash params', () => {
    expect(
      isPasswordRecoveryLocation({
        search: '',
        hash: '#type=recovery&access_token=abc&refresh_token=def',
      }),
    ).toBe(true);
  });

  it('ignores normal edit route URLs', () => {
    expect(
      isPasswordRecoveryLocation({
        search: '',
        hash: '',
      }),
    ).toBe(false);
  });
});
