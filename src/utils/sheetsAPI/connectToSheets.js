const { google } = require('googleapis');
async function connectToSheets(auth) {
  try{
  googleClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: googleClient });}catch(error){
    console.error(`Error connecting to sheets\n${error}`)
  }
}

module.exports = connectToSheets;
