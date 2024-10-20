import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUpload, FaChessBoard } from 'react-icons/fa';

function UploadSearch() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isFileUpload, setIsFileUpload] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [gameData, setGameData] = useState({
    white: '',
    black: '',
    whiteElo: '',
    blackElo: '',
    result: '',
    moves: []
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'moves') {
      const cleanedMoves = value
        .replace(/\d+\./g, '')
        .replace(/\n/g, ' ')
        .split(/\s+/)
        .filter(move => move.trim() !== '');
      setGameData(prevData => ({
        ...prevData,
        'moves': cleanedMoves
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
    if (!validateGameData(gameData)) {
      alert('Please fill in all required fields before submitting.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:8081/upload', gameData);
      if (response.status === 200) {
        alert('Game data uploaded and analyzed successfully!');
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

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload({ target: { files: [files[0]] } });
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-8">
      <button onClick={() => navigate('/choose')} className={`text-neutral-500 hover:text-neutral-600 rounded-md absolute top-10 left-10 flex flex-row gap-2 border-none justify-center items-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '300ms' }}>
        <FaArrowLeft /> Go Back
      </button>
      
      <h1 className={`text-5xl font-bold mb-8 transition-transform duration-700 ${isLoaded ? 'translate-y-0' : 'translate-y-10'}`}>
        <span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">Upload</span> Chess Games
      </h1>

      <div className={`w-full max-w-2xl flex flex-col items-center justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
        <button 
          onClick={toggleUploadMode} 
          className="mb-6 bg-gradient-to-br from-lime-600 to-teal-600 text-white px-4 py-2 rounded-md hover:from-lime-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isFileUpload ? <FaChessBoard /> : <FaUpload />}
          {isFileUpload ? 'Switch to Custom Game' : 'Switch to File Upload'}
        </button>

        {isFileUpload ? (
          <div 
            className={`w-full bg-neutral-800 p-8 rounded-lg border-2 border-dashed ${
              isDragging ? 'border-blue-500' : 'border-neutral-600'
            } transition-all duration-200`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <FaUpload className="mx-auto text-4xl mb-4 text-neutral-400" />
              <p className="text-lg mb-2">Drag and drop your PGN file here</p>
              <p className="text-sm text-neutral-400 mb-4">or</p>
              <label className="bg-lime-600 text-white px-4 py-2 rounded-md hover:bg-lime-700 transition-all duration-200 cursor-pointer">
                Choose File
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  accept=".txt,.pgn"
                  className="hidden"
                />
              </label>
            </div>
            {games.length > 0 && (
              <p className="text-lg mt-4">Processed games: {currentGameIndex} / {games.length}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-neutral-800 p-6 rounded-lg w-full">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input name="white" value={gameData.white} onChange={handleInputChange} placeholder="White Player" required className="p-2 bg-neutral-700 rounded-md" />
              <input name="black" value={gameData.black} onChange={handleInputChange} placeholder="Black Player" required className="p-2 bg-neutral-700 rounded-md" />
              <input name="whiteElo" value={gameData.whiteElo} onChange={handleInputChange} placeholder="White Elo" required className="p-2 bg-neutral-700 rounded-md" />
              <input name="blackElo" value={gameData.blackElo} onChange={handleInputChange} placeholder="Black Elo" required className="p-2 bg-neutral-700 rounded-md" />
              <input name="result" value={gameData.result} onChange={handleInputChange} placeholder="Result" required className="p-2 bg-neutral-700 rounded-md" />
            </div>
            <textarea 
              name="moves" 
              value={gameData.moves.join(' ')} 
              onChange={handleInputChange} 
              placeholder="Moves" 
              required 
              className="w-full p-2 bg-neutral-700 rounded-md mb-4 h-32"
            />
            <button type="submit" className="bg-lime-600 w-full text-white px-4 py-2 rounded-md hover:bg-lime-700 transition-all duration-200">
              Submit Custom Game
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default UploadSearch;
