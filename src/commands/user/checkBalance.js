const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const { auth, connectToSheets, getBalance } = require('../../utils/sheetsAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Returns current balance'),

  run: async ({ interaction, client, handler }) => {
    try {
      const sheets = await connectToSheets(auth);
      const balance = await getBalance(
        { sheets, auth, spreadsheetId },
        interaction.user.id
      );

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
