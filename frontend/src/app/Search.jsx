import { useState, useEffect } from "react";
import { Chess } from 'chess.js';
import { Chessboard } from "react-chessboard";
import axios from 'axios';

const Search = () => {
  const [game, setGame] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');


  const resetGame = () => {
    console.log('Resetting game');
    setGame(new Chess());
    setCurrentMoveIndex(0);
  };

  const handleSearchCall = async () => {
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
        console.error('Invalid move:', move, error);
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {games.map((game, index) => (
            <div key={index} style={{ margin: '20px', maxWidth: '400px' }}>
              <h2>Chess Game {index + 1}</h2>
              <h3>White: {game.white} (ELO: {game.whiteElo})</h3>
              <h3>Black: {game.black} (ELO: {game.blackElo})</h3>
              <div style={{ width: '300px', margin: '0 auto' }}>
                <Chessboard position={game.game.fen()} />
              </div>
              <div>
                <h4>Current Move: {game.currentMoveIndex}</h4>
                <p>
                  {game.currentMoveIndex < game.moves.length &&
                    `Next move: ${game.moves[game.currentMoveIndex]}`}
                </p>
                <button onClick={() => handlePreviousMove(index)} disabled={game.currentMoveIndex === 0}>
                  Previous Move
                </button>
                <button
                  onClick={() => handleNextMove(index)}
                  disabled={game.currentMoveIndex >= game.moves.length}
                >
                  Next Move
                </button>
                {game.currentMoveIndex >= game.moves.length && (
                  <p>Game Over! Result: {game.result}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No games found. Please search for games.</p>
      )}
    </div>
  );
};

export default Search;
