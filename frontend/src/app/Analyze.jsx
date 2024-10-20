import ChessGame from "./components/ChessGame";
import ChessGameChat from "./components/ChessGameChat";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const Analyze = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
    });
  }, [])

  return (
    <>
      {openedChessGameChat && <ChessGameChat pgn={openedChessGameChat} setOpenedChessGameChat={setOpenedChessGameChat} />}
      {!openedChessGameChat && (
        <div className="flex flex-col items-center justify-center gap-16">
          <button onClick={() => navigate('/choose')} className="text-neutral-500 hover:text-neutral-600 rounded-md absolute top-10 left-10 flex flex-row gap-2 border-none justify-center items-center"><FaArrowLeft /> Go Back</button>
          <h1 className="text-5xl font-bold text-white">
            Select a game to <span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">analyze</span>
          </h1>
          <div role="status" style={{display: isLoading ? 'flex' : 'none'}} className={`animate-pulse md:space-y-0 md:space-x-6 rtl:space-x-reverse md:flex md:items-center`}>
              <div className="flex flex-col gap-4 w-60 p-4 h-60 rounded bg-neutral-800">
              </div>
              <div className="flex flex-col gap-4 w-60 p-4 h-60 rounded bg-neutral-800">
              </div>
              <div className="flex flex-col gap-4 w-60 p-4 h-60 rounded bg-neutral-800">
              </div>
          </div>
          <div style={{display: isLoading ? 'none' : 'flex'}} className="flex flex-wrap gap-6 items-center justify-center">
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
