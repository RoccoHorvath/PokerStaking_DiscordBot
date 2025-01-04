const { SlashCommandBuilder } = require('discord.js');
const tournaments = require('./tournaments');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tournaments')
    .setDescription('Refresh #tournaments channel'),
  run: async ({ interaction, client, handler }) => {
    try {
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
  //options: {devOnly: true},
};
