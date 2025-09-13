🎙️ Speech-to-Text App

A web application that converts speech into text using Flask (backend), React (frontend), and a Deep Learning model (Whisper/Wav2Vec2).
Supports both file uploads and live microphone recording.

🚀 Features
🎤 Upload audio files (WAV/MP3) for transcription
🎙️ Record audio live in the browser and transcribe
🔥 Powered by OpenAI Whisper / HuggingFace Wav2Vec2
⚡ Frontend in React + TailwindCSS
🐍 Backend in Flask (Python)
🌐 CORS enabled for smooth frontend-backend communication


speech-to-text-app/
│
├── backend/               # Flask server + Deep Learning model
│   ├── app.py
│   ├── requirements.txt
│   └── uploads/           # Stores uploaded audio files
│
├── frontend/              # React app (UI)
│   ├── src/
│   ├── package.json
│   └── tailwind.config.js
│
├── .gitignore
└── README.md



🛠️ Installation & Setup
1️⃣ Clone the repo
git clone https://github.com/YOUR_USERNAME/speech-to-text-app.git
cd speech-to-text-app

2️⃣ Backend (Flask + Python)
cd backend

# create virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\activate

# or (Mac/Linux)
python3 -m venv .venv
source .venv/bin/activate

# install dependencies
pip install -r requirements.txt

# run Flask server
python app.py

Backend runs on: http://127.0.0.1:5000

3️⃣ Frontend (React + TailwindCSS)
cd frontend

# install dependencies
npm install

# start dev server
npm start

Frontend runs on: http://localhost:3000


🎯 Usage

Start backend (python app.py)
Start frontend (npm start)
Open browser → http://localhost:3000
Choose an option:
Upload an audio file → Get transcription
Record live → Get transcription



📌 Requirements

Python 3.8+
Node.js (v18+)
Flask, Flask-CORS
Whisper / Wav2Vec2 (Hugging Face Transformers, Torch)


📖 Notes

The first transcription may take longer (model load time).
Accuracy depends on the audio quality and language.
By default, Whisper detects language automatically.


🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you’d like to change.


📜 License
MIT License
