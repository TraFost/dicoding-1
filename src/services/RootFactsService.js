import { pipeline } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';
import { logError } from '../utils/common';

const TONE_PROMPTS = {
  normal: 'Tell me an interesting fun fact about {vegetable} in one sentence.',
  funny: 'Tell me a funny and entertaining fact about {vegetable} in one sentence. Make it humorous.',
  professional: 'Provide a professional, scientific fact about {vegetable} in one sentence.',
  casual: 'Tell me a cool, casual fact about {vegetable} in one sentence.',
};

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.currentTone = TONE_CONFIG.defaultTone;
    this.backend = null;
  }

  async loadModel() {
    const modelId = 'Xenova/LaMini-Flan-T5-783M';

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
    this.isGenerating = true;

    try {
      const promptTemplate = TONE_PROMPTS[this.currentTone] || TONE_PROMPTS.normal;
      const prompt = promptTemplate.replace('{vegetable}', vegetableName);

      const result = await this.generator(prompt, {
        max_new_tokens: 50,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
      });

      return result[0]?.generated_text || null;
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
