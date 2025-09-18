const app = require('./login');

// Export a serverless function handler
module.exports = (req, res) => {
  // Remove /api prefix for local Express routing
  req.url = req.url.replace(/^\/api/, '');
  return app(req, res);
};