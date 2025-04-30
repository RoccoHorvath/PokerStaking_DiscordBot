const { getTournaments } = require('../sheetsAPI/activeTournaments');

async function tournamentAC(interaction) {
  const tournamentRows = getTournaments();
  console.log(tournamentRows);
  try {
    const focusedTournamentOption = interaction.options
      .getString('tournament')
      .toLowerCase();

    const filteredChoices = tournamentRows.filter((tournament) =>
      tournament[0].toLowerCase().includes(focusedTournamentOption)
    );
    const results = filteredChoices.map((tournament) => {
      return {
        name:
          tournament[0] == '#N/A' ? 'No tournaments available' : tournament[1],
        value: tournament[0],
      };
    });
    return results.slice(0, 25);
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = tournamentAC;
