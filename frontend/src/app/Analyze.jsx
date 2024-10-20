import ChessGame from "./components/ChessGame";
import ChessGameChat from "./components/ChessGameChat";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import PropTypes from 'prop-types';

const Analyze = ({ openedChessGameChat, setOpenedChessGameChat }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [games, setGames] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/get_games/${localStorage.getItem('username')}`)
      .then(response => response.json())
      .then(data => {
        setGames(data.filter(game => game).map(game => JSON.parse(game)).map(game => ({white: game.players.white.user.name, black: game.players.black.user.name, whiteElo: game.players.white.rating, blackElo: game.players.black.rating, result: game.winner ? game.winner[0].toUpperCase() + game.winner.slice(1) : null, status: game.status, moves: game.moves.split(' ')})));
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
          {isLoading ?
          <div role="status" className={`animate-pulse md:space-y-0 md:space-x-6 rtl:space-x-reverse md:flex md:items-center`}>
              <div className="flex flex-col gap-4 w-60 p-4 h-60 rounded bg-neutral-800">
              </div>
              <div className="flex flex-col gap-4 w-60 p-4 h-60 rounded bg-neutral-800">
              </div>
              <div className="flex flex-col gap-4 w-60 p-4 h-60 rounded bg-neutral-800">
              </div>
          </div>
          :
          <div className="flex flex-wrap gap-6 items-center justify-center">
            {games.map((game, index) => (
              <ChessGame
                key={index}
                pgn={game}
                setOpenedChessGameChat={setOpenedChessGameChat}
              />
            ))}
          </div> }
        </div>
      )}
    </>
  );
};

Analyze.propTypes = {
  openedChessGameChat: PropTypes.object,
  setOpenedChessGameChat: PropTypes.func
};

export default Analyze;
