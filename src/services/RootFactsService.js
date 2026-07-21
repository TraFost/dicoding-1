import { pipeline } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';
import { logError } from '../utils/common';

const GENERATION_CONFIG = {
  max_new_tokens: 64,
  temperature: 0.35,
  top_p: 0.7,
  do_sample: true,
};

function buildPrompt(vegetableName, tone) {
  const toneLabel = tone || TONE_CONFIG.defaultTone;

  return `Describe vegetable ${vegetableName} in ${toneLabel} way with one sentences. Focus on its health benefits or unique characteristics.`;
}

function normalizeFact(text, vegetableName) {
  if (!text || typeof text !== 'string') return null;

  let fact = text
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!fact) return null;

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
