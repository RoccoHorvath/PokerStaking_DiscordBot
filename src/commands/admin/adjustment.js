const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const {
  addTransaction,
  auth,
  connectToSheets,
  getActiveTournaments,
  getTier,
  getTournamentRow,
  getStake,
  getBalance,
  endInteraction,
} = require('../../utils/sheetsAPI');
const {
  tierMap,
  toCurrency,
  convertFromPercent,
  convertToPercent,
} = require('../../utils/converters');
const tournamentAC = require('../../utils/autocomplete/tournamentsAC');
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
      const adminsString = process.env.adminRoles;
      const adminRoles = JSON.parse(adminsString);
      if (
        !interaction.member.roles.cache.some((role) =>
          adminRoles.includes(role.id)
        )
      )
        return interaction.reply({
          content: 'You must be an admin to run this command',
        });
      await interaction.deferReply();
      const date = new Date();
      const sheets = await connectToSheets(auth);
      const authObj = {
        sheets,
        auth,
        spreadsheetId,
      };
      const tournament = interaction.options.getString('tournament');
      const amountStr = interaction.options.getString('amount');
      const amount = convertFromPercent(amountStr);
      const user = interaction.options.getString('investor');
      const sell = interaction.options.getBoolean('sell');
      tournamentRows = (
        await authObj.sheets.spreadsheets.values.get({
          auth: authObj.auth,
          spreadsheetId: authObj.spreadsheetId,
          range: 'Tournament Info!A:B',
        })
      ).data.values.filter((row) => row[1]);
      const tournamentObj = tournamentRows.reduce((tourn, [value, key]) => {
        tourn[key] = value;
        return tourn;
      }, {});
      const regex = /^\d+$/;
      const tournamentId = regex.test(tournament)
        ? tournament
        : tournamentObj[tournament];
      const tournamentRow = await getTournamentRow(authObj, tournamentId);

      if (!tournamentRow || !tournamentRow[1])
        return (occupied = await endInteraction(
          interaction,
          `${tournament} is not an ID or name of a tournament on the Tournament Info tab`
        ));

      console.log(`Looking up investor row for ${user}`);
      const investorRow = (
        await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Investor Info!A:C',
        })
      ).data.values.filter((row) => row[0] === user)[0];

      console.log(`Found investor row ${investorRow}`);

      const name = investorRow[1];
      const tier = await getTier(authObj, investorRow[0]);
      if (!tier)
        return (occupied = await endInteraction(
          interaction,
          'User is not set up to invest in tournaments'
        ));

      tierCol = tierMap[tier];
      if (tier.error || !tierCol)
        return (occupied = await endInteraction(
          interaction,
          'There was an error looking up the users tier.'
        ));
      const markup = tournamentRow[tierCol];
      if (!markup)
        return (occupied = await endInteraction(
          interaction,
          `There is no markup for tier: ${tier}. This will result in a buy in of $0.00. Transaction not recorded.`
        ));

      await addTransaction(
        authObj,
        user,
        tournamentId,
        amount,
        tier,
        markup,
        date,
        interaction.id,
        sell
      );

      const newStakeObj = await getStake(authObj, user, tournamentId);
      await tournaments(client, process.env.tournamentsChannelId);

      return (occupied = await endInteraction(
        interaction,
        `Investment has been ${
          sell ? 'sold' : 'recorded'
        }\n\tInvestor: ${name}\n\tTournament: ${
          tournamentRow[1]
        }\n\tInvestment: ${amountStr}\n\t\n\tTotal investment in tournament: ${
          newStakeObj.stake
        }\n\tBuy-In: ${toCurrency(newStakeObj.buyin)}`
      ));
    } catch (error) {
      console.log(error);
      occupied = await endInteraction(
        interaction,
        `Could not verify new stake. Check that the transaction was recorded.`
      );
    }
  },

  autocomplete: async ({ interaction, client, handler }) => {
    try {
      const sheets = await connectToSheets(auth);
      const focusedOption = interaction.options.getFocused(true);
      const authObj = {
        sheets,
        auth,
        spreadsheetId,
      };
      if (focusedOption.name === 'tournament') {
        interaction.respond(await tournamentAC(authObj, interaction));
      } else if (focusedOption.name === 'investor') {
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
        interaction.respond(results.slice(0, 25));
      }
    } catch (error) {
      console.log(error);
    }
  },
};
