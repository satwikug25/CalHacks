import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UploadSearch() {
  const [games, setGames] = useState([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isFileUpload, setIsFileUpload] = useState(true);
  const [gameData, setGameData] = useState({
    white: '',
    black: '',
    whiteElo: '',
    blackElo: '',
    result: '',
    moves: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    if (name === 'moves') {
      const cleanedMoves = value
        .replace(/\d+\./g, '')  // Remove move numbers
        .replace(/\n/g, ' ')    // Replace newlines with spaces
        .split(/\s+/)           // Split by whitespace
        .filter(move => move.trim() !== '');  // Remove empty strings
      console.log("lof", cleanedMoves);
      setGameData(prevData => ({
        ...prevData,
        'moves': cleanedMoves
      }));
    } 
    else {
      setGameData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateGameData(gameData)) {
      alert('Please fill in all required fields before submitting.');
      return;
    }
    console.log(gameData);
    try {
      const response = await axios.post('http://localhost:8081/upload', gameData);
      if (response.status === 200) {
        alert('Game data uploaded and analyzed successfully!');
        // Clear form after successful submission
        setGameData({
          white: '',
          black: '',
          whiteElo: '',
          blackElo: '',
          result: '',
          moves: []
        });
      }
    } catch (error) {
      console.error('Error uploading game data:', error);
      alert('Failed to upload and analyze game data.');
    }
  };

  const validateGameData = (data) => {
    return data.white.trim() !== '' &&
           data.black.trim() !== '' &&
           data.whiteElo.trim() !== '' &&
           data.blackElo.trim() !== '' &&
           data.result.trim() !== '' &&
           data.moves.length > 0;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const parsedGames = parseGames(content);
        setGames(parsedGames);
        setCurrentGameIndex(0);
      };
      reader.readAsText(file);
    }
  };

  const parseGames = (content) => {
    const gamesArray = content.split(/\n\s*\[Event /);
    return gamesArray.map((game, index) => {
      if (index !== 0) game = '[Event ' + game;
      const lines = game.split('\n');
      const parsedGame = {
        white: "",
        black: "",
        whiteElo: "",
        blackElo: "",
        result: "",
        moves: []
      };

      let movesStarted = false;

      lines.forEach(line => {
        if (line.startsWith('[White ')) {
          parsedGame.white = line.match(/"([^"]*)"/)[1];
        } else if (line.startsWith('[Black ')) {
          parsedGame.black = line.match(/"([^"]*)"/)[1];
        } else if (line.startsWith('[WhiteElo ')) {
          parsedGame.whiteElo = line.match(/"([^"]*)"/)[1];
        } else if (line.startsWith('[BlackElo ')) {
          parsedGame.blackElo = line.match(/"([^"]*)"/)[1];
        } else if (line.startsWith('[Result ')) {
          parsedGame.result = line.match(/"([^"]*)"/)[1];
        } else if (line.match(/^\d+\./) || movesStarted) {
          movesStarted = true;
          const cleanedMoves = line
            .replace(/\d+\./g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .filter(move => move !== '' && !move.includes('-'));
          parsedGame.moves = parsedGame.moves.concat(cleanedMoves);
        }
      });

      return parsedGame;
    }).filter(game => game.moves.length > 0);
  };

  const uploadGame = async (game) => {
    try {
      const response = await axios.post('http://localhost:8081/upload', game);
      if (response.status === 200) {
        console.log('Game data uploaded and analyzed successfully!');
      }
    } catch (error) {
      console.error('Error uploading game data:', error);
    }
  };

  useEffect(() => {
    if (games.length > 0 && currentGameIndex < games.length) {
      uploadGame(games[currentGameIndex]);
      setCurrentGameIndex(prevIndex => prevIndex + 1);
    }
  }, [games, currentGameIndex]);

  const toggleUploadMode = () => {
    setIsFileUpload(!isFileUpload);
  };

  return (
    <div>
      <button onClick={toggleUploadMode}>
        {isFileUpload ? 'Switch to Custom Game' : 'Switch to File Upload'}
      </button>
      {isFileUpload ? (
        <>
          <input type="file" onChange={handleFileUpload} accept=".txt,.pgn" />
          <p>Processed games: {currentGameIndex} / {games.length}</p>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <input name="white" value={gameData.white} onChange={handleInputChange} placeholder="White Player" required />
          <input name="black" value={gameData.black} onChange={handleInputChange} placeholder="Black Player" required />
          <input name="whiteElo" value={gameData.whiteElo} onChange={handleInputChange} placeholder="White Elo" required />
          <input name="blackElo" value={gameData.blackElo} onChange={handleInputChange} placeholder="Black Elo" required />
          <input name="result" value={gameData.result} onChange={handleInputChange} placeholder="Result" required />
          <textarea name="moves" value={gameData.moves.join(' ')} onChange={handleInputChange} placeholder="Moves" required />
          <button type="submit">Submit Custom Game</button>
        </form>
      )}
    </div>
  );
}

export default UploadSearch;
