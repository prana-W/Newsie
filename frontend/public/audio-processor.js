/**
 * AudioWorklet Processor — Low-latency mic capture for Newsie Voice Chat
 * Converts Float32 audio frames to Int16 PCM and posts to main thread.
 * Buffer size kept small (512 samples = ~32ms) for low latency.
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Int16Array(0);
    this._bufferSize = 512; // ~32ms at 16kHz — low latency
    this._streamingEnabled = true;

    this.port.onmessage = (event) => {
      if (event.data && event.data.type === "streaming") {
        this._streamingEnabled = Boolean(event.data.enabled);
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono
    const samples = new Int16Array(channelData.length);

    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Append to buffer
    const newBuffer = new Int16Array(this._buffer.length + samples.length);
    newBuffer.set(this._buffer);
    newBuffer.set(samples, this._buffer.length);
    this._buffer = newBuffer;

    if (!this._streamingEnabled) {
      this._buffer = new Int16Array(0);
      return true;
    }

    // Send as soon as buffer is full — keep latency tight
    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.slice(0, this._bufferSize);
      this._buffer = this._buffer.slice(this._bufferSize);
      this.port.postMessage(chunk.buffer, [chunk.buffer]);
    }

    return true;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
