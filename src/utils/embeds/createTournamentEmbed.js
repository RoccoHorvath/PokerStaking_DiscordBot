const { EmbedBuilder } = require('discord.js');
const toCurrency = require('../converters/toCurrency')
function createTournamentEmbed(tournament) {
  try{
  const embed = new EmbedBuilder().setTitle(tournament.name).setColor('#0099ff');
  if (!tournament.name) return;
  embed.addFields({
    name: 'Tournament Info',
    value: `Expected Buy-In: ${toCurrency(tournament.buyin)}\nLast Day To Buy: ${tournament.date}`,
  });
  for (const tier in tournament.tiers) {
    if (tournament.tiers[tier].markup) {

    embed.addFields({
      name: tier,
      value: `Markup: ${tournament.tiers[tier].markup}\nBuy-In per 1%: ${tournament.tiers[tier].buyin}\nMax Stake: ${tournament.tiers[tier].maxStake}\nStake remaining: ${tournament.tiers[tier].availableStake}`,
    });
  }
  };

  return embed;}catch(error){
    console.error(error)
    return null
  }
}

module.exports = createTournamentEmbed;