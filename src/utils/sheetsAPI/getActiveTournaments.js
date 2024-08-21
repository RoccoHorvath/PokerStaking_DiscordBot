async function getActiveTournaments(authObj, tournament) {
  try {
    console.log(`Entering getActiveTournaments... tournament = ${tournament}`);
    const rows = await authObj.sheets.spreadsheets.values.get({
      auth: authObj.auth,
      spreadsheetId: authObj.spreadsheetId,
      range: 'Active Tournaments!A:B',
    });
    if (tournament)
      return rows.data.values.filter((row) => row[0] === tournament);
    return rows.data.values.filter((row) => row[0]);
  } catch (error) {
    console.error(error);
    return [];
  }
}

module.exports = getActiveTournaments;
