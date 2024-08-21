async function getBalance(authObj, user) {
  try {
    console.log(`Entering getBalance for user ${user}`)
    const investorRow = (
      await authObj.sheets.spreadsheets.values.get({
        auth: authObj.auth,
        spreadsheetId: authObj.spreadsheetId,
        range: 'Investor Balances!A:C',
      })
    ).data.values.filter((row) => row[0] === user)[0];
    console.log(
      `Found row for user ${user}: ${investorRow}\n Returning ${investorRow[2]}`
    );
    return investorRow[2];
  } catch (error) {
    console.error(`Error finding row for user ${user}\n${error}`);
    return null
  }
}

module.exports = getBalance
