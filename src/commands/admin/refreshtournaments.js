const { SlashCommandBuilder } = require('discord.js');
const tournaments = require('./tournaments');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('torunaments')
    .setDescription('Refresh #tournaments channel'),
// options: {deleted:true},
  run: async ({ interaction, client, handler }) => {
    try {
      await interaction.deferReply();
      if (process.env.tournamentsChannelId) {
        await tournaments(client, process.env.tournamentsChannelId);
        await interaction.editReply({
          content: '#tournaments channel updated',
        });
      } else {
        await interaction.editReply({
          content:
            'tournamentsChannelId not found in .env file. #tournaments not updated',
        });
      }
    } catch (error) {
      console.error(error);
      interaction.editReply({
        content: `Error updating #tournaments channel`,
      });
    }
  },
        options: {devOnly: true},
};
