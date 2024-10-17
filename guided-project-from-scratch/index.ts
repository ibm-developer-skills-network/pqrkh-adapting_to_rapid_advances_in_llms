
import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { gradeAnswer, generateFeedback, moderateFeedback } from './llms';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());


const publicPath = path.resolve(__dirname, '..', 'public');
console.log('Serving static files from:', publicPath);


app.use(express.static(publicPath));


app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

/**
 * Type guard to check if an error is an instance of Error.
 * @param error - The error object to check.
 * @returns True if error is an instance of Error, otherwise false.
 */
function isError(error: unknown): error is Error {
  return typeof error === 'object' && error !== null && 'message' in error;
}

/**
 * API Endpoint to handle user chat.
 * Expects JSON body with 'language' and 'answer'.
 */
app.post(
  '/api/chat',
  [
    body('language').isString().withMessage('Language must be a string.'),
    body('answer').isString().withMessage('Answer must be a string.'),
  ],
  async (req: Request, res: Response) => {
    // Validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { language, answer } = req.body;

    try {
      // Step 1: Grade the answer
      const grading = await gradeAnswer(language, answer);
      console.log(grading);

      // Step 2: Generate feedback based on grading
      const feedback = await generateFeedback(language, grading);

      console.log(feedback);

      // Step 3: Moderate feedback content
      const isClean = await moderateFeedback(language, feedback);
      if (!isClean) {
        return res
          .status(500)
          .json({ error: 'Generated feedback contains inappropriate content.' });
      }

      // Send the feedback to the user
      res.json({ mark: grading.mark, feedback });
    } catch (error) {
      if (isError(error)) {
        console.error('Error in /api/chat:', error.message);
        res.status(500).json({ error: `Failed to process chat: ${error.message}` });
      } else {
        console.error('Unknown error in /api/chat:', error);
        res.status(500).json({ error: 'Failed to process chat due to an unknown error.' });
      }
    }
  }
);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
