const app = require("./index");

// Debug environment variables (will be removed later)
console.log("Environment Check:");
console.log("CLIENT_ID exists:", !!process.env.CLIENT_ID);
console.log("CLIENT_SECRET exists:", !!process.env.CLIENT_SECRET);
console.log("REDIRECT_URI:", process.env.REDIRECT_URI);
console.log("ALLOWED_ORIGINS:", process.env.ALLOWED_ORIGINS);

// Verify the exact URL being used
const fullRedirectUrl = new URL(process.env.REDIRECT_URI);
console.log("Full Redirect URL:", fullRedirectUrl.toString());
console.log("Protocol:", fullRedirectUrl.protocol);
console.log("Host:", fullRedirectUrl.host);
console.log("Path:", fullRedirectUrl.pathname);

const port = process.env.PORT || 5002;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
