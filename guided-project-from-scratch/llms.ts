// llm.ts
import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize the OpenAI LLM using LangChain
 */
const llm = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  modelName: 'gpt-4o-mini',
});

/**
 * Define Prompt Templates
 * It's efficient to define them once instead of inside each function.
 */
const lessonPrompt = new PromptTemplate({
  template: `You are a friendly language tutor teaching {language}. Provide a brief lesson on "{topic}". Make it engaging and easy to understand.`,
  inputVariables: ['language', 'topic'],
});

const exercisePrompt = new PromptTemplate({
  template: `You are a language tutor for {language}. Create a simple exercise to practice "{topic}". Provide clear instructions and examples.`,
  inputVariables: ['language', 'topic'],
});

const feedbackPrompt = new PromptTemplate({
  template: `You are a language tutor for {language}. Provide constructive feedback on the following answer:\n\n"{userAnswer}"\n\nInclude corrections and suggestions for improvement.`,
  inputVariables: ['language', 'userAnswer'],
});

/**
 * Generates a lesson on a given topic for the specified language.
 * @param language - The language to learn.
 * @param topic - The topic of the lesson.
 * @returns The generated lesson text.
 */
export async function generateLesson(language: string, topic: string): Promise<string> {
  try {
    // Await the formatted prompt
    const formattedPrompt = await lessonPrompt.format({ language, topic });

    // Call the LLM with the formatted prompt
    const lesson = await llm.call(formattedPrompt);

    return lesson.trim() || 'No lesson available.';
  } catch (error) {
    if (isError(error)) {
      console.error('Error in generateLesson:', error.message);
      throw new Error(`Failed to generate lesson: ${error.message}`);
    } else {
      console.error('Unknown error in generateLesson:', error);
      throw new Error('Failed to generate lesson due to an unknown error.');
    }
  }
}

/**
 * Creates an exercise based on the lesson topic for the specified language.
 * @param language - The language to learn.
 * @param topic - The topic of the exercise.
 * @returns The generated exercise text.
 */
export async function generateExercise(language: string, topic: string): Promise<string> {
  try {
    // Await the formatted prompt
    const formattedPrompt = await exercisePrompt.format({ language, topic });

    // Call the LLM with the formatted prompt
    const exercise = await llm.call(formattedPrompt);

    return exercise.trim() || 'No exercise available.';
  } catch (error) {
    if (isError(error)) {
      console.error('Error in generateExercise:', error.message);
      throw new Error(`Failed to generate exercise: ${error.message}`);
    } else {
      console.error('Unknown error in generateExercise:', error);
      throw new Error('Failed to generate exercise due to an unknown error.');
    }
  }
}

/**
 * Provides feedback on the user's answer to an exercise.
 * @param language - The language being learned.
 * @param userAnswer - The user's answer to the exercise.
 * @returns The feedback text.
 */
export async function provideFeedback(language: string, userAnswer: string): Promise<string> {
  try {
    // Await the formatted prompt
    const formattedPrompt = await feedbackPrompt.format({ language, userAnswer });

    // Call the LLM with the formatted prompt
    const feedback = await llm.call(formattedPrompt);

    return feedback.trim() || 'No feedback available.';
  } catch (error) {
    if (isError(error)) {
      console.error('Error in provideFeedback:', error.message);
      throw new Error(`Failed to provide feedback: ${error.message}`);
    } else {
      console.error('Unknown error in provideFeedback:', error);
      throw new Error('Failed to provide feedback due to an unknown error.');
    }
  }
}

/**
 * Type guard to check if an error is an instance of Error.
 * @param error - The error object to check.
 * @returns True if error is an instance of Error, otherwise false.
 */
function isError(error: unknown): error is Error {
  return typeof error === 'object' && error !== null && 'message' in error;
}
