async function addTransaction(
  authObj,
  user,
  tournament,
  amount,
  tier,
  markup,
  date,
  interactionID,
  sell
) {
  amount /= 10000;
  values = [
    [
      user,
      tournament,
      sell ? amount * -1 : amount,
      tier,
      markup,
      date.toLocaleDateString(),
      date.toTimeString(),
      interactionID,
    ],
  ];
  try {
    await authObj.sheets.spreadsheets.values.append({
      auth: authObj.auth,
      spreadsheetId: authObj.spreadsheetId,
      range: 'Transactions!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    });
    console.log(`Transaction recorded for interaction ID: ${interactionID}`);
  } catch (error) {
    console.error(
      `Error recording transaction for interaction ID: ${interactionID}\nTried to record row: ${values}\n${error}`
    );
  }
}

module.exports = addTransaction;
