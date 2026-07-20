import * as tf from '@tensorflow/tfjs';
import { isWebGPUSupported, logError, validateModelMetadata } from '../utils/common';
import { APP_CONFIG } from '../utils/config';

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.backend = null;
    this.loadProgress = 0;
  }

  async loadModel() {
    this.backend = await this._initBackend();

    const [model, metadata] = await Promise.all([
      tf.loadLayersModel('/model/model.json'),
      fetch('/model/metadata.json').then((r) => r.json()),
    ]);

    if (!validateModelMetadata(metadata)) {
      throw new Error('Invalid model metadata');
    }

    this.model = model;
    this.labels = metadata.labels;
    this.loadProgress = 100;
  }

  async _initBackend() {
    // Probe first — TFJS WebGPU crashes on null adapter (features access)
    // instead of failing cleanly when Windows has no GPU adapter.
    if (await isWebGPUSupported()) {
      try {
        await import('@tensorflow/tfjs-backend-webgpu');
        const ok = await tf.setBackend('webgpu');
        if (ok) {
          await tf.ready();
          return 'webgpu';
        }
      } catch (err) {
        logError('WebGPU unavailable, using WebGL', err);
      }
    }

    await tf.setBackend('webgl');
    await tf.ready();
    return 'webgl';
  }

  async predict(imageElement) {
    if (!this.model || !this.isLoaded()) return null;

    return tf.tidy(() => {
      const tensor = tf.browser
        .fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims(0);

      const predictions = this.model.predict(tensor);
      const scores = predictions.dataSync();
      const maxScore = Math.max(...scores);
      const maxIndex = scores.indexOf(maxScore);

      const className = this.labels[maxIndex] || 'Unknown';
      const confidence = maxScore;

      const isValid = confidence >= APP_CONFIG.detectionConfidenceThreshold / 100;

      return { className, score: confidence, isValid, index: maxIndex };
    });
  }

  isLoaded() {
    return this.model !== null;
  }
}
