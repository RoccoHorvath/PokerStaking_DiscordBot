async function getTournamentRow(authObj, tournament) {
  try {
    console.log(`Entering getTournamentRow for tournament ${tournament}`);
    tournamentRow = (
      await authObj.sheets.spreadsheets.values.get({
        auth: authObj.auth,
        spreadsheetId: authObj.spreadsheetId,
        range: 'Tournament Info!A:V',
      })
    ).data.values.filter((row) => row[0] === tournament)[0];
    console.log(`Found row [${tournamentRow}]`);
    return tournamentRow;
  } catch {
    error;
  }
  {
    console.error(`Error looking up tournament ${tournament}.\n${error}`);
  }
}

module.exports = getTournamentRow;
