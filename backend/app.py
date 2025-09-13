from flask import Flask, request, jsonify
from flask_cors import CORS   # 👈 Import CORS
import whisper
import os

# Initialize Flask
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Load Whisper model once (can be "tiny", "base", "small", "medium", or "large")
model = whisper.load_model("base")

@app.route("/transcribe", methods=["POST"])
def transcribe():
    # Check if file exists in request
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    # Get the uploaded audio file
    audio_file = request.files["file"]

    # Save temporarily
    audio_path = "temp_audio.wav"
    audio_file.save(audio_path)

    # Run Whisper transcription
    try:
        result = model.transcribe(audio_path)
        text = result["text"]
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up temp file
        if os.path.exists(audio_path):
            os.remove(audio_path)

    # Return transcription as JSON
    return jsonify({"text": text})


if __name__ == "__main__":
    # host=0.0.0.0 makes it accessible via localhost too
    app.run(debug=True, host="0.0.0.0", port=5000)
