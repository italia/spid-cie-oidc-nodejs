const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/oidc/rp',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
    })
  );
};