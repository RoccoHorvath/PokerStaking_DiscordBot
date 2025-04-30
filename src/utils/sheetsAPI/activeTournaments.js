let TOURNAMENTS;

function setTournaments(tournaments) {
  TOURNAMENTS = tournaments;
}

function getTournaments() {
  return TOURNAMENTS;
}

module.exports = { setTournaments, getTournaments };
