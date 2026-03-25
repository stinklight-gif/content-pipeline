import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('LLM_API_KEY (or OPENAI_API_KEY) must be set in .env');
}

const client = new OpenAI({
  apiKey,
  baseURL: process.env.LLM_BASE_URL || 'https://api.moonshot.ai/v1',
});

const DEFAULT_MODEL = process.env.LLM_MODEL || 'moonshot-v1-auto';

/**
 * Send a chat completion request to the LLM.
 * @param {object} options
 * @param {string} options.system — System prompt
 * @param {string} options.user — User prompt
 * @param {string} [options.model] — Model override
 * @param {number} [options.temperature=0.7]
 * @param {number} [options.maxTokens=16000]
 * @param {boolean} [options.json=false] — Request JSON response format
 * @returns {Promise<string>} The assistant's reply text
 */
export async function chat({
  system,
  user,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  maxTokens = 16000,
  json = false,
}) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  });

  return response.choices[0].message.content;
}

/**
 * Parse a JSON response from the LLM, handling markdown code fences.
 * @param {string} text — Raw LLM output
 * @returns {any} Parsed JSON
 */
export function parseJsonResponse(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}
