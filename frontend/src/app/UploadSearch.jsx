import React, { useState } from 'react';
import axios from 'axios';

function UploadSearch() {
  const [gameData, setGameData] = useState({
    white: "",
    black: "",
    whiteElo: "",
    blackElo: "",
    result: "",
    moves: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'moves') {
      setGameData(prevData => ({
        ...prevData,
        [name]: value.split(',').map(move => move.trim())
      }));
    } else {
      setGameData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8081/upload', gameData);
      if (response.status === 200) {
        alert('Game data uploaded and analyzed successfully!');
      }
    } catch (error) {
      console.error('Error uploading game data:', error);
      alert('Failed to upload and analyze game data.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(gameData).map((key) => (
        <div key={key}>
          <label htmlFor={key}>{key}:</label>
          {key === 'moves' ? (
            <textarea
              id={key}
              name={key}
              value={gameData[key].join(', ')}
              onChange={handleInputChange}
              required
            />
          ) : (
            <input
              type="text"
              id={key}
              name={key}
              value={gameData[key]}
              onChange={handleInputChange}
              required
            />
          )}
        </div>
      ))}
      <button type="submit">Upload Game Data</button>
    </form>
  );
}

export default UploadSearch;
