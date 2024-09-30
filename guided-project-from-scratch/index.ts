// index.ts
import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { generateLesson, generateExercise, provideFeedback } from './llms';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
const publicPath = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicPath));

/**
 * API Endpoint to get a lesson.
 * Expects JSON body with 'language' and 'topic'.
 */
app.post('/api/lesson', async (req: Request, res: Response) => {
  const { language, topic } = req.body;

  if (!language || !topic) {
    return res.status(400).json({ error: 'Language and topic are required.' });
  }

  try {
    const lesson = await generateLesson(language, topic);
    res.json({ lesson });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate lesson.' });
  }
});

/**
 * API Endpoint to get an exercise.
 * Expects JSON body with 'language' and 'topic'.
 */
app.post('/api/exercise', async (req: Request, res: Response) => {
  const { language, topic } = req.body;

  if (!language || !topic) {
    return res.status(400).json({ error: 'Language and topic are required.' });
  }

  try {
    const exercise = await generateExercise(language, topic);
    res.json({ exercise });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate exercise.' });
  }
});

/**
 * API Endpoint to get feedback.
 * Expects JSON body with 'language' and 'answer'.
 */
app.post('/api/feedback', async (req: Request, res: Response) => {
  const { language, answer } = req.body;

  if (!language || !answer) {
    return res.status(400).json({ error: 'Language and answer are required.' });
  }

  try {
    const feedback = await provideFeedback(language, answer);
    res.json({ feedback });
  } catch (error) {
    res.status(500).json({ error: 'Failed to provide feedback.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
