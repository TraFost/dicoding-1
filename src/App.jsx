import { useRef, useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { CameraService } from './services/CameraService';
import { DetectionService } from './services/DetectionService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG } from './utils/config';

function App() {
  const { state, actions } = useAppState();
  const detectionCleanupRef = useRef(null);
  const [currentTone, setCurrentTone] = useState('normal');
  const cameraServiceRef = useRef(null);
  const detectionServiceRef = useRef(null);
  const factsServiceRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);
  const initDoneRef = useRef(false);
  const detectionInFlightRef = useRef(false);

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const init = async () => {
      try {
        actions.setModelStatus('Memuat Model AI... (0%)');

        const camera = new CameraService();
        const detector = new DetectionService();
        const generator = new RootFactsService();

        cameraServiceRef.current = camera;
        detectionServiceRef.current = detector;
        factsServiceRef.current = generator;

        actions.setServices({ camera, detector, generator });

        actions.setModelStatus('Memuat Model AI... (25%)');

        await Promise.all([
          (async () => {
            await detector.loadModel();
          })(),
          (async () => {
            await generator.loadModel();
          })(),
        ]);

        actions.setModelStatus('Model AI Siap');
      } catch (err) {
        actions.setModelStatus('Gagal Memuat Model');
        actions.setError(err.message || 'Gagal menginisialisasi model AI');
      }
    };

    init();

    return () => {
      if (cameraServiceRef.current) {
        cameraServiceRef.current.stopCamera();
      }
    };
  }, []);

  const stopCameraAfterDetection = useCallback(() => {
    const camera = cameraServiceRef.current;
    if (camera?.isActive()) {
      camera.stopCamera();
    }
    actions.setRunning(false);
  }, []);

  const runDetection = useCallback(async () => {
    const camera = cameraServiceRef.current;
    const detector = detectionServiceRef.current;
    const generator = factsServiceRef.current;

    if (!camera || !detector || !generator) return;
    if (!camera.isActive() || !camera.isReady()) return;
    if (detectionInFlightRef.current) return;

    const now = Date.now();
    const fpsInterval = 1000 / (camera.currentFPS || 30);
    if (now - lastDetectionTimeRef.current < fpsInterval) return;
    lastDetectionTimeRef.current = now;

    detectionInFlightRef.current = true;

    try {
      actions.setAppState('analyzing');

      const result = await detector.predict(camera.video);

      if (result && result.isValid) {
        // Stop webcam ASAP so the next frame doesn't restart inference
        // and reset the generative fun-fact request mid-flight.
        stopCameraAfterDetection();

        actions.setDetectionResult({ className: result.className, score: result.score });
        actions.setFunFactData(null);
        actions.setAppState('result');

        const fact = await generator.generateFacts(result.className);

        if (fact) {
          actions.setFunFactData(fact);
        } else {
          actions.setFunFactData('error');
        }
      }
    } catch (err) {
      actions.setError(err.message);
    } finally {
      detectionInFlightRef.current = false;
    }
  }, [stopCameraAfterDetection]);

  useEffect(() => {
    if (state.isRunning && detectionServiceRef.current?.isLoaded()) {
      const interval = setInterval(runDetection, APP_CONFIG.detectionRetryInterval);
      detectionCleanupRef.current = () => clearInterval(interval);
      return () => {
        if (detectionCleanupRef.current) {
          detectionCleanupRef.current();
          detectionCleanupRef.current = null;
        }
      };
    }
  }, [state.isRunning, runDetection]);

  const handleToggleCamera = useCallback(async () => {
    const camera = cameraServiceRef.current;

    if (!camera) return;

    if (state.isRunning) {
      camera.stopCamera();
      detectionInFlightRef.current = false;
      actions.setRunning(false);
      actions.resetResults();
      return;
    }

    try {
      actions.resetResults();
      await camera.startCamera();
      actions.setRunning(true);
      actions.setError(null);
    } catch (err) {
      actions.setError(`Gagal memulai kamera: ${  err.message}`);
    }
  }, [state.isRunning]);

  const handleToneChange = useCallback((tone) => {
    setCurrentTone(tone);
    if (factsServiceRef.current) {
      factsServiceRef.current.setTone(tone);
    }
  }, []);

  const handleCopyFact = useCallback(async () => {
    const text = state.funFactData;
    if (!text || typeof text !== 'string') return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      actions.setError('Gagal menyalin ke clipboard');
    }
  }, [state.funFactData]);

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          onToggleCamera={handleToggleCamera}
          onToneChange={handleToneChange}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={handleCopyFact}
        />
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js & Transformers.js</p>
      </footer>

      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '380px',
          padding: '0.875rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.8125rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
