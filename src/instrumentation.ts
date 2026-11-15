import { assertServerEnv } from '@/lib/env';

// Next.js runs register() once when the server process starts.
// Throwing here stops a misconfigured server instead of letting it serve requests.
export function register() {
  assertServerEnv();
}
