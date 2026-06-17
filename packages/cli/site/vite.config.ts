import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const topicsDir =
    mode === 'test' ? resolve(__dirname, '../test/fixtures/topics') : resolve(__dirname, 'topics');

  return {
    plugins: [
      vue(),
      tailwindcss(),
      {
        name: 'topics-full-reload',
        apply: 'serve',
        configureServer(server) {
          server.watcher.add(topicsDir);
          const onAddUnlink = (file: string) => {
            const normalized = file.replace(/\\/g, '/');
            if (normalized.startsWith(topicsDir)) {
              server.ws.send({ type: 'full-reload' });
            }
          };
          server.watcher.on('add', onAddUnlink);
          server.watcher.on('unlink', onAddUnlink);
        },
      },
    ],
    resolve: {
      alias: {
        '@data': resolve(__dirname, 'topics'),
      },
    },
    server: {
      host: true,
      port: 5173,
      fs: {
        allow: [resolve(__dirname, '../..'), resolve(__dirname, '../topics')],
      },
    },
  };
});
