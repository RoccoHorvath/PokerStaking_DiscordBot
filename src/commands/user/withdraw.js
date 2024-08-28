const { SlashCommandBuilder } = require('discord.js');
const spreadsheetId = process.env.spreadsheetId;
const { auth, connectToSheets, getBalance } = require('../../utils/sheetsAPI');
const {toCurrency} = require('../../utils/converters')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Request a withdrawal')
    .addStringOption((option) =>
      option
        .setName('method')
        .setDescription('Payment method')
        .setRequired(true)
        .setChoices(
          { name: 'Cash', value: 'Cash' },
          { name: 'Cash App', value: 'Cash App' },
          { name: 'Venmo', value: 'Venmo' },
          { name: 'Zelle', value: 'Zelle' }
        )
    )
    .addNumberOption((option) =>
      option.setName('amount').setDescription('Amount to withdraw')
    )
    .addBooleanOption((option) =>
      option
        .setName('max')
        .setDescription('Check if you want to withdraw full balance')
    ),
  run: async ({ interaction, client, handler }) => {
    try {
      await interaction.deferReply();
      const sheets = await connectToSheets(auth);
      const balance = parseFloat((await getBalance(
        { sheets, auth, spreadsheetId },
        interaction.user.id
      )).replace('$','').replace(',',''));
      const amount = Math.round(interaction.options.getNumber('amount') * 100) / 100;
      console.log(amount)
      console.log(interaction.options.getNumber('amount'))
      const user = interaction.user.id;
      const method = interaction.options.getString('method');
      const max = interaction.options.getBoolean('max');
      console.log(balance)
      let withdrawalAmount;
      if (max) {
        if(balance<=0) return await interaction.editReply({
            content: `You don't have enough to withdraw.\nBalance: ${balance}`,
          });
        withdrawalAmount = balance;
      } else {
        if(!amount)
            {
                return await interaction.editReply({
                  content: `You must enter an amount or select max`,
                });
              }
        if (amount > balance) {
          return await interaction.editReply({
            content: `Amount requested is greater than account balance.\nBalance: ${balance}`,
          });
        }
        withdrawalAmount = amount
      }

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'Withdrawal Requests!A:D',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[user, withdrawalAmount, method, interaction.id]],
        },
      });

      const newBalance = await getBalance(
        { sheets, auth, spreadsheetId },
        interaction.user.id
      )

      return await interaction.editReply({
        content: `Withdrawal request has been submitted.\n\tAmount: ${toCurrency(withdrawalAmount)}\n\tMethod: ${method}\n\tNew balance: ${newBalance}`,
      });
    } catch (error) {
      console.error(error);
      const sheets = await connectToSheets(auth);
      const newBalance = await getBalance(
        { sheets, auth, spreadsheetId },
        interaction.user.id
      );
      interaction.editReply({
        content: `An error occured with this interaction. Your account balance is ${newBalance}`,
      });
    }
  },
};
