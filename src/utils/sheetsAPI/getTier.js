async function getTier(authObj, user) {
  try {
    console.log(`Entering getTier for user ${user}`);
    const investorRow = (await authObj.sheets.spreadsheets.values
      .get({
        auth: authObj.auth,
        spreadsheetId: authObj.spreadsheetId,
        range: 'Investor Info!A:C',
      })).data.values.filter((row) => row[0] === user)[0];

    if (!investorRow) {
      console.log('No row found, returning null');
      return null;
    }
    console.log(`Found row: ${investorRow} returning ${investorRow[2]}`);
    return investorRow[2];
  } catch (error) {
    console.log(error);
    return {error:true}
    
  }
}

module.exports = getTier;
