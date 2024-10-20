import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { FaChevronLeft, FaChevronRight, FaTrophy, FaHandshake } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
import { HiMiniArrowsUpDown } from "react-icons/hi2";

const getColorFromEvaluation = (evaluation) => {
  if (typeof evaluation !== 'number') return 'rgba(0,0,0,0.1)';
  
  const maxOpacity = 0.7;
  const minOpacity = 0.1;
  const maxEval = 1; // Adjust this value based on what you consider a significant advantage

  const opacity = Math.min(Math.abs(evaluation) / maxEval, 1) * (maxOpacity - minOpacity) + minOpacity;
  
  if (evaluation > 0) {
    return `rgba(0, 255, 0, ${opacity})`; // Green for positive evaluations
  } else {
    return `rgba(255, 0, 0, ${opacity})`; // Red for negative evaluations
  }
};

const ChessGameChat = ({ pgn, setOpenedChessGameChat }) => {
  const [game, setGame] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const movesContainerRef = useRef(null);
  const [question, setQuestion] = useState('');
  const [respondedQuestion, setRespondedQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [gameResult, setGameResult] = useState('');
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [possibleMoves, setPossibleMoves] = useState({});

  useEffect(() => {
    if (pgn && pgn.moves) {
      const newGame = new Chess();
      setGame(newGame);
      setCurrentMoveIndex(-1);
      setGameResult(pgn.winner ? pgn.winner + " wins because of " + pgn.status : 'Draw');
    }
  }, [pgn]);

  const goToMove = (index) => {
    const newGame = new Chess();
    for (let i = 0; i <= index; i++) {
      newGame.move(pgn.moves[i]);
    }
    setGame(newGame);
    setCurrentMoveIndex(index);
    highlightMove(index);  // Add this line
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex >= 0) {
      goToMove(currentMoveIndex - 1);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex < pgn.moves.length - 1) {
      goToMove(currentMoveIndex + 1);
    }
  };

  const flipBoard = () => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  const handleMoveClick = (index) => {
    goToMove(index);
  };

  const handleAskQuestion = async () => {
    try {
      const apiResponse = await axios.post('http://localhost:5000/ask_question', {
        question: question,
        pgn: pgn,
        currentMove: currentMoveIndex >= 0 ? `${pgn.moves[currentMoveIndex]} (move ${currentMoveIndex + 1})` : "start"
      });
      setResponse(apiResponse.data);
      setRespondedQuestion(question + " (at " + (currentMoveIndex >= 0 ? "move " + parseInt((currentMoveIndex/2 + 1)) : "start") + ")");
    } catch (error) {
      console.error("Error asking question:", error);
      setResponse("An error occurred while processing your question.");
    }
  };

  useEffect(() => {
    if (movesContainerRef.current) {
      const moveElements = movesContainerRef.current.querySelectorAll('td');
      const currentMoveElement = moveElements[currentMoveIndex + Math.floor(currentMoveIndex / 2) + 1];
      if (currentMoveElement) {
        currentMoveElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      }
    }
  }, [currentMoveIndex]);

  const isGameOver = currentMoveIndex === pgn.moves.length - 1;

  const getGameOverContent = () => {
    if (gameResult === 'Draw') {
      return { icon: <FaHandshake />, text: 'Draw' };
    } else {
      return { icon: <FaTrophy />, text: gameResult };
    }
  };

  const highlightMove = (index) => {
    if (index >= 0 && index < pgn.moves.length) {
      const newGame = new Chess();
      for (let i = 0; i <= index; i++) {
        newGame.move(pgn.moves[i]);
      }
      const move = newGame.history({ verbose: true })[index];

      if (move) {
        const newHighlightedSquares = {
          [move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          [move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
        };
        setHighlightedSquares(newHighlightedSquares);
        setPossibleMoves({}); // Clear possible moves when highlighting a move
      } else {
        setHighlightedSquares({});
        setPossibleMoves({});
      }
    } else {
      setHighlightedSquares({});
      setPossibleMoves({});
    }
  };

  const onSquareClick = async (square) => {
    const moves = game.moves({ square: square, verbose: true });
    console.log('Possible moves:', moves);

    if (moves.length == 0) {
      setPossibleMoves({});
      return;
    }

    try {
        let results = JSON.parse(localStorage.getItem(`${game.fen()}-${square}`));

        if (!results) {
            const response = await axios.post('http://localhost:5000/get_evaluation', {
                fen: game.fen(),
                square: square,
                moves: moves
            });
      
            results = response.data;
            localStorage.setItem(`${game.fen()}-${square}`, JSON.stringify(results));
        }

        console.log(results);

        const newPossibleMoves = moves.reduce((acc, move, index) => {
                const evaluation = results[index].eval;
                acc[move.to] = {
                backgroundColor: getColorFromEvaluation(evaluation),
                evaluation: evaluation,
                reason: results[index].reason
            };
            return acc;
        }, {});

      console.log('Possible moves with evaluations:', newPossibleMoves);

      setPossibleMoves(newPossibleMoves);
      setHighlightedSquares({
        ...newPossibleMoves,
        [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
      });
    } catch (error) {
      console.error('Error fetching evaluation:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-16">
      <button onClick={() => setOpenedChessGameChat(null)} className="text-neutral-500 hover:text-neutral-600 rounded-md absolute top-10 left-10 flex flex-row gap-2 border-none justify-center items-center"><FaArrowLeft /> Go Back</button>
      <div className="flex flex-col gap-4">
        <div className={`${boardOrientation === 'black' ? 'bottom-0' : 'top-0'} left-0 bg-opacity-50 w-fit text-white`}>
        {boardOrientation === 'black' ? `${pgn.white} (${pgn.whiteElo})` : `${pgn.black} (${pgn.blackElo})`}
        </div>
      <div className="flex h-[540px]">
        <div className="bg-white aspect-square relative">
          <Chessboard 
            position={game.fen()} 
            boardOrientation={boardOrientation} 
            onSquareClick={onSquareClick}
            customSquareStyles={{
              ...highlightedSquares,
              ...possibleMoves
            }}
          />
          <div className="absolute top-0 left-0 w-full h-full grid grid-cols-8 grid-rows-8 pointer-events-none">
            {Object.entries(possibleMoves).map(([square, data]) => (
              <div 
                key={square} 
                className="relative"
                style={{
                  gridArea: `${9 - parseInt(square[1])} / ${square.charCodeAt(0) - 96} / span 1 / span 1`,
                }}
              >
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer group"
                >
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none bg-black text-white p-2 w-96 rounded absolute bottom-full left-1/2 transform -translate-x-1/2 transition-opacity duration-200 z-10">
                    {data.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {isGameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-white text-4xl w-3/4 font-bold flex justify-center gap-3">
                {getGameOverContent().icon}
                {getGameOverContent().text}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-neutral-800 p-4 gap-6 flex flex-col-reverse w-80 h-full">
          <div className="flex items-center gap-2 text-sm">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} type="text" placeholder="Ask a question" className="w-full px-4 py-3 text-md outline-none text-white bg-neutral-700 rounded-md" />
            <button onClick={handleAskQuestion} className="bg-blue-500 text-white px-4 py-2 rounded-md h-full hover:bg-blue-600 transition-all duration-200">Send</button>
          </div>
          <div className="text-white text-sm text-left overflow-y-auto flex flex-col gap-2">
            { respondedQuestion && <h2 className="font-bold text-lg">{respondedQuestion}</h2> }
            { response }
          </div>

          <div className="mb-auto bg-neutral-700 flex flex-col gap-2 p-2 rounded-lg h-[120px] overflow-y-auto" ref={movesContainerRef}>            
          <table className="w-full text-white text-sm">
            <tbody>
              {Array.from({ length: Math.ceil(pgn.moves.length / 2) }, (_, i) => (
                <tr key={i}>
                  <td className="w-8 text-neutral-400">{i + 1}.</td>
                  <td 
                    className={`px-2 py-1 cursor-pointer ${
                      i * 2 === currentMoveIndex ? 'bg-green-500 text-white' : 
                      i * 2 === pgn.moves.length - 1 ? 'bg-yellow-500 text-black' : 
                      'hover:text-green-500'
                    }`}
                    onClick={() => handleMoveClick(i * 2)}
                  >
                    {pgn.moves[i * 2]}
                  </td>
                  <td 
                    className={`px-2 py-1 cursor-pointer ${
                      i * 2 + 1 === currentMoveIndex ? 'bg-green-500 text-white' : 
                      i * 2 + 1 === pgn.moves.length - 1 ? 'bg-yellow-500 text-black' : 
                      'hover:text-green-500'
                    }`}
                    onClick={() => handleMoveClick(i * 2 + 1)}
                  >
                    {pgn.moves[i * 2 + 1] || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          <div className="flex flex-row gap-4 bg-neutral-700 p-2 rounded-lg">
            <div className="flex flex-row gap-2">
                <div onClick={goToPreviousMove} className="bg-neutral-800 w-8 h-8 rounded-md flex items-center justify-center cursor-pointer">
                    <FaChevronLeft size="1rem" />
                </div>
                <div onClick={goToNextMove} className="bg-neutral-800 w-8 h-8 rounded-md flex items-center justify-center cursor-pointer">
                    <FaChevronRight size="1rem" />
                </div>
            </div>
            
            <div onClick={flipBoard} className="bg-neutral-800 w-8 h-8 rounded-md flex items-center justify-center cursor-pointer">
              <HiMiniArrowsUpDown size="1rem" />
            </div>
          </div>                     
        </div>
      </div> 
        <div className={`${boardOrientation === 'black' ? 'top-0' : 'bottom-0'} right-0 bg-opacity-50 w-fit text-white`}>
            {boardOrientation === 'black' ? `${pgn.black} (${pgn.blackElo})` : `${pgn.white} (${pgn.whiteElo})`}
        </div>
      </div>       
    </div>
  )
}

ChessGameChat.propTypes = {
  pgn: PropTypes.shape({
    white: PropTypes.string,
    black: PropTypes.string,
    whiteElo: PropTypes.number,
    blackElo: PropTypes.number,
    winner: PropTypes.string,
    status: PropTypes.string,
    moves: PropTypes.arrayOf(PropTypes.string)
  }),
  setOpenedChessGameChat: PropTypes.func
}

export default ChessGameChat
