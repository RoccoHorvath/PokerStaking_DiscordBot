require('dotenv/config');
const cron = require('node-cron');

const { Client, IntentsBitField } = require('discord.js');
const { CommandKit } = require('commandkit');
const tournaments = require('./commands/admin/tournaments');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

new CommandKit({
  client,
  eventsPath: `${__dirname}/events`,
  commandsPath: `${__dirname}/commands`,
});

client.login(process.env.TOKEN);
client.once('ready', () => {
  if (process.env.tournamentsChannelId) {
    cron.schedule('0 0,6,12,18 * * *', () => {
      tournaments(client, process.env.tournamentsChannelId);
    });

    console.log('Tournaments scheduler is active.');
  }
});
