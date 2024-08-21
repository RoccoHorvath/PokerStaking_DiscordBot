async function endInteraction(interaction,str){
    await interaction.editReply({
        content: str});
      return false;
}

module.exports = endInteraction