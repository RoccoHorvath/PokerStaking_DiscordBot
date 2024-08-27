const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const { auth, connectToSheets } = require('../../utils/sheetsAPI');
const {toCurrency} = require('../../utils/converters')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Returns total buy ins and winnings'),

  run: async ({ interaction, client, handler }) => {
    try {
      const sheets = await connectToSheets(auth);
      const investorRow = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Investor Balances!A:G',
        })
      ).data.values.filter((row) => row[0] === interaction.user.id)[0];
      console.log(investorRow)
      if (!investorRow.length)
        return await interaction.reply({
          content: `User not found on Investor Balances tab`,
        });

      const buyins = investorRow[3];
      const winnings = investorRow[4];
      const deposits = investorRow[5];
      const withdrawals = investorRow[6];

      const roi = (
        (parseFloat(winnings.replace('$', '').replace(',', '')) /
          parseFloat(buyins.replace('$', '').replace(',', '')) -
          1) *
        100
      ).toFixed(2);
      const net = (
        parseFloat(withdrawals.replace('$', '').replace(',', '')) -
        parseFloat(deposits.replace('$', '').replace(',', ''))
      ).toFixed(2);
      interaction.reply({
        content: `Buy-Ins: ${buyins}\nWinnings: ${winnings}\nNet Withdrawals: ${toCurrency(
          net
        )}\nReturn on Investment: ${roi}%`,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: `Error checking stats`,
      });
    }
  },
};
