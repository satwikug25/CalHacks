import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './css/Train.css';

const ChessGame = () => {
    const [puzzles, setPuzzles] = useState([]);
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [message, setMessage] = useState('');
    const [moveHistory, setMoveHistory] = useState([]);
    const [userColor, setUserColor] = useState('w');
    const username = localStorage.getItem('username');

    const fetchTrainingData = async () => {
        try {
            const response = await fetch(`http://localhost:5000/analyze_and_get_puzzles?username=${username}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.puzzles;
        } catch (error) {
            console.error('Error fetching training data:', error);
            return [];
        }
    };

    useEffect(() => {
        const loadPuzzles = async () => {
            const fetchedPuzzles = await fetchTrainingData();
            setPuzzles(fetchedPuzzles);
            if (fetchedPuzzles.length > 0) {
                initializeGame(fetchedPuzzles[0]);
            }
        };
        loadPuzzles();
    }, []);

    const initializeGame = useCallback((puzzle) => {
        const newGame = new Chess(puzzle.fen);
        setGame(newGame);
        setCurrentMoveIndex(0);
        setMoveHistory([]);
        // Determine user's color based on whose turn it is in the initial position
        const newUserColor = newGame.turn() === 'w' ? 'w' : 'b';
        setUserColor(newUserColor);
        setMessage(newUserColor === 'w' ? 'Make your move!' : 'Wait for opponent\'s move...');
        
        // If it's not the user's turn, make the computer's move
        if (newUserColor !== newGame.turn()) {
            setTimeout(() => makeComputerMove(newGame, [], 0), 500);
        }
    }, []);

    const handleMove = (move) => {
        const currentPuzzle = puzzles[currentPuzzleIndex];
        const expectedMove = currentPuzzle.moves[currentMoveIndex];

        if (move === expectedMove) {
            const newGame = new Chess(game.fen());
            newGame.move(move);
            const newMoveHistory = [...moveHistory, move];
            
            setGame(newGame);
            setCurrentMoveIndex(prevIndex => prevIndex + 1);
            setMoveHistory(newMoveHistory);
            setMessage('Correct! Opponent is moving...');

            // Check if there are more moves in the puzzle
            if (currentMoveIndex + 1 < currentPuzzle.moves.length) {
                // Make the computer's move
                setTimeout(() => makeComputerMove(newGame, newMoveHistory, currentMoveIndex + 1), 500);
            } else {
                showCongratulations();
            }
        } else {
            setMessage('Incorrect move. Try again!');
            // Revert to previous state
            const newGame = new Chess();
            newGame.load(game.fen());
            moveHistory.forEach(historyMove => newGame.move(historyMove));
            setGame(newGame);
        }
    };

    const makeComputerMove = (currentGame, currentMoveHistory, moveIndex) => {
        const currentPuzzle = puzzles[currentPuzzleIndex];
        const computerMove = currentPuzzle.moves[moveIndex];
        
        const newGame = new Chess(currentGame.fen());
        newGame.move(computerMove);
        const newMoveHistory = [...currentMoveHistory, computerMove];

        setGame(newGame);
        setCurrentMoveIndex(moveIndex + 1);
        setMoveHistory(newMoveHistory);
        setMessage('Your turn!');
    };

    const showCongratulations = () => {
        setMessage('Congratulations! You\'ve solved the puzzle!');
        setTimeout(nextPuzzle, 2000);
    };

    const resetGame = () => {
        initializeGame(puzzles[currentPuzzleIndex]);
    };

    const nextPuzzle = () => {
        const newIndex = (currentPuzzleIndex + 1) % puzzles.length;
        setCurrentPuzzleIndex(newIndex);
        initializeGame(puzzles[newIndex]);
    };

    const prevPuzzle = () => {
        const newIndex = (currentPuzzleIndex - 1 + puzzles.length) % puzzles.length;
        setCurrentPuzzleIndex(newIndex);
        initializeGame(puzzles[newIndex]);
    };

    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'ArrowLeft') {
                prevPuzzle();
            } else if (event.key === 'ArrowRight') {
                nextPuzzle();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [currentPuzzleIndex, puzzles]);

    if (!game) {
        return <div>Loading...</div>;
    }

    return (
        <div className="chess-game">
            <Chessboard
                position={game.fen()}
                boardOrientation={userColor === 'w' ? 'white' : 'black'}
                onPieceDrop={(sourceSquare, targetSquare) => {
                    if (game.turn() !== userColor) return false; // Prevent moves when it's not the user's turn
                    const move = `${sourceSquare}${targetSquare}`;
                    handleMove(move);
                    return true;
                }}
            />
            <div className="message">{message}</div>
            <div className="controls">
                <button onClick={prevPuzzle}>Previous</button>
                <button onClick={nextPuzzle}>Next</button>
                <button onClick={resetGame}>Reset</button>
            </div>
            <div className="info">
                <p>Puzzle: {currentPuzzleIndex + 1} / {puzzles.length}</p>
                <p>Move: {currentMoveIndex + 1} / {puzzles[currentPuzzleIndex]?.moves.length}</p>
                <p>You are playing as: {userColor === 'w' ? 'White' : 'Black'}</p>
            </div>
        </div>
    );
};

export default ChessGame;