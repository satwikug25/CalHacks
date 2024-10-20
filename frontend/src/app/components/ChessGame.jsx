import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

const ChessGame = ({ pgn, setOpenedChessGameChat }) => {
    const [game, setGame] = useState(new Chess())

    useEffect(() => {
        if (pgn && pgn.moves) {
            const newGame = new Chess()
            pgn.moves.forEach(move => newGame.move(move))
            setGame(newGame)
        }
    }, [pgn])

    const handleGameClick = () => {
        setOpenedChessGameChat(pgn)
    }

    return (
        <div 
            onClick={handleGameClick}
            className="relative w-60 bg-white rounded-lg hover:bg-neutral-500 transition-all duration-200 cursor-pointer"
        >
            <Chessboard position={game.fen()} boardWidth={240} />

            <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center text-white p-2">
                <p>{pgn.white} vs {pgn.black}</p>
                <p>Result: {pgn.winner == 'Black' || pgn.winner == 'White' ? pgn.winner + " wins because of " + pgn.status : 'Draw'} </p>
            </div>
        </div>
    )
}

ChessGame.propTypes = {
    pgn: PropTypes.object,
    setOpenedChessGameChat: PropTypes.func
}

export default ChessGame
