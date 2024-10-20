import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8081;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const chroma = new ChromaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let collection;
(async () => {
  collection = await chroma.getOrCreateCollection({
    name: "chess_games",
    embeddingFunction: new OpenAIEmbeddingFunction({ openai_api_key: process.env.GEMINI_API_KEY })
  });
})();

async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  if (Array.isArray(result.embedding)) {
    return result.embedding;
  } else if (typeof result.embedding === 'object' && result.embedding.values) {
    return result.embedding.values;
  } else {
    throw new Error('Unexpected embedding format');
  }
}

async function generateDescription(game) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Analyze this chess game and provide a description in the following format:
  "Opening is [opening name], endgame is [endgame description], players are [white player] and [black player], Elo is [white Elo] and [black Elo]."
  Game details:
  ${JSON.stringify(game, null, 2)}`;

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  return result.response.text();
}

app.post('/upload', async (req, res) => {
  try {
    const game = req.body;
    const description = await generateDescription(game);
    const fullGame = { ...game, description };
    console.log(description);
    const embedding = await embedText(JSON.stringify(fullGame));

    await collection.add({
      ids: [game.id || Date.now().toString()],
      embeddings: [embedding],
      metadatas: [fullGame],
      documents: [JSON.stringify(fullGame)]
    });

    res.json({ message: 'Game uploaded successfully', description });
  } catch (error) {
    console.error('Error uploading game:', error);
    res.status(500).json({ error: 'An error occurred while uploading the game' });
  }
});

app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    const queryEmbedding = await embedText(query);

    // Extract nResults from the query
    const nResultsMatch = query.match(/\b(\d+)\s+results?\b/i);
    const nResults = nResultsMatch ? parseInt(nResultsMatch[1]) : 9;

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResults
    });

    const formattedResults = results.documents[0].map(game => {
      game = JSON.parse(game);
      console.log(game.moves);
      return ({
        white: game.white,
        black: game.black,
        whiteElo: game.whiteElo,
        blackElo: game.blackElo,
        result: game.result,
        moves: game.moves || '',
        description: game.description
      });
    });

    res.json(formattedResults);
  } catch (error) {
    console.error('Error searching games:', error);
    res.status(500).json({ error: 'An error occurred while searching games' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
