const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const auth = require('../../index.js');
const connectToSheets = require('../../utils/connectToSheets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Returns current balance'),

  run: async ({ interaction, client, handler }) => {
    try {
      const sheets = await connectToSheets(auth);
      const balance = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Investor Balances!A:C',
        })
      ).data.values.filter((row) => row[0] === interaction.user.id)[0][2];

      interaction.reply({
        content: `Your account balance is ${balance}`,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: `Error checking account balance`,
      });
    }
  },
};
