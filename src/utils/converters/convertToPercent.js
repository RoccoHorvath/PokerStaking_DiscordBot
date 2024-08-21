function convertToPercent(num) {
    try {
      const str = `${(num/100).toFixed(2)}%`;
      console.log(`convertToPercent converted ${num} to ${str}`);
      return str;
    } catch (error) {
      console.error(`Error converting ${num} to number\n${error}`);
      return null;
    }
  }
  
  module.exports = convertToPercent;