function convertFromPercent(str) {
  try {
    const num = parseInt(parseFloat(str.replace('%', '')) * 100);
    console.log(`convertFromPercent converted ${str} to ${num}`);
    return num;
  } catch (error) {
    console.error(`Error converting ${str} to number\n${error}`);
    return null;
  }
}

module.exports = convertFromPercent;
