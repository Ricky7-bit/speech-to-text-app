// frontend/src/components/Recorder.js
import React, { useRef, useState } from "react";
import axios from "axios";

export default function Recorder() {
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const buffersRef = useRef([]);
  const sampleRateRef = useRef(44100);

  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    setTranscription("");
    buffersRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext();
    sampleRateRef.current = audioContextRef.current.sampleRate; // usually 48000

    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

    // Use ScriptProcessorNode to capture PCM (works in most browsers)
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      const channelData = e.inputBuffer.getChannelData(0);
      buffersRef.current.push(new Float32Array(channelData));
    };

    sourceRef.current.connect(processor);
    processor.connect(audioContextRef.current.destination);
    processorRef.current = processor;

    setRecording(true);
  };

  const stopRecording = async () => {
    // stop the audio nodes and stream
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);

    // merge buffers
    const merged = mergeBuffers(buffersRef.current);
    // downsample to 16000
    const downsampled = downsampleBuffer(merged, sampleRateRef.current, 16000);
    // simple amplitude normalization (makes soft speech clearer)
    const normalized = normalizeBuffer(downsampled);

    // create WAV blob
    const wavBlob = encodeWAV(normalized, 16000);
    const url = URL.createObjectURL(wavBlob);
    setAudioURL(url);

    // upload to backend
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", wavBlob, "recording.wav");
      const res = await axios.post("http://localhost:5000/transcribe", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setTranscription(res.data.transcription || res.data.error || "No transcription");
    } catch (err) {
      setTranscription("Error: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button onClick={startRecording} disabled={recording}>
          🎙 Start
        </button>
        <button onClick={stopRecording} disabled={!recording} style={{ marginLeft: 8 }}>
          ⏹ Stop & Transcribe
        </button>
      </div>

      {audioURL && (
        <div style={{ marginBottom: 12 }}>
          <audio controls src={audioURL} />
        </div>
      )}

      <div>
        <strong>Transcription:</strong>
        <div
          style={{
            whiteSpace: "pre-wrap",
            marginTop: 8,
            minHeight: 40,
            border: "1px solid #ddd",
            padding: 8,
          }}
        >
          {loading ? "Transcribing..." : transcription || "No transcription yet."}
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function mergeBuffers(buffers) {
  let length = buffers.reduce((acc, b) => acc + b.length, 0);
  let result = new Float32Array(length);
  let offset = 0;
  for (let b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

function downsampleBuffer(buffer, originalSampleRate, targetSampleRate) {
  if (targetSampleRate === originalSampleRate) return buffer;
  const sampleRateRatio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    // average the samples between offsets (simple anti-aliasing)
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function normalizeBuffer(buffer) {
  let max = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = Math.abs(buffer[i]);
    if (v > max) max = v;
  }
  if (max === 0) return buffer;
  const norm = new Float32Array(buffer.length);
  const factor = 0.98 / max; // leave some headroom
  for (let i = 0; i < buffer.length; i++) norm[i] = buffer[i] * factor;
  return norm;
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    output.setInt16(offset, s, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sampleRate * blockAlign) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channels * bytesPerSample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return new Blob([view], { type: "audio/wav" });
}
