import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Button } from '@chakra-ui/react'
import './css/Train.css';  // Import the CSS file

// sample will give from backend

const samples = [
  {
    initialFEN: 'q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17',
    moves: ['e8d7', 'a2e6', 'd7d8', 'f7f8']
  },
  {
    initialFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6']
  },
  {
    initialFEN: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    moves: ['f1b5', 'a7a6', 'b5a4', 'g8f6']
  }
];

const ChessGame = () => {
    const [sampleIndex, setSampleIndex] = useState(0);
    const [game, setGame] = useState(new Chess(samples[0].initialFEN));
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [message, setMessage] = useState('');
    const [currentTurn, setCurrentTurn] = useState(game.turn());
    const username = localStorage.getItem('username');
    
    const fetchTrainingData = async () => {
        const response = await fetch(`http://localhost:5000/analyze_and_get_puzzles?username=${username}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
    };

    console.log(fetchTrainingData());

    const handleMove = (move) => {
        const currentMove = samples[sampleIndex].moves[currentMoveIndex];
        if (move === currentMove) {
            if (game.turn() !== currentTurn) {
                setMessage(`It's not your turn! Current turn: ${currentTurn === 'w' ? 'White' : 'Black'}`);
                return;
            }

            game.move(move);
            setCurrentMoveIndex(currentMoveIndex + 1);
            setMessage(`Move ${move} is valid!`);
            setCurrentTurn(game.turn());
        } else {
            setMessage(`Invalid move! You cannot play ${move} at this time.`);
        }

        setGame(new Chess(game.fen()));
    };

    const makeMove = (move) => {
        handleMove(move);
    };

    const resetGame = () => {
        const newGame = new Chess(samples[sampleIndex].initialFEN);
        setGame(newGame);
        setCurrentMoveIndex(0);
        setMessage('');
        setCurrentTurn(newGame.turn());
    };

    const nextSample = () => {
        const newIndex = (sampleIndex + 1) % samples.length;
        setSampleIndex(newIndex);
        const newGame = new Chess(samples[newIndex].initialFEN);
        setGame(newGame);
        setCurrentMoveIndex(0);
        setMessage('');
        setCurrentTurn(newGame.turn());
    };

    const prevSample = () => {
        const newIndex = (sampleIndex - 1 + samples.length) % samples.length;
        setSampleIndex(newIndex);
        const newGame = new Chess(samples[newIndex].initialFEN);
        setGame(newGame);
        setCurrentMoveIndex(0);
        setMessage('');
        setCurrentTurn(newGame.turn());
    };

    return (
        <div className="chess-game-container">
            <h1 className="chess-game-title">Cutomized Puzzles</h1>
            <div className="game-info">
                <p>Current turn: {currentTurn === 'w' ? 'White' : 'Black'}</p>
                <p>Sample: {sampleIndex + 1} / {samples.length}</p>
            </div>
            <div className="chessboard-wrapper">
                <Chessboard
                    position={game.fen()}
                    onPieceDrop={(sourceSquare, targetSquare) => {
                        const move = `${sourceSquare}${targetSquare}`;
                        makeMove(move);
                    }}
                />
            </div>
            <div className="button-group">
                <Button colorScheme='blue' onClick={prevSample}>Previous Sample</Button>
                <Button colorScheme='green' onClick={resetGame}>Reset Game</Button>
                <Button colorScheme='blue' onClick={nextSample}>Next Sample</Button>
            </div>
            <input
                className="move-input"
                type="text"
                placeholder="Enter move"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        makeMove(e.target.value);
                        e.target.value = ''; 
                    }
                }}
            />
            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default ChessGame;
