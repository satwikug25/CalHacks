import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chess } from 'chess.js';
import { Chessboard } from "react-chessboard";
import axios from 'axios';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaHandshake, FaTrophy } from "react-icons/fa";
import PropTypes from 'prop-types';

const Search = ({ setOpenedChessGameChat }) => {
  const navigate = useNavigate();
  // const [game, setGame] = useState(new Chess());
  // const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  
  // const resetGame = () => {
  //   console.log('Resetting game');
  //   setGame(new Chess());
  //   setCurrentMoveIndex(0);
  // };

  const handleSearchCall = async () => {
    if (!query) return;
    setLoading(true); // Set loading to true when search starts
    try {
      const response = await axios.post('http://localhost:8081/search', { query });
      const searchResults = response.data;
      console.log('Received search results:', searchResults);
      if (searchResults && searchResults.length > 0) {
        const initializedGames = searchResults.map(game => ({
          ...game,
          game: new Chess(),
          currentMoveIndex: 0
        }));
        setGames(initializedGames);
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      setGames([]);
    }
    setHasSearched(true);
    setLoading(false); // Set loading to false after search completes
  };

  const handleNextMove = (gameIndex) => {
    if (gameIndex >= games.length) return;

    const currentGame = games[gameIndex];
    const moves = Array.isArray(currentGame.moves) ? currentGame.moves : parsePGN(currentGame.moves);

    if (currentGame.currentMoveIndex < moves.length) {
      const newGame = new Chess(currentGame.game.fen());
      try {
        const move = moves[currentGame.currentMoveIndex];
        console.log(`Attempting move for game ${gameIndex}:`, move);
        newGame.move(move);
        const updatedGames = [...games];
        updatedGames[gameIndex] = {
          ...currentGame,
          game: newGame,
          currentMoveIndex: currentGame.currentMoveIndex + 1
        };
        setGames(updatedGames);
      } catch (error) {
        console.error('Invalid move:', error);
      }
    }
  };

  const handlePreviousMove = (gameIndex) => {
    if (gameIndex >= games.length) return;

    const currentGame = games[gameIndex];
    if (currentGame.currentMoveIndex > 0) {
      const moves = Array.isArray(currentGame.moves) ? currentGame.moves : parsePGN(currentGame.moves);

      // Replay moves up to currentMoveIndex - 1
      const newGame = new Chess();
      for (let i = 0; i < currentGame.currentMoveIndex - 1; i++) {
        newGame.move(moves[i]);
      }
      const updatedGames = [...games];
      updatedGames[gameIndex] = {
        ...currentGame,
        game: newGame,
        currentMoveIndex: currentGame.currentMoveIndex - 1
      };
      setGames(updatedGames);
    }
  };

  const parsePGN = (pgn) => {
    const moves = [];
    const regex = /\d+\.\s+(\S+)\s+(\S+)?/g;
    let match;
    while ((match = regex.exec(pgn)) !== null) {
      moves.push(match[1]);
      if (match[2]) moves.push(match[2]);
    }
    return moves;
  };

  // const sampleGames = [
  //   {
  //     white: "Magnus Carlsen",
  //     black: "Fabiano Caruana",
  //     whiteElo: 2861,
  //     blackElo: 2842,
  //     moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 d3 Be7 c3 d6 Nbd2 O-O O-O Nb8",
  //     result: "1-0"
  //   },
  //   {
  //     white: "Garry Kasparov",
  //     black: "Anatoly Karpov",
  //     whiteElo: 2800,
  //     blackElo: 2780,
  //     moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Nf3 Be7 Bg5 O-O",
  //     result: "0-1"
  //   },
  //   {
  //     white: "Bobby Fischer",
  //     black: "Mikhail Tal",
  //     whiteElo: 2720,
  //     blackElo: 2700,
  //     moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Nf3 Be7 Bg5 O-O",
  //     result: "1/2-1/2"
  //   }
  // ];

  // sampleGames.forEach(game => {
  //   game.moves = game.moves.split(' ');
  //   game.game = new Chess();
  //   game.currentMoveIndex = -1;
  // });

  const getGameOverContent = (game) => {
    if (game.result === 'Draw') {
      return { icon: <FaHandshake size="1.25rem" />, text: 'Draw' };
    } else {
      return { icon: <FaTrophy size="1.25rem" />, text: game.result === "0-1" ? "Black wins" : "White wins" };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-14 py-16">
      <button onClick={() => navigate('/choose')} className="text-neutral-500 hover:text-neutral-600 rounded-md absolute top-10 left-10 flex flex-row gap-2 border-none justify-center items-center"><FaArrowLeft /> Go Back</button>
      <div className="flex flex-col gap-8">
        <h1 className="text-5xl font-bold text-white"><span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">Search</span> for Chess Games</h1>
        <div className="w-full flex flex-row items-center justify-center gap-2">
          <input
          type="text"
          placeholder="Search for games (e.g., '5 results for Sicilian Defense')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-[500px] rounded-md px-4 py-3 bg-neutral-800"
        />
        <button onClick={handleSearchCall} className="bg-gradient-to-br from-lime-600 to-teal-600 text-white rounded-md px-4 py-2">Search</button>
        </div>
      </div>

      {loading ? ( // Show shimmer boxes while loading
        <div className="flex flex-wrap justify-center gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-neutral-800 p-4 rounded-lg animate-pulse w-[300px] h-[400px]" />
          ))}
        </div>
      ) : games.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-6">
          {games.map((game, index) => (
            <div key={index} >
              <div className="flex flex-col gap-2 bg-neutral-800 p-4 rounded-t-lg">
                <h3 className="text-white">{game.black} ({game.blackElo})</h3>
              </div>
              <div className="relative w-[300px]">
                <Chessboard position={game.game.fen()} />
                {game.currentMoveIndex >= game.moves.length && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="text-white text-2xl w-3/4 font-bold flex justify-center gap-3 items-center">
                      {getGameOverContent(game).icon}
                      {getGameOverContent(game).text}
                    </div>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full h-full" style={{ cursor: 'pointer' }} onClick={() => { 
                  setOpenedChessGameChat({...game, result: game.result == "0-1" ? "Black wins" : game.result == "1-0" ? "White wins" : "Draw"}); 
                  navigate('/analyze');
                }} />
              </div>
              <div className="flex flex-col gap-6 bg-neutral-800 p-4 rounded-b-lg">
                <h3 className="text-white">{game.white} ({game.whiteElo})</h3>
                <div className="flex flex-row gap-4 justify-center items-center">
                  <div className="flex flex-row gap-4 justify-center items-center">
                      <button onClick={() => handlePreviousMove(index)} className="bg-neutral-700 w-8 h-8 rounded-md flex items-center justify-center cursor-pointer">
                          <FaChevronLeft size="1rem" />
                      </button>
                      { game.currentMoveIndex >= 0 && game.moves[game.currentMoveIndex] }
                      <button onClick={() => handleNextMove(index)} className="bg-neutral-700 w-8 h-8 rounded-md flex items-center justify-center cursor-pointer">
                          <FaChevronRight size="1rem" />
                      </button>
                  </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched && (
        <p>No games found matching your query.</p>
      )}
    </div>
  );
};

Search.propTypes = {
  setOpenedChessGameChat: PropTypes.func
};

export default Search;
