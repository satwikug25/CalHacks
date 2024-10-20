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
    const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/get_games/${localStorage.getItem('username')}`)
      .then(response => response.json())
      .then(data => {
        setGames(data.filter(game => game).map(game => JSON.parse(game)).map(game => ({white: game.players.white.user.name, black: game.players.black.user.name, whiteElo: game.players.white.rating, blackElo: game.players.black.rating, result: game.winner ? game.winner[0].toUpperCase() + game.winner.slice(1) : null, status: game.status, moves: game.moves.split(' ')})));
        setIsLoading(false);
    });
    
    setTimeout(() => setIsLoaded(true), 100);
  }, [])

  return (
    <>
      {openedChessGameChat && <ChessGameChat pgn={openedChessGameChat} setOpenedChessGameChat={setOpenedChessGameChat} />}
      {!openedChessGameChat && (
        <div className="flex flex-col items-center justify-center gap-16 min-h-screen py-16">
          <button onClick={() => navigate('/choose')} className={`text-neutral-500 hover:text-neutral-600 rounded-md absolute top-10 left-10 flex flex-row gap-2 border-none justify-center items-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '300ms' }}>
            <FaArrowLeft /> Go Back
          </button>
          <h1 className={`text-5xl font-bold text-white transition-transform duration-700 ${isLoaded ? 'translate-y-0' : 'translate-y-10'}`}>
            Select a game to <span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">analyze</span>
          </h1>
          {isLoading ? (
            <div className={`flex flex-wrap gap-6 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
              {[...Array(3)].map((_, index) => (
                <div key={index} className={`animate-pulse flex flex-col gap-4 w-60 p-4 h-60 rounded bg-neutral-800 transition-all duration-500`} style={{ transitionDelay: `${200 + index * 100}ms` }}></div>
              ))}
            </div>
          ) : (
            <div className={`flex flex-wrap gap-6 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
              {games.map((game, index) => (
                <ChessGame
                  key={index}
                  pgn={game}
                  setOpenedChessGameChat={setOpenedChessGameChat}
                />
              ))}
            </div>
          )}
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
