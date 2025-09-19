const loginApp = require('./login');
const tokenApp = require('./token');

// Export a serverless function handler
module.exports = (req, res) => {
  // Remove /api prefix for local Express routing
  req.url = req.url.replace(/^\/api/, '');
  
  // Route to the appropriate handler based on the path
  if (req.url.startsWith('/login')) {
    return loginApp(req, res);
  } else if (req.url.startsWith('/token')) {
    return tokenApp(req, res);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};