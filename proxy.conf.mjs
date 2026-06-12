export default {
  '/api': {
    target: 'https://localhost:8383',
    secure: false,
    changeOrigin: true,
    ws: false,
    rewrite: (path) => path.replace(/^\/api/, ''),
    configure: (proxy) => {
      proxy.on('error', (err) => {
        console.error('[proxy] Error:', err.message);
      });
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('Connection', 'keep-alive');
      });
    }
  }
};
