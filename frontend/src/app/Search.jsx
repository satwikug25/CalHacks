import { useState, useEffect } from "react";
import { Chess } from 'chess.js';
import { Chessboard } from "react-chessboard";
import axios from 'axios';

const Search = () => {
  const [game, setGame] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [games, setGames] = useState([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (games.length > 0) {
      resetGame();
    }
  }, [currentGameIndex, games]);

  const resetGame = () => {
    setGame(new Chess());
    setCurrentMoveIndex(0);
  };

  const handleSearchCall = async () => {
    try {
      const response = await axios.post('http://localhost:8081/search', { query });
      const searchResults = response.data;
      if (searchResults && searchResults.length > 0) {
        setGames(searchResults);
        setCurrentGameIndex(0);
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      setGames([]);
    }
  };

  const handleNextMove = () => {
    const currentGame = games[currentGameIndex];
    const moves = Array.isArray(currentGame.moves) ? currentGame.moves : parsePGN(currentGame.moves);
    
    if (currentMoveIndex < moves.length) {
      const newGame = new Chess(game.fen());
      try {
        newGame.move(moves[currentMoveIndex]);
        setGame(newGame);
        setCurrentMoveIndex(currentMoveIndex + 1);
      } catch (error) {
        console.error('Invalid move:', moves[currentMoveIndex]);
      }
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

  const handleNextGame = () => {
    setCurrentGameIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % games.length;
      resetGame();
      return newIndex;
    });
  };

  const handlePreviousGame = () => {
    setCurrentGameIndex((prevIndex) => {
      const newIndex = (prevIndex - 1 + games.length) % games.length;
      resetGame();
      return newIndex;
    });
  };

  const currentGame = games[currentGameIndex];

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Search for games"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearchCall}>Search</button>
      </div>
      
      {games.length > 0 ? (
        <div>
          <h1>Chess Game ({currentGameIndex + 1} of {games.length})</h1>
          <div>
            <h2>White: {currentGame.white} (ELO: {currentGame.whiteElo})</h2>
            <h2>Black: {currentGame.black} (ELO: {currentGame.blackElo})</h2>
          </div>
          <div style={{ width: '400px', margin: '0 auto' }}>
            <Chessboard position={game.fen()} />
          </div>
          <div>
            <h3>Current Move: {currentMoveIndex + 1}</h3>
            <p>{Array.isArray(currentGame.moves) ? currentGame.moves[currentMoveIndex] : 'Move'}</p>
            {currentMoveIndex < (Array.isArray(currentGame.moves) ? currentGame.moves.length : parsePGN(currentGame.moves).length) ? (
              <button onClick={handleNextMove}>Next Move</button>
            ) : (
              <p>Game Over! Result: {currentGame.result}</p>
            )}
            <button onClick={handlePreviousGame}>Previous Game</button>
            <button onClick={handleNextGame}>Next Game</button>
          </div>
        </div>
      ) : (
        <p>No games found. Please search for games.</p>
      )}
    </div>
  );
};

export default Search;
