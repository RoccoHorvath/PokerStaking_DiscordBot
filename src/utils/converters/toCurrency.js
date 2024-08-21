function toCurrency(number) {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    const formattedNumber = formatter.format(number);
    console.log(`Converted ${number} to ${formattedNumber}`);
    return formattedNumber;
  } catch (error) {
    console.error(`Error converting ${number} to currency\n${error}`);
  }
}

module.exports = toCurrency;
