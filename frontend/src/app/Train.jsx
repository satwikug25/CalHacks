import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

// import './css/Train.css';

const ChessGame = () => {
    const [puzzles, setPuzzles] = useState([]);
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [message, setMessage] = useState('');
    const [moveHistory, setMoveHistory] = useState([]);
    const [userColor, setUserColor] = useState('w');
    const [isAnimating, setIsAnimating] = useState(false);
    const [moveInput, setMoveInput] = useState('');
    const username = localStorage.getItem('username');

    // useEffect(() => {
    //     setTimeout(() => setIsLoaded(true), 100);
    // }, []);

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
            } else {
                setMessage('No puzzles available. Please try again later.');
            }
        };
        loadPuzzles();
    }, []);

    const initializeGame = useCallback((puzzle) => {
        if (!puzzle) {
            console.error('No puzzle available to initialize the game.');
            setMessage('No puzzles available. Please try again later.');
            return;
        }

        const newGame = new Chess(puzzle.fen);
        const activeColor = newGame.turn();
        const newUserColor = activeColor === 'w' ? 'b' : 'w';
        setUserColor(newUserColor);
        setGame(newGame);
        setCurrentMoveIndex(0);
        setMoveHistory([]);
        
        if (newUserColor === 'b') {
            setMessage("This is the initial position. Watch the computer's move...");
            setTimeout(() => makeComputerMove(newGame, [], 0, puzzle), 1000);
        } else {
            setMessage("Your turn to solve the puzzle!");
        }

        console.log('Initialized game:', newGame.fen(), 'User color:', newUserColor);
    }, []);

    const animateComputerMoves = (currentGame, moves) => {
        setIsAnimating(true);
        let moveIndex = 0;

        const animateMove = () => {
            if (moveIndex < moves.length) {
                const move = moves[moveIndex];
                const newGame = new Chess(currentGame.fen());
                newGame.move(move);
                setGame(newGame);
                setMoveHistory(prevHistory => [...prevHistory, move]);
                setCurrentMoveIndex(moveIndex + 1);
                console.log('Computer move made:', move, 'New FEN:', newGame.fen());

                moveIndex++;
                setTimeout(animateMove, 1000);
            } else {
                setIsAnimating(false);
                setMessage('Your turn to solve the puzzle!');
            }
        };

        animateMove();
    };

    const makeComputerMove = useCallback((currentGame, currentMoveHistory, moveIndex, currentPuzzle) => {
        if (!currentPuzzle || !currentPuzzle.moves || currentPuzzle.moves.length <= moveIndex) {
            console.error('Invalid puzzle data or move index.');
            setMessage('Error: Unable to make computer move. Please try another puzzle.');
            return;
        }

        const computerMove = currentPuzzle.moves[moveIndex];
        
        const newGame = new Chess(currentGame.fen());
        newGame.move(computerMove);
        const newMoveHistory = [...currentMoveHistory, computerMove];

        setGame(newGame);
        setCurrentMoveIndex(moveIndex + 1);
        setMoveHistory(newMoveHistory);
        
        console.log('Computer move made:', computerMove, 'New FEN:', newGame.fen());
    }, []);

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

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleMove(moveInput);
            setMoveInput('');
        }
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

    const handleMove = useCallback((move) => {
        if (isAnimating || !game || game.turn() !== userColor) return;

        console.log('Attempting move:', move);
        const currentPuzzle = puzzles[currentPuzzleIndex];
        if (!currentPuzzle || !currentPuzzle.moves) {
            console.error('Invalid puzzle data');
            setMessage('Error: Invalid puzzle data. Please try another puzzle.');
            return;
        }

        const expectedMove = currentPuzzle.moves[currentMoveIndex];

        console.log('Expected move:', expectedMove);

        if (move === expectedMove) {
            const newGame = new Chess(game.fen());
            newGame.move(move);
            const newMoveHistory = [...moveHistory, move];
            
            setGame(newGame);
            setCurrentMoveIndex(prevIndex => prevIndex + 1);
            setMoveHistory(newMoveHistory);

            console.log('Correct move made. New FEN:', newGame.fen());

            if (currentMoveIndex + 1 < currentPuzzle.moves.length) {
                setMessage('Correct! Opponent is thinking...');
                setIsAnimating(true);
                setTimeout(() => {
                    makeComputerMove(newGame, newMoveHistory, currentMoveIndex + 1, currentPuzzle);
                    setIsAnimating(false);
                    if (currentMoveIndex + 2 < currentPuzzle.moves.length) {
                        setMessage('Your turn to solve the puzzle!');
                    } else {
                        showCongratulations();
                    }
                }, 500);
            } else {
                showCongratulations();
            }
        } else {
            setMessage('Incorrect move. Try again!');
            console.log('Incorrect move. Expected:', expectedMove, 'Got:', move);
        }
    }, [game, userColor, puzzles, currentPuzzleIndex, currentMoveIndex, moveHistory, makeComputerMove, showCongratulations, isAnimating]);

    if (!game) {
        return <div className={`transition-opacity duration-500`}>Loading...</div>;
    }

    return (
        <div className="chess-game-container">
            <h1 className="chess-game-title">Customized Puzzles</h1>
            <div className="game-info">
                <p>Current turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>
                <p>Puzzle: {currentPuzzleIndex + 1} / {puzzles.length}</p>
            </div>
            <div className="chessboard-wrapper">
                <Chessboard
                    position={game.fen()}
                    boardOrientation={userColor === 'w' ? 'white' : 'black'}
                    onPieceDrop={(sourceSquare, targetSquare) => {
                        if (isAnimating || game.turn() !== userColor) return false;
                        const move = `${sourceSquare}${targetSquare}`;
                        handleMove(move);
                        return true;
                    }}
                />
            </div>
            <div className="message">{message}</div>
            <div className="button-group">
                <button className="btn btn-blue" onClick={prevPuzzle}>Previous Puzzle</button>
                <button className="btn btn-green" onClick={resetGame}>Reset Puzzle</button>
                <button className="btn btn-blue" onClick={nextPuzzle}>Next Puzzle</button>
            </div>
            <input
                className="move-input"
                type="text"
                placeholder="Enter move (e.g., e2e4)"
                value={moveInput}
                onChange={(e) => setMoveInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
            />
            <div className="additional-info">
                <p>Move: {currentMoveIndex + 1} / {puzzles[currentPuzzleIndex]?.moves.length}</p>
                <p>You are playing as: {userColor === 'w' ? 'White' : 'Black'}</p>
            </div>
        </div>
    );
};

export default ChessGame;
