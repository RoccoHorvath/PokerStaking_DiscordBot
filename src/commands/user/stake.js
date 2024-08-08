const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const auth = require('../../index.js');
const connectToSheets = require('../../utils/connectToSheets.js');
let occupied = false;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stake')
    .setDescription('Buy stake of tournament winnings')
    .addStringOption((option) =>
      option
        .setName('tournament')
        .setDescription('Tournament to stake')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('amount')
        .setDescription('Percent you want to buy')
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
    ),
  // options:{deleted:true},

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

      const tournament = interaction.options.getString('tournament');
      if (tournament == '#N/A') {
        interaction.reply('There are no tournaments to stake at this time.');
        return (occupied = false);
      }
      if (!tournaments.has(tournament)) {
        interaction.reply('Select a tournament from the list of tournaments');
        return (occupied = false);
      }
      const amountStr = interaction.options.getString('amount');
      const amount =
        parseFloat(interaction.options.getString('amount').replace('%', '')) /
        100;

      const user = interaction.user.id;
      interaction.deferReply();

      const tournamentRow = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Tournament Info!A:U',
        })
      ).data.values.filter((row) => row[0] === tournament)[0];

      let tier;
      try {
        tier = (
          await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: 'Investor Info!A:C',
          })
        ).data.values.filter((row) => row[0] === user)[0][2];
      } catch (error) {
        interaction.editReply({
          content: `You are not set up to invest in tournaments`,
        });
        return (occupied = false);
      }
      tierCol = tierMap[tier];
      const markup = tournamentRow[tierCol];
      const maxStake =
        parseFloat(tournamentRow[tierCol + 1].replace('%', '')) / 100;
      const availableStake =
        parseFloat(tournamentRow[tierCol + 2].replace('%', '')) / 100 -
        parseFloat(tournamentRow[tierCol + 3].replace('%', '')) / 100;

      const stakeRow = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Summary!A:C',
        })
      ).data.values.filter(
        (row) => row[0] === user && row[1] === tournament
      )[0];

      const currentStake = stakeRow
        ? parseFloat(stakeRow[2].replace('%', '')) / 100
        : 0;
      if (currentStake + amount > maxStake) {
        interaction.editReply({
          content: `Your current stake of ${
            currentStake * 100
          }% plus the amount you want to buy of ${
            amount * 100
          }% exceeds the max stake per person of ${maxStake * 100}%.`,
        });
        return (occupied = false);
      }

      if (amount > availableStake) {
        interaction.editReply({
          content: `The amount you want to buy exceeds the available stake left to be sold. Amount available ${
            availableStake < 0 ? '0.00' : availableStake * 100
          }%`,
        });
        return (occupied = false);
      }

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'Transactions!A:H',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [
            [
              interaction.user.id,
              tournament,
              amount,
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
          range: 'Summary!A:E',
        })
      ).data.values.filter(
        (row) => row[0] === user && row[1] === tournament
      )[0][2];

      interaction.editReply({
        content: `Your investment has been recorded\n\tTournament: ${tournament}\n\tInvestment: ${amountStr}\n\tTotal investment in tournament: ${newStake}`,
      });
      return (occupied = false);
    } catch {
      console.error(error);
      interaction.editReply({
        content: `Something went wrong when recording your investment. Run the /checkstake command to see if it was recorded. If not, try to run /stake one more time. If it still doesn't work message Rocco`,
      });
      return (occupied = false);
    }
  },

  autocomplete: async ({ interaction, client, handler }) => {
    const sheets = await connectToSheets(auth);
    const tournamentRows = (
      await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'Active Tournaments!A:A',
      })
    ).data.values.filter((row) => row[0]);
    try {
      const focusedTournamentOption = interaction.options
        .getString('tournament')
        .toLowerCase();

      const filteredChoices = tournamentRows.filter((tournament) =>
        tournament[0].toLowerCase().includes(focusedTournamentOption)
      );
      const results = filteredChoices.map((tournament) => {
        return {
          name: tournament[0],
          value: tournament[0],
        };
      });
      interaction.respond(results);
    } catch (error) {
      console.error(error);
    }
  },
};
