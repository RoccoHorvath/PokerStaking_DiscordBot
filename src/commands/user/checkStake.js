const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const auth = require('../../index.js');
const connectToSheets = require('../../utils/connectToSheets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkstake')
    .setDescription('check investments in active tournaments'),

  run: async ({ interaction, client, handler }) => {
    try {
      interaction.deferReply();
      const sheets = await connectToSheets(auth);
      const user = interaction.user.id;

      const tournamentRows = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Active Tournaments!A:A',
        })
      ).data.values.filter((row) => row[0]);

      let tournaments = new Set();
      tournamentRows.forEach((row) => {
        tournaments.add(row[0]);
      });

      const stakeRows = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Summary!A:E',
        })
      ).data.values.filter((row) => row[0] === user && tournaments.has(row[1]));

      let reply = '';
      for (const row of stakeRows) {
        reply += `${row[1]}: ${row[2]}\n`;
      }

      interaction.editReply({
        content: `Your investments in all upcoming tournaments:\n${reply}`,
      });
    } catch (error) {
      console.error(error);
      interaction.editReply({
        content: `Error checking stake in tournaments`,
      });
    }
  },
};
