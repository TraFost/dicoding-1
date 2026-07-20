export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.currentFPS = 30;
    this.currentCameraId = null;
  }

  setVideoElement(videoElement) {
    this.video = videoElement;
  }

  setCanvasElement(canvasElement) {
    this.canvas = canvasElement;
  }

  async loadCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'videoinput');
  }

  async startCamera(selectedCameraId) {
    if (this.stream) {
      this.stopCamera();
    }

    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: selectedCameraId === 'front' ? 'user' : 'environment',
      },
      audio: false,
    };

    if (selectedCameraId && selectedCameraId !== 'default' && selectedCameraId !== 'front') {
      constraints.video.deviceId = { exact: selectedCameraId };
    }

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (this.video) {
      this.video.srcObject = this.stream;
      await this.video.play();
    }

    this.currentCameraId = selectedCameraId;
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  setFPS(fps) {
    this.currentFPS = fps;
  }

  isActive() {
    return this.stream !== null && this.stream.active;
  }

  isReady() {
    return this.video !== null && this.video.readyState >= 2;
  }
}
