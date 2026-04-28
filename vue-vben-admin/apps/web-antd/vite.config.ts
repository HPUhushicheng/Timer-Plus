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
            ws: true,
          },
        },
      },
    },
  };
});
