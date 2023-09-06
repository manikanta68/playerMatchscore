const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1
app.get("/players/", async (request, response) => {
  const playersQuery = `SELECT * FROM player_details; `;
  const playerArray = await db.all(playersQuery);
  const ans = (playerList) => {
    return {
      playerId: playerList.player_id,
      playerName: playerList.player_name,
    };
  };
  response.send(playerArray.map((eachPlayer) => ans(eachPlayer)));
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayer = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId};`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchIdQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const match = await db.get(matchIdQuery);
  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  });
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId};`;
  const playersArray = await db.all(playerQuery);
  const ans = (eachObj) => {
    return {
      matchId: eachObj.match_id,
      match: eachObj.match,
      year: eachObj.year,
    };
  };
  response.send(playersArray.map((eachObj) => ans(eachObj)));
});

//API 6
app.get("matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;

  const playersArray = await db.get(getMatchPlayersQuery);
  response.send(playersArray);
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerDetails = await db.get(getPlayerScored);
  response.send(playerDetails);
});

module.exports = app;
