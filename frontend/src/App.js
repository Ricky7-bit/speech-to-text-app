import React, { useState, useRef } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // -------------------------------
  // Handle File Selection
  // -------------------------------
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // -------------------------------
  // Upload Button Click
  // -------------------------------
  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setTranscription(data.text || data.error || "Error in transcription");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file");
    }
  };

  // -------------------------------
  // Live Recording
  // -------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", blob, "recording.wav");

        try {
          const response = await fetch("http://localhost:5000/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          setTranscription(data.text || data.error || "Error in transcription");
        } catch (err) {
          console.error("Recording error:", err);
          alert("Failed to transcribe recording");
        }
      };

      recorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🎤 Speech-to-Text App
        </h1>

        {/* Upload Section */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2 text-gray-700">
            Upload an audio file
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-600
                       hover:file:bg-indigo-100"
          />
          <button
            onClick={handleUpload}
            className="mt-3 w-full px-6 py-3 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition"
          >
            Upload & Transcribe
          </button>
        </div>

        <hr className="my-6" />

        {/* Recording Section */}
        <div className="mb-6 text-center">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-6 py-3 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition"
            >
              🎙️ Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
            >
              ⏹️ Stop Recording
            </button>
          )}
        </div>

        {/* Transcription Output */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            📝 Transcription:
          </h2>
          <p className="text-gray-800 whitespace-pre-wrap">
            {transcription || "No transcription yet..."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
