const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const {
  auth,
  connectToSheets,
  getActiveTournaments,
  getTier,
  getStake,
  endInteraction,
} = require('../../utils/sheetsAPI');
const {
  tierMap,
  toCurrency,
  convertPercent,
} = require('../../utils/converters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkstake')
    .setDescription('check investments in active tournaments'),

  run: async ({ interaction, client, handler }) => {
    try {
      await interaction.deferReply();
      const sheets = await connectToSheets(auth);
      const user = interaction.user.id;

      const tournamentNameRow = await getActiveTournaments({
        auth,
        spreadsheetId,
        sheets,
      });
      const tournamentObj = tournamentNameRow.reduce((tourn, [key, value]) => {
        tourn[key] = value;
        return tourn;
      }, {});
      console.log(`Getting stake rows for user ${user}`);
      const stakeRows = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Summary!A:F',
        })
      ).data.values.filter((row) => row[0] === user && tournamentObj[row[1]]);
      console.log(`Found rows:\n\t${stakeRows}`);
      if (stakeRows.length == 0)
        return await endInteraction(
          interaction,
          'No stake in upcoming tournaments.'
        );
      let reply = '';
      for (const row of stakeRows) {
        reply += `${tournamentObj[row[1]]}:\n\tStake: ${
          row[2]
        }\n\tBuy-in: ${toCurrency(row[5])}\n`;
      }
      return await endInteraction(
        interaction,
        `Your investments in all upcoming tournaments:\n${reply}`
      );
    } catch (error) {
      console.error(error);
      interaction.editReply({
        content: `Error checking stake in tournaments`,
      });
    }
  },
};
