import { describe, it, expect } from 'vitest';
import { createServer, type Server } from 'node:net';
import {
  isPortFree,
  findFreePort,
  DEFAULT_PORT,
  DEFAULT_MAX_ATTEMPTS,
} from '../../src/utils/port.js';

/** Open a listening socket on an ephemeral port and return { server, port }. */
function occupyPort(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        resolve({ server, port: addr.port });
      } else {
        reject(new Error('failed to get port'));
      }
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

/** Reserve an ephemeral port then release it, yielding a very-likely-free port. */
async function freePort(): Promise<number> {
  const { server, port } = await occupyPort();
  await close(server);
  return port;
}

describe('isPortFree', () => {
  it('returns true for an available port', async () => {
    const port = await freePort();
    expect(await isPortFree(port)).toBe(true);
  });

  it('returns false when the port is in use', async () => {
    const { server, port } = await occupyPort();
    try {
      expect(await isPortFree(port)).toBe(false);
    } finally {
      await close(server);
    }
  });
});

describe('findFreePort', () => {
  it('returns the start port when it is free', async () => {
    const start = await freePort();
    expect(await findFreePort(start)).toBe(start);
  });

  it('skips an occupied start port and picks the next free one', async () => {
    const { server, port: occupied } = await occupyPort();
    try {
      const result = await findFreePort(occupied);
      expect(result).toBeGreaterThan(occupied);
      // the chosen port must actually be bindable
      expect(await isPortFree(result)).toBe(true);
    } finally {
      await close(server);
    }
  });

  it('throws when every port in the range is occupied', async () => {
    const { server, port: occupied } = await occupyPort();
    try {
      // only a single attempt allowed, and that port is taken
      await expect(findFreePort(occupied, 1)).rejects.toThrow(/No free port found/);
    } finally {
      await close(server);
    }
  });

  it('throws without probing when maxAttempts is 0', async () => {
    await expect(findFreePort(99999, 0)).rejects.toThrow(/No free port found/);
  });

  it('exposes sensible defaults', () => {
    expect(DEFAULT_PORT).toBe(24278);
    expect(DEFAULT_MAX_ATTEMPTS).toBeGreaterThan(0);
  });
});
