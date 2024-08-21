async function getStake(authObj, user, tournament) {
  try {
    console.log(
      `Entering getStake for user ${user} and tournament ${tournament}`
    );
    const stakeRow = (
      await authObj.sheets.spreadsheets.values.get({
        auth: authObj.auth,
        spreadsheetId: authObj.spreadsheetId,
        range: 'Summary!A:F',
      })
    ).data.values.filter((row) => row[0] === user && row[1] === tournament)[0];

    if (!stakeRow) {
      console.log('No row found');
      return { stake: 0, buyin: 0 };
    }
    console.log(
      `Found row [${stakeRow}]... returning {stake:${stakeRow[2]}, buyin: ${stakeRow[5]}}`
    );
    return { stake: stakeRow[2], buyin: stakeRow[5] };
  } catch (error) {
    console.error(
      `Error looking up stake for user ${user} and tournament ${tournament}.\n${error}`
    );
    return null;
  }
}

module.exports = getStake;
