const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const auth = require('../../index.js');
const connectToSheets = require('../../utils/connectToSheets.js');
let occupied = false;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adjustment')
    .setDescription('Adjustment')
    .addStringOption((option) =>
      option
        .setName('tournament')
        .setDescription('Tournament')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('investor')
        .setDescription('Investor')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('amount')
        .setDescription('Percent')
        .setRequired(true)
        .setChoices(
          { name: '0.5%', value: '0.5%' },
          { name: '1.0%', value: '1.0%' },
          { name: '1.5%', value: '1.5%' },
          { name: '2.0%', value: '2.0%' },
          { name: '2.5%', value: '2.5%' },
          { name: '3.0%', value: '3.0%' },
          { name: '3.5%', value: '3.5%' },
          { name: '4.0%', value: '4.0%' },
          { name: '4.5%', value: '4.5%' },
          { name: '5.0%', value: '5.0%' }
        )
    )
    .addBooleanOption((option) =>
      option.setName('sell').setDescription('Check if adjustment is a sell')
    ),
  options: {},

  run: async ({ interaction, client, handler }) => {
    try {
      if (occupied)
        return interaction.reply({
          content: 'Bot is busy. Please try again shortly.',
        });
      occupied = true;
      const date = new Date();
      const sheets = await connectToSheets(auth);
      const tierMap = {
        JJ: 5,
        QQ: 9,
        KK: 13,
        AA: 17,
      };

      const tournament = interaction.options.getString('tournament');
      const amountStr = interaction.options.getString('amount');
      const amount =
        parseFloat(interaction.options.getString('amount').replace('%', '')) /
        100;

      const user = interaction.options.getString('investor');

      const sell = interaction.options.getBoolean('sell');
      const tournamentRows = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Tournament Info!A:Q',
        })
      ).data.values.filter((row) => row[0] === tournament);

      if (tournamentRows.length === 0) {
        interaction.reply({
          content: `${tournament} is not listed on the Tournament Info tab`,
        });
        return (occupied = false);
      }
      interaction.deferReply();
      const investorRow = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Investor Info!A:C',
        })
      ).data.values.filter((row) => row[0] === user)[0];

      const name = investorRow[1];
      const tier = investorRow[2];
      const tierCol = tierMap[tier];
      const markup = tournamentRows[0][tierCol];

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'Transactions!A:H',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [
            [
              user,
              tournament,
              sell ? amount * -1 : amount,
              tier,
              markup,
              date.toLocaleDateString(),
              date.toTimeString(),
              interaction.id,
            ],
          ],
        },
      });

      const newStake = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Summary!A:C',
        })
      ).data.values.filter(
        (row) => row[0] === user && row[1] === tournament
      )[0][2];

      interaction.editReply({
        content: `Investment has been ${
          sell ? 'sold' : 'recorded'
        }\n\tInvestor: ${name}\n\tTournament: ${tournament}\n\tInvestment: ${amountStr}\n\tTotal invesment in tournament: ${newStake}`,
      });
      return (occupied = false);
    } catch (error) {
      interaction.editReply({
        content: `Could not verify new stake. Check that the transaction was recorded.`,
      });
      return (occupied = false);
    }
  },

  autocomplete: async ({ interaction, client, handler }) => {
    const sheets = await connectToSheets(auth);
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === 'tournament') {
      try {
        const tournamentRows = (
          await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: 'Active Tournaments!A:A',
          })
        ).data.values.filter((row) => row[0]);
        const filteredChoices = tournamentRows.filter((tournament) =>
          tournament[0].toLowerCase().includes(focusedOption.value)
        );
        const results = filteredChoices.map((tournament) => {
          return {
            name: tournament[0],
            value: tournament[0],
          };
        });
        interaction.respond(results);
      } catch (error) {}
    } else if (focusedOption.name === 'investor') {
      try {
        const investorRows = (
          await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: 'Investor Info!A2:B',
          })
        ).data.values.filter((row) => row[1]);
        const filteredChoices = investorRows.filter((investor) =>
          investor[1].toLowerCase().includes(focusedOption.value)
        );
        const results = filteredChoices.map((investor) => {
          return {
            name: investor[1],
            value: investor[0],
          };
        });
        interaction.respond(results.slice(0,25));
      } catch (error) {}
    }
  },
};
