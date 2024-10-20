import ChessGame from "./components/ChessGame";
import ChessGameChat from "./components/ChessGameChat";
import { useState, useEffect } from "react";

const Analyze = () => {
  const [openedChessGameChat, setOpenedChessGameChat] = useState(null);
  const [games, setGames] = useState([]);

//   const games = [
//     { white: "MRSATWIK", black: "knightacer", whiteElo: "1486", blackElo: "1446", result: "0-1", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "h6", "Nc3", "d6", "h3", "Nf6", "d3", "Be7", "O-O", "O-O", "Be3", "a6", "Qe2", "b5", "Bb3", "Bb7", "Nd5", "Na5", "Nxe7+", "Qxe7", "c3", "c5", "Bc2", "Rfe8", "b4", "cxb4", "cxb4", "Nc6", "a3", "Bc8", "Bb3", "g5", "Rac1", "Qb7", "Qa2", "Rf8", "Bd5", "Nxd5", "Qxd5", "Ne7", "Qxd6", "Ng6", "Rc7", "Qb8", "Bc5", "Ra7", "Rxa7", "Qxd6", "Bxd6", "Rd8", "Bxe5", "Rxd3", "Rc1", "Bxh3", "gxh3", "Rxf3", "Rc8+", "Kh7", "Kg2", "Nxe5", "Rxa6", "Rf4", "Rc7", "Rxe4", "Re6", "Kg7", "Rce7", "Rg4+", "Kh2", "Nf3+", "Kh1", "Rg1#"] },
//   ];

  useEffect(() => {
    fetch(`http://localhost:5000/get_games/${localStorage.getItem('username')}`)
      .then(response => response.json())
      .then(data => {
        setGames(data.filter(game => game).map(game => JSON.parse(game)).map(game => ({white: game.players.white.user.name, black: game.players.black.user.name, whiteElo: game.players.white.rating, blackElo: game.players.black.rating, winner: game.winner ? game.winner[0].toUpperCase() + game.winner.slice(1) : null, status: game.status, moves: game.moves.split(' ')})));
      });
  }, [])

  return (
    <>
      {openedChessGameChat && <ChessGameChat pgn={openedChessGameChat} setOpenedChessGameChat={setOpenedChessGameChat} />}
      {!openedChessGameChat && (
        <div className="flex flex-col items-center justify-center gap-16">
          <h1 className="text-5xl font-bold text-white">
            Select a game to analyze
          </h1>
          <div className="flex flex-wrap gap-6 items-center justify-center">
            {games.map((game, index) => (
              <ChessGame
                key={index}
                pgn={game}
                setOpenedChessGameChat={setOpenedChessGameChat}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Analyze;
