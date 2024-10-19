// import express from 'express';
// import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import path from 'path';

// const router = express.Router();
// const client = new ChromaClient();
// const embedder = new OpenAIEmbeddingFunction('your-openai-api-key');

// // Initialize Gemini Pro
// const genAI = new GoogleGenerativeAI('your-gemini-api-key');
// const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// const initialize = async () => {
//     const collection = await client.createCollection('chess_games', {}, embedder);
//     return collection;
// };

// const collection = await initialize();

// router.post('/upload', async (req, res) => {
//     try {
//         const gameData = req.body;
//         const prompt = `Analyze the following chess game and create a context summary:...`;

//         // Use Gemini Pro to generate context
//         const result = await model.generateContent(prompt);
//         const context = result.response.text();

//         await collection.add({
//             ids: [gameData.id || Date.now().toString()],
//             metadatas: [{ ...gameData, context: context.trim() }],
//             documents: [JSON.stringify(gameData)]
//         });

//         res.status(200).json({ message: 'Game data uploaded and analyzed successfully' });
//     } catch (error) {
//         console.error('Error processing game data:', error);
//         res.status(500).json({ error: 'Failed to process game data' });
//     }
// });

// router.get('/query', async (req, res) => {
//     try {
//         const { query, limit } = req.query;
//         const results = await collection.query({
//             queryTexts: [query],
//             nResults: parseInt(limit) || 10
//         });

//         res.status(200).json(results);
//     } catch (error) {
//         console.error('Error querying database:', error);
//         res.status(500).json({ error: 'Failed to query database' });
//     }
// });

// export default router;
