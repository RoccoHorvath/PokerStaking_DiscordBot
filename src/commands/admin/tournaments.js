const { EmbedBuilder, messageLink } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const {
  auth,
  connectToSheets,
  getBalance,
  getActiveTournaments,
} = require('../../utils/sheetsAPI');
const {
  tierMap,
  toCurrency,
  convertFromPercent,
  convertToPercent,
} = require('../../utils/converters');
const createTournamentEmbed = require('../../utils/embeds/createTournamentEmbed');

async function tournaments(client, channelId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found.`);
      return;
    }
    const sheets = await connectToSheets(auth);
    authObj = { sheets, auth, spreadsheetId };
    const tournaments = await getActiveTournaments(authObj);
    const tournamentObj = tournaments.reduce((tourn, [key, value]) => {
      tourn[key] = { name: value };
      return tourn;
    }, {});
    const tournamentRows = (
      await authObj.sheets.spreadsheets.values.get({
        auth: authObj.auth,
        spreadsheetId: authObj.spreadsheetId,
        range: 'Tournament Info!A:V',
      })
    ).data.values.filter((row) => row[0] in tournamentObj);

    for (const tournament of tournamentRows) {
      tournamentObj[tournament[0]].tiers = {};
      tournamentObj[tournament[0]].buyin = tournament[2];
      tournamentObj[tournament[0]].date = tournament[5];
      for (const tier in tierMap) {
        tournamentObj[tournament[0]].tiers[tier] = {};
        const tierCol = tierMap[tier];
        tournamentObj[tournament[0]].tiers[tier].markup = tournament[tierCol];
        tournamentObj[tournament[0]].tiers[tier].maxStake =
          tournament[tierCol + 1];
        tournamentObj[tournament[0]].tiers[tier].availableStake =
          convertFromPercent(tournament[tierCol + 2]) - convertFromPercent(tournament[tierCol + 3]);
        tournamentObj[tournament[0]].tiers[tier].buyin = `${toCurrency(
          (tournament[tierCol] * tournament[2]) / 100
        )}`;
        console.log(tournamentObj[tournament[0]].tiers[tier]);
      }
    }
    let embeds = [];
    for (const tournament in tournamentObj) {
      if (tournament == '#N/A') continue;
      console.log(tournament);
      const embed = createTournamentEmbed(tournamentObj[tournament]);
      if (embed) embeds.push(embed);
    }
    const lastMessage = (await channel.messages.fetch({ limit: 1 })).first();

//    if (lastMessage) {
//      await lastMessage.delete();
//      console.log(`Deleted the last message with ID: ${lastMessage.id}`);
//    }

    if (embeds.length) {
      await lastMessage.edit({ embeds: embeds });
    } else {
      await lastMessage.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle('No Upcoming Tournaments')
            .setColor('#0099ff'),
        ],
      });
    }
  } catch (error) {
    console.error(error);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found.`);
      return;
    }

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('Error Displaying Upcoming Tournaments')
          .setColor('#0099ff'),
      ],
    });
  }
}

module.exports = tournaments;
