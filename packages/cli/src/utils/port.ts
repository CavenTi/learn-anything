import { createServer, type Server } from 'node:net';

export const DEFAULT_PORT = 24278;
export const DEFAULT_MAX_ATTEMPTS = 50;

/**
 * Test whether a TCP port is free to bind.
 *
 * Probes without binding a specific host so the check matches the behaviour of
 * `server.listen(port)` used by the dev server (which listens on the wildcard
 * address). The probe socket is unreffed so it never keeps the process alive.
 */
export function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const probe: Server = createServer();
    probe.unref();

    const done = (result: boolean) => {
      if (settled) return;
      settled = true;
      probe.removeAllListeners();
      resolve(result);
    };

    probe.once('error', () => {
      // EADDRINUSE / EACCES / permission issues → port unavailable.
      done(false);
    });
    probe.once('listening', () => {
      // Successfully bound — close and hand the port back.
      probe.close(() => done(true));
    });

    probe.listen(port);
  });
}

/**
 * Find the first free port starting from `startPort`, incrementing one at a
 * time up to `maxAttempts` (inclusive of the start port). Throws when the
 * whole range is occupied.
 */
export async function findFreePort(
  startPort: number,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
): Promise<number> {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const port = startPort + offset;
    if (await isPortFree(port)) {
      return port;
    }
  }
  const endPort = startPort + maxAttempts - 1;
  throw new Error(`No free port found in range ${startPort}-${endPort}`);
}
