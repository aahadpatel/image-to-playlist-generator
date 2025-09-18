const app = require('./index');
const port = process.env.SERVER_PORT || 5002;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});