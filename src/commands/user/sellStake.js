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
    .setName('sellstake')
    .setDescription('Sell existing stake in tournament')
    .addStringOption((option) =>
      option
        .setName('tournament')
        .setDescription('Tournament to sell stake')
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('amount')
        .setDescription('Percent you want to sell')
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

  run: async ({ interaction, client, handler }) => {
    try {
      if (occupied)
        return interaction.reply({
          content: 'Bot is busy. Please try again shortly.',
        });
      occupied = true;
      await interaction.deferReply();
      const date = new Date();
      const sheets = await connectToSheets(auth);
      const authObj = {
        sheets,
        auth,
        spreadsheetId,
      };

      const tournament = interaction.options.getString('tournament');
      const user = interaction.user.id;
      const amountStr = interaction.options.getString('amount');
      const amount = convertFromPercent(amountStr);

      const tournamentNameRow = await getActiveTournaments(authObj, tournament);
      const tournamentObj = tournamentNameRow.reduce((tourn, [key, value]) => {
        tourn[key] = value;
        return tourn;
      }, {});

      if (tournament == '#N/A')
        return (occupied = await endInteraction(
          interaction,
          'There are no tournaments to stake at this time.'
        ));

      if (!tournamentObj[tournament])
        return (occupied = await endInteraction(
          interaction,
          'Select a tournament from the list of tournaments'
        ));

      const tournamentRow = await getTournamentRow(authObj, tournament);
      const tier = await getTier(authObj, user);

      if (!tier)
        return (occupied = await endInteraction(
          interaction,
          'You are not set up to invest in tournaments'
        ));

      tierCol = tierMap[tier];
      if (tier.error || !tierCol)
        return (occupied = await endInteraction(
          interaction,
          'There was an error looking up your tier.'
        ));

      const markup = tournamentRow[tierCol];
      const stakeObj = await getStake(authObj, user, tournament);
      const currentStake = stakeObj.stake
        ? convertFromPercent(stakeObj.stake)
        : 0;

      if (currentStake < amount)
        return (occupied = await endInteraction(
          interaction,
          `The amount you want to sell of ${amountStr} exceeds the current amount you own ${convertToPercent(
            currentStake
          )}`
        ));

      await addTransaction(
        authObj,
        user,
        tournament,
        amount,
        tier,
        markup,
        date,
        interaction.id,
        true
      );

      const newStakeObj = await getStake(authObj, user, tournament);
      return (occupied = await endInteraction(
        interaction,
        `Your investment has been sold\n\tTournament: ${
          tournamentObj[tournament]
        }\n\tInvestment sold: ${amountStr}\n\tTotal investment in tournament: ${
          newStakeObj.stake
        }\n\tBuy-In: ${toCurrency(newStakeObj.buyin)}`
      ));
    } catch (error) {
      console.error(error);
      occupied = await endInteraction(
        interaction,
        `If you're seeing this something went seriously wrong with this interaction... Run /checkstake to see if your stake was recorded and tell Rocco to fix the bot`
      );
    }
  },

  autocomplete: async ({ interaction, client, handler }) => {
    try {
      const sheets = await connectToSheets(auth);
      const authObj = {
        sheets,
        auth,
        spreadsheetId,
      };
      interaction.respond(await tournamentAC(authObj, interaction));
    } catch (error) {
      console.error(error);
    }
  },
};
