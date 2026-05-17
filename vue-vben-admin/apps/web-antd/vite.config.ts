import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          // Timer-Plus 认证接口（无 /api 前缀）
          '/auth': {
            changeOrigin: true,
            target: 'http://47.120.68.44:666',
          },
          // Timer-Plus 列表接口（无 /api 前缀）
          '/list': {
            changeOrigin: true,
            target: 'http://47.120.68.44:666',
          },
          // Timer-Plus API 接口（有 /api 前缀，不需要重写）
          '/api': {
            changeOrigin: true,
            target: 'http://47.120.68.44:666',
            configure: (proxy: any, _options: any) => {
              proxy.on('proxyReq', (proxyReq: any, req: any) => {
                // 强制保留原始 URL（含 query string）
                proxyReq.path = req.url;
                // eslint-disable-next-line no-console
                console.log('[ViteProxy→Backend]', req.method, req.url);
              });
              proxy.on('error', (_err: any, _req: any, _res: any) => {
                // eslint-disable-next-line no-console
                console.log('[ViteProxy Error]', _err.message);
              });
            },
          },
        },
      },
    },
  };
});
