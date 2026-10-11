import { withExponentialBackoff } from './stellar';

describe('withExponentialBackoff', () => {
  it('resolves immediately when operation succeeds on first attempt', async () => {
    let callCount = 0;
    const mockFn = async () => {
      callCount++;
      return 'ok';
    };

    const result = await withExponentialBackoff(mockFn, { maxRetries: 3, initialDelayMs: 5 });
    if (result !== 'ok' || callCount !== 1) {
      throw new Error(`Unexpected result: ${result}, calls: ${callCount}`);
    }
  });

  it('retries on HTTP 429 rate limit and succeeds on subsequent attempt', async () => {
    let callCount = 0;
    const mockFn = async () => {
      callCount++;
      if (callCount < 2) {
        const err: any = new Error('HTTP 429 Too Many Requests');
        err.status = 429;
        throw err;
      }
      return 'recovered';
    };

    const result = await withExponentialBackoff(mockFn, { maxRetries: 3, initialDelayMs: 5 });
    if (result !== 'recovered' || callCount !== 2) {
      throw new Error(`Expected recovery on 2nd attempt, got: ${result}, calls: ${callCount}`);
    }
  });

  it('aborts and rethrows when non-transient 400 error occurs', async () => {
    let callCount = 0;
    const mockFn = async () => {
      callCount++;
      const err: any = new Error('Bad Request');
      err.status = 400;
      throw err;
    };

    try {
      await withExponentialBackoff(mockFn, { maxRetries: 3, initialDelayMs: 5 });
      throw new Error('Should have thrown');
    } catch (err: any) {
      if (err.status !== 400 || callCount !== 1) {
        throw new Error(`Expected non-transient error to fail without retrying, calls: ${callCount}`);
      }
    }
  });
});
