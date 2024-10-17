import { ChatOpenAI } from "@langchain/openai";
import type { AIMessageChunk, MessageContentComplex, MessageContentText } from "@langchain/core/messages";
import { WatsonxAI } from "@langchain/community/llms/watsonx_ai";
import { ChatPromptTemplate } from "@langchain/core/prompts"; 
import dotenv from "dotenv";

dotenv.config();


// LLM 1 - Complex: Grades the answer and returns JSON
const llmComplex = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  model: "gpt-4o-mini", 
});

// LLM 2 - Simple: Formulates feedback based on grading JSON
const llmSimple = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
  temperature: 0.5,
  model: "gpt-4o-mini", 
});

// Optional LLM 3 - Guardrails: Content moderation
const llmGuardrails = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
  temperature: 0.3,
  model: "gpt-4o-mini", 
});

// Llama model with IBM WatsonX
const llmWatsonx = new WatsonxAI({
  modelId: "meta-llama/llama-3-1-8b-instruct",
  // ibmCloudApiKey: '< replace with your WatsonX key >',
  // projectId: '< replace with project ID >',
  modelParameters: {
    max_new_tokens: 100,
    min_new_tokens: 0,
    stop_sequences: [],
    repetition_penalty: 1,
  },
});


// Prompt for LLM 1 - Grading
const gradingPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are an experienced language tutor." ],
  [
    "user",`Grade the following answer in {language} on a scale of 1 to 10.
      Provide the grade as an integer under the key "mark" and list the mistakes under the key "mistakes".

      Answer:
      "{answer}"

      Response format (JSON):
      {{
        "mark": integer,
        "mistakes": ["mistake1", "mistake2", ...]
          }}`,
  ],
]);

// Prompt for LLM 2 - Feedback
const feedbackPrompt = ChatPromptTemplate.fromMessages([

  ["system","You are a friendly language tutor." ],
  ["user",`
Based on the following grading in {language}, provide constructive feedback to the student in English so they can improve in learning the language. If the mark is 10 then just say the user did a great work. Do not use markdown.

Grading:
{{
"mark": {mark},
"mistakes": {mistakes}
  }}

Feedback:
    `,
  ],
]);

// Optional Prompt for LLM 3 - Guardrails
const guardrailsPrompt = ChatPromptTemplate.fromMessages([
["system", "You are a content moderator." ],
["user",`
Analyze the following feedback in {language} for any inappropriate or offensive content. Respond with "Clean" if the content is appropriate or "Flagged" if it contains disallowed content.

Feedback:
"{feedback}"

Analysis:
    `,
],
]);


/**
 * Type Definitions
 */
interface GradingResponse {
  mark: number;
  mistakes: string[];
}

/**
 * Type Guard to Check if an Error is an Instance of Error
 */
function isError(error: unknown): error is Error {
  return typeof error === "object" && error !== null && "message" in error;
}

function isMessageContentText(chunk: MessageContentComplex): chunk is MessageContentText {
  return (chunk as MessageContentText).type === "text" && typeof (chunk as MessageContentText).text === "string";
}

/**
 * Helper Function to Extract Content from AIMessageChunk or String
 * @param response - The response from the LLM invocation
 * @returns The extracted content as a string
 * @throws Error if the response type is unexpected
 */
function extractContent(response: AIMessageChunk | string): string {
  if (typeof response === "string") {
    return response.trim();
  } else if (response.content) {
    if (typeof response.content === "string") {
      return response.content.trim();
    } else if (Array.isArray(response.content)) {
      const contents = response.content
        .filter(isMessageContentText) 
        .map(chunk => chunk.text)
        .join(" ")
        .trim();
      return contents;
    }
  }
  throw new Error("Unexpected response structure");
}

/**
 * Grades the User's Answer
 * @param language - The language of the answer.
 * @param answer - The user's answer to grade.
 * @returns GradingResponse containing mark and mistakes.
 */
export async function gradeAnswer(language: string, answer: string): Promise<GradingResponse> {
  try {
    // Format the prompt with the user's answer and selected language
    const formattedPrompt = await gradingPrompt.format({ language, answer });

    // Invoke the LLM with the formatted messages
    const response = await llmComplex.invoke(formattedPrompt);

    const gradingContent = extractContent(response);

    console.log("Grading content received:", gradingContent);

    const grading: GradingResponse = JSON.parse(gradingContent);

    return grading;
  } catch (error) {
    if (isError(error)) {
      console.error("Error in gradeAnswer:", error.message);
      throw new Error(`Failed to grade answer: ${error.message}`);
    } else {
      console.error("Unknown error in gradeAnswer:", error);
      throw new Error("Failed to grade answer due to an unknown error.");
    }
  }
}

/**
 * Generates Feedback Based on Grading
 * @param language - The language for feedback.
 * @param grading - The grading response containing mark and mistakes.
 * @returns A feedback string for the user.
 */
export async function generateFeedback(language: string, grading: GradingResponse): Promise<string> {
  try {
    const { mark, mistakes } = grading;

    // Convert mistakes array to a JSON string for clarity in the prompt
    const mistakesString = JSON.stringify(mistakes);

    // Format the prompt with grading details and selected language
    const formattedPrompt = await feedbackPrompt.format({ language, mark, mistakes: mistakesString });
    
    console.log("Formatted prompt for generating feedback", formattedPrompt);

    // Invoke the LLM with the formatted messages
    const feedbackResponse = await llmWatsonx.invoke(formattedPrompt);

    const feedbackContent = extractContent(feedbackResponse);

    console.log("Feedback content received:", feedbackContent);

    return feedbackContent;
  } catch (error) {
    if (isError(error)) {
      console.error("Error in generateFeedback:", error.message);
      throw new Error(`Failed to generate feedback: ${error.message}`);
    } else {
      console.error("Unknown error in generateFeedback:", error);
      throw new Error("Failed to generate feedback due to an unknown error.");
    }
  }
}

/**
 * Optional: Moderates Feedback Content
 * @param language - The language of the feedback.
 * @param feedback - The feedback generated for the user.
 * @returns Boolean indicating if feedback is clean (true) or contains inappropriate content (false).
 */
export async function moderateFeedback(language: string, feedback: string): Promise<boolean> {
  try {
    // Format the prompt with feedback content and selected language
    const formattedPrompt = await guardrailsPrompt.format({ language, feedback });

    const analysis = await llmGuardrails.invoke(formattedPrompt);

    // Extract content using helper function
    const analysisContent = extractContent(analysis);

    console.log("Analysis content received:", analysisContent);

    // Determine if content is clean based on analysis
    return analysisContent.toLowerCase() === "clean";
  } catch (error) {
    if (isError(error)) {
      console.error("Error in moderateFeedback:", error.message);
      // In case of moderation failure, default to allowing the feedback
      return true;
    } else {
      console.error("Unknown error in moderateFeedback:", error);
      return true;
    }
  }
}
