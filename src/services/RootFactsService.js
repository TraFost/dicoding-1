import { pipeline } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';
import { logError } from '../utils/common';

const GENERATION_CONFIG = {
  max_new_tokens: 64,
  temperature: 0.35,
  top_p: 0.7,
  do_sample: true,
};

const TONE_INSTRUCTIONS = {
  normal: 'Write one interesting, accurate fun fact about this vegetable.',
  funny: 'Write one funny, light-hearted fun fact about this vegetable. Keep it humorous but still about the vegetable.',
  professional: 'Write one professional, scientific fact about this vegetable.',
  casual: 'Write one cool, casual fun fact about this vegetable.',
};

function buildPrompt(vegetableName, tone) {
  const instruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.normal;

  return [
    'You are a vegetable facts assistant.',
    `Detected vegetable label from computer vision: "${vegetableName}".`,
    `The classified object is the vegetable named ${vegetableName}.`,
    instruction,
    `Rules: The fact must be about ${vegetableName} only.`,
    `Mention ${vegetableName} clearly in the sentence.`,
    'Do not invent eras, rocks, stories, or unrelated topics.',
    'Reply with exactly one short sentence and nothing else.',
    `Fun fact about ${vegetableName}:`,
  ].join(' ');
}

function normalizeFact(text, vegetableName) {
  if (!text || typeof text !== 'string') return null;

  let fact = text
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!fact) return null;

  const cue = `Fun fact about ${vegetableName}:`;
  const cueIndex = fact.toLowerCase().indexOf(cue.toLowerCase());
  if (cueIndex !== -1) {
    fact = fact.slice(cueIndex + cue.length).trim();
  }

  const sentenceMatch = fact.match(/^[^.!?]+[.!?]?/);
  if (sentenceMatch) {
    fact = sentenceMatch[0].trim();
  }

  const mentionsVegetable = fact.toLowerCase().includes(vegetableName.toLowerCase());
  if (!mentionsVegetable) {
    fact = `${vegetableName}: ${fact}`;
  }

  return fact || null;
}

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.currentTone = TONE_CONFIG.defaultTone;
    this.backend = null;
    this.lastVegetable = null;
  }

  async loadModel() {
    const modelId = 'Xenova/LaMini-Flan-T5-77M';

    this.generator = await pipeline('text2text-generation', modelId, {
      device: 'wasm',
    });

    this.isModelLoaded = true;
  }

  setTone(tone) {
    if (TONE_CONFIG.availableTones.some((t) => t.value === tone)) {
      this.currentTone = tone;
    }
  }

  async generateFacts(vegetableName) {
    if (this.isGenerating) return null;
    if (!vegetableName || typeof vegetableName !== 'string') return null;

    const label = vegetableName.trim();
    if (!label) return null;

    this.isGenerating = true;
    this.lastVegetable = label;

    try {
      const prompt = buildPrompt(label, this.currentTone);

      const result = await this.generator(prompt, GENERATION_CONFIG);
      const rawText = result[0]?.generated_text || null;

      if (this.lastVegetable !== label) return null;

      return normalizeFact(rawText, label);
    } catch (err) {
      logError('Fun fact generation failed', err);
      return null;
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded;
  }
}
