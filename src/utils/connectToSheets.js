const { google } = require('googleapis');
async function connectToSheets(auth) {
  googleClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: googleClient });
}

module.exports = connectToSheets;
