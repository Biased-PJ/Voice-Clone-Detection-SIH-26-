<div align="center">

# 🛡️ Team Rocket — AI Voice Clone & Scam Call Detection

### Smart India Hackathon 2026 · Problem Statement **SIH26104**

**Real-time detection of AI-cloned voices and conversational fraud in phone calls — built to protect people from deepfake voice scams.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Frontend-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TensorFlow](https://img.shields.io/badge/ML-TensorFlow_2.15-FF6F00?logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-Unspecified-lightgrey)](#-license)
[![Live Demo](https://img.shields.io/badge/Live_Demo-AWS-FF9900?logo=amazonaws&logoColor=white)](https://65.2.63.9/)

**🔴 Live Deployment on AWS:** [https://65.2.63.9/](https://65.2.63.9/)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [How Detection Works](#-how-detection-works)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
- [API Reference](#-api-reference)
- [Frontend Application Walkthrough](#-frontend-application-walkthrough)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Multilingual Scam Scoring Engine](#-multilingual-scam-scoring-engine)
- [Risk Scoring Model](#-risk-scoring-model)
- [Authentication & Security](#-authentication--security)
- [Database Schema](#-database-schema-mongodb)
- [Deployment](#-deployment)
- [Running Locally (Why the Free-Tier Deploy Fails)](#-running-locally-why-the-free-tier-deploy-fails)
- [Roadmap](#-roadmap)
- [Team](#-team)
- [License](#-license)

---

## 🧭 Overview

**Team Rocket** is a full-stack web platform built for **Smart India Hackathon 2026 (SIH26104)** that detects **AI-generated / cloned voices** and **conversational scam intent** in real time, over both **live phone-style calls** and **uploaded audio recordings**.

As voice-cloning tools (ElevenLabs, RVC, XTTS, and similar) become trivially easy to use, fraudsters are increasingly impersonating relatives, bank officials, and government representatives using synthetic voices to run financial scams. Team Rocket combines **acoustic deepfake detection**, **multilingual conversational fraud analysis**, and **automatic speech transcription** into a single, unified risk score — giving everyday users and call-center/security teams a way to catch a scam *while it's happening*, not after the money is gone.

---

## 🎯 Problem Statement

> **SIH26104 — AI-based solution for detection of AI-generated fake/spoofed voices in calls, and identification of fraudulent intent in real time.**

Voice cloning technology can now convincingly mimic a specific person's voice from just a few seconds of sample audio. This is actively being weaponized for:

- Impersonating family members in "emergency" scams asking for urgent money transfers.
- Fake bank/KYC verification calls requesting OTPs, PINs, or card details.
- Government-impersonation threats (police, tax authorities) demanding immediate payment.
- Lottery, refund, parcel-customs, and job-offer fraud pretexts.

Existing spam-call blockers only look at the **caller ID / number**, not the **voice itself** or the **content of the conversation**. There is no accessible, real-time, multilingual tool that fuses *acoustic* deepfake detection with *linguistic* scam-intent detection to produce one actionable risk verdict.

---

## 💡 Our Solution

Team Rocket is a **two-signal fusion system**:

| Signal | What it measures | How |
|---|---|---|
| **Score 1 — Synthetic Voice Probability** | Is this voice AI-generated / cloned rather than a real human speaker? | A trained deep neural network analyzes mel-spectrogram features of 2-second audio clips. |
| **Score 2 — Scam Intent Score** | Does the *content* of the conversation match known fraud patterns? | A deterministic, rule-based multilingual NLP engine (optionally boosted by Gemini) scans the live transcript for financial/urgency/authentication red flags. |

These two independent signals — plus speaker-match confidence and keyword-based conversational risk — are fused by a **risk engine** into a single **0–100 risk score**, a **LOW / MEDIUM / HIGH / CRITICAL** risk level, human-readable **risk factors**, and an actionable **suggestion** ("Do not approve the transaction. Verify the caller independently.", etc.), all surfaced to the user **live, while the call is still happening**.

---

## ✨ Key Features

- 🎙️ **Live Call Analysis** — Stream microphone/call audio over a WebSocket; get rolling 2-second-window risk updates as the conversation unfolds, with a live transcript, live scam-keyword flags, and a running risk verdict.
- 📁 **Recorded Audio Analysis** — Upload a WAV/MP3/FLAC/WebM recording and get a full forensic breakdown: synthetic-voice probability, per-clip confidence scores, transcript, scam score, and a downloadable PDF report.
- 🧠 **Dual-Signal Risk Fusion** — Combines acoustic deepfake detection with linguistic scam-pattern detection instead of relying on either signal alone.
- 🌐 **Multilingual Scam Detection** — Deterministic fraud-pattern rules engine covering **English, Hindi, Hinglish, Bengali, Marathi, Telugu, and Tamil**, so detection works beyond just English-language calls.
- 🗺️ **Simulated Threat Location Mapping** — Deterministically derives a stable, presentation-friendly geographic marker per call session for the dashboard's threat map (clearly labeled as simulated, not real caller geolocation).
- 📊 **Call Intelligence Dashboard** — A searchable, filterable history of every analyzed call with conclusions, transcripts, caught-flags, and forensic detail views.
- 🔐 **Full Authentication System** — Email/password signup & login (bcrypt-hashed passwords, JWT sessions) plus Google OAuth sign-in.
- 👮 **Role-Based Access** — Admin accounts (configured via `ADMIN_EMAILS`) can view all users' call history and seeded demo data; regular users only see their own.
- 🔄 **Self-Improving Model (optional)** — An opt-in on-device replay-buffer fine-tuning loop lets the DNN adapt to high-confidence predictions over time (disabled by default for stability).
- 📄 **PDF Report Generation** — One-click forensic PDF export of any analyzed call for record-keeping or escalation.
- 🖥️ **Modern, Responsive Dashboard UI** — Built with React 19 + TypeScript + Tailwind CSS, featuring live oscilloscopes, spectrogram waterfalls, radar sweep visualizations, and an India-focused threat map.

---

## 🔍 How Detection Works

```
                         ┌───────────────────────────┐
                         │        Audio Input        │
                         │ (Mic stream / File upload)│
                         └──────────────┬────────────┘
                                        │
                     ┌──────────────────┼──────────────────┐
                     ▼                                     ▼
         ┌───────────────────────┐              ┌────────────────────────┐
         │  FFmpeg Normalization │              │  Speech-to-Text (STT)  │
         │  → 16kHz mono PCM WAV │              │ faster-whisper (base)  │
         └───────────┬───────────┘              └────────────┬───────────┘
                     ▼                                       ▼
       ┌─────────────────────────────┐          ┌────────────────────────────┐
       │  Mel-Spectrogram Features   │          │      Transcript Text       │
       │  (2-second clip windows)    │          └────────────┬───────────────┘
       └───────────────┬─────────────┘                       ▼
                       ▼                          ┌────────────────────────────┐
       ┌─────────────────────────────┐            │  Multilingual Scam Rules   │
       │   DNN: AI-vs-Real Voice     │            │  Engine (7 languages)      │
       │   Classifier (Keras/TF)     │            │ + optional Gemini scoring  │
       └───────────────┬─────────────┘            └────────────┬───────────────┘
                       ▼                                       ▼
              synthetic_probability                        scam_score (0–100)
              speaker_match_probability                     + reasons[]
                       │                                          │
                       └───────────────┬──────────────────────────┘
                                       ▼
                         ┌───────────────────────────┐
                         │       Risk Engine         │
                         │  fuses both signals into: │
                         │  risk_score, risk_level,  │
                         │  risk_factors, suggestion │
                         └──────────────┬────────────┘
                                        ▼
                         ┌────────────────────────────┐
                         │ Live/Final API Response    │
                         │ → Dashboard + Call History │
                         └────────────────────────────┘
```

---

## 🏗️ System Architecture

Team Rocket is a classic **decoupled full-stack architecture**:

- **Frontend (React + TypeScript + Vite)** — Single-page application that handles capture (microphone via `MediaRecorder`), file uploads, live WebSocket streaming, and rendering of all dashboards/visualizations.
- **Backend (FastAPI, Python 3.11)** — Stateless REST + WebSocket API that performs authentication, orchestrates ML inference, speech-to-text, scam scoring, and risk fusion, and persists results.
- **Database (MongoDB, via Motor async driver)** — Stores users, call sessions, and analysis results.
- **ML Layer (TensorFlow/Keras DNN + faster-whisper)** — Runs in-process inside the FastAPI backend; no separate model-serving microservice is required for the current deployment.
- **FFmpeg** — Used as a universal audio-decoding layer so that any browser-recorded (WebM/Opus) or uploaded (MP3/FLAC/WAV) audio can be normalized to 16 kHz mono PCM before feature extraction.

```
┌───────────────────────┐        REST / WebSocket        ──────────────────────────        Motor (async)         ┌───────────┐
│   React Frontend      │  ───────────────────────────▶ │   FastAPI Backend       │  ─────────────────────────▶ │  MongoDB  │
│  (Vite, TS, Tailwind) │ ◀───────────────────────────  │  (auth, ML, STT, risk)  │ ◀─────────────────────────  │  (Atlas)  │
└───────────────────────┘         JSON / streaming       ──────────┬───────────────                              └───────────┘
                                                                   │
                                                    ┌──────────────┼──────────────┐
                                                    ▼              ▼              ▼
                                            TensorFlow DNN   faster-whisper     FFmpeg
                                          (voice-clone model)     (STT)      (audio decode)
```

---

## 🧰 Tech Stack

### Backend
| Category | Technology |
|---|---|
| Framework | [FastAPI](https://fastapi.tiangolo.com/) (async, Python 3.11) |
| Server | Uvicorn (standard) |
| Database | MongoDB via `motor` (async) / `pymongo` |
| Auth | `python-jose` (JWT), `passlib[bcrypt]`, Google OAuth (`google-auth`) |
| ML / Audio | TensorFlow 2.15 (Keras Sequential DNN), `librosa`, `soundfile`, `h5py`, NumPy |
| Speech-to-Text | `faster-whisper` (Whisper "base" model, CPU int8) |
| Optional NLP | `google-generativeai` (Gemini, opt-in) |
| Audio decoding | FFmpeg (subprocess-based transcoding) |
| Config | `python-dotenv` |

### Frontend
| Category | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animation | `motion` (Framer Motion successor) |
| Icons | `lucide-react` |
| Auth | `@react-oauth/google`, `jwt-decode` |
| PDF export | `jspdf` |
| Extras | `canvas-confetti` |

---

## 📂 Repository Structure

```
Voice-Clone-Detection-SIH-26/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app entrypoint, CORS, routers
│   │   ├── database.py                # MongoDB (Motor) connection
│   │   ├── dependencies.py            # JWT-based auth dependencies
│   │   ├── schemas.py                 # Pydantic request/response models
│   │   ├── api/
│   │   │   ├── analyse.py             # /api/v1/analyze/* (batch + live WebSocket)
│   │   │   ├── auth.py                # /api/v1/auth/* (register/login/Google)
│   │   │   └── calls.py               # /api/v1/calls/* (session + history)
│   │   ├── services/
│   │   │   ├── ml_service.py          # DNN voice-clone inference + FFmpeg decode
│   │   │   ├── speech_to_text.py      # faster-whisper transcription
│   │   │   ├── scam_score_service.py  # Multilingual rules engine (+ optional Gemini)
│   │   │   ├── risk_engine.py         # Fuses ML + scam score → final risk verdict
│   │   │   ├── suggestion_engine.py   # Risk-level → recommended action text
│   │   │   ├── location_service.py    # Deterministic simulated threat location
│   │   │   └── auth_service.py        # Password hashing + JWT issuing/verifying
│   │   └── ml_assets/
│   │       ├── ai_vs_real_voice_dnn_weights.h5   # Trained DNN weights
│   │       └── replay_buffer.npz                 # Replay buffer for self-update
│   ├── scripts/
│   │   ├── seed_demo_calls.py         # Seeds admin-only demo call history
│   │   └── demo_calls.json            # Demo dataset
│   ├── requirements.txt
│   └── runtime.txt                    # Python 3.11.11
│
└── frontend/
    ├── src/
    │   ├── App.tsx                    # Root app / view router
    │   ├── main.tsx
    │   ├── components/
    │   │   ├── Dashboard.tsx          # Main authenticated dashboard
    │   │   ├── LiveAnalysisPage.tsx   # Live mic/call analysis UI
    │   │   ├── RecordedAnalysisPage.tsx # Upload & analyze recordings
    │   │   ├── CallIntelligencePage.tsx # Call history / forensic detail view
    │   │   ├── AuthModal.tsx          # Login / signup / Google OAuth modal
    │   │   ├── FiveCheckpoints.tsx, FeatureCards.tsx, Header.tsx, Footer.tsx, ...
    │   │   ├── dashboard/              # Threat map, oscilloscope, radar widgets
    │   │   ├── live-analysis/          # Live waveform, spectrogram, biometric widgets
    │   │   ├── recorded-analysis/      # Recorded waveform player
    │   │   ├── common/                 # Shared sidebar, etc.
    │   │   └── backgrounds/            # Ambient page backgrounds
    │   ├── context/ThemeContext.tsx   # Light/dark theme provider
    │   ├── data/callIntelligenceData.ts
    │   ├── utils/
    │   │   ├── api.ts                 # Typed API client (REST + WebSocket)
    │   │   ├── audioAnalyzer.ts       # Client-side waveform helpers
    │   │   ├── config.ts              # Env-driven config (Google client ID, etc.)
    │   │   └── pdfGenerator.ts        # Client-side PDF report generation
    │   └── types.ts
    ├── package.json
    └── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11** (see `backend/runtime.txt`)
- **Node.js 18+** and npm (or Bun, since a `bun.lock` is present)
- **MongoDB** instance — local (`mongodb://localhost:27017`) or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **FFmpeg** installed and available on `PATH` (required for decoding browser-recorded WebM/Opus audio and for Whisper transcription)
- *(Optional)* A **Google OAuth Client ID** if you want Google sign-in
- *(Optional)* A **Gemini API key** if you want to enable LLM-assisted scam scoring

---

### Backend Setup

```bash
# 1. Navigate to the backend
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create a .env file (see "Environment Variables" below)
cp .env.example .env            # if present, otherwise create manually

# 5. Run the API server
uvicorn app.main:app --reload --port 8000
```

The API will be live at **`http://localhost:8000`**, with interactive docs at **`http://localhost:8000/docs`**.

> **Note:** On first import, `ml_service.py` builds the Keras model architecture and loads pretrained weights from `app/ml_assets/ai_vs_real_voice_dnn_weights.h5`. If TensorFlow/librosa aren't installed correctly, the service degrades gracefully to a neutral 50% placeholder score rather than crashing — check your backend logs for `ML_AVAILABLE` warnings.

**Optional — seed demo call data (admin dashboard):**
```bash
cd backend
python -m scripts.seed_demo_calls
```

---

### Frontend Setup

```bash
# 1. Navigate to the frontend
cd frontend

# 2. Install dependencies
npm install          # or: bun install

# 3. Create a .env.local file (see below)

# 4. Run the dev server
npm run dev
```

The app will be live at **`http://localhost:3000`** (configured in `package.json` to run on port 3000, host `0.0.0.0`).

**Other frontend scripts:**
```bash
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview the production build locally
npm run lint      # TypeScript type-check (tsc --noEmit)
npm run clean     # Remove dist/ and server.js
```

---

### Environment Variables

**Backend (`backend/.env`):**

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `DB_NAME` | ⛔ (default `my_database`) | Database name |
| `JWT_SECRET` | ✅ | Secret key used to sign JWTs |
| `JWT_ALGORITHM` | ⛔ (default `HS256`) | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | ⛔ (default `1440`) | Access token lifetime |
| `ADMIN_EMAILS` | ⛔ | Comma-separated list of emails granted the `admin` role |
| `CORS_ALLOWED_ORIGINS` | ⛔ | Extra comma-separated origins allowed beyond the localhost defaults |
| `GOOGLE_CLIENT_ID` | ⛔ | Enables Google OAuth login verification |
| `ENABLE_GEMINI_SCORING` | ⛔ (default `false`) | Set `true` to enable Gemini-assisted scam scoring |
| `GEMINI_API_KEY` | ⛔ | Required only if Gemini scoring is enabled |
| `GEMINI_MODEL` | ⛔ (default `gemini-1.5-flash`) | Gemini model name |
| `ENABLE_SELF_UPDATE` | ⛔ (default `false`) | Set `true` to enable in-memory DNN self-fine-tuning on high-confidence predictions |

**Frontend (`frontend/.env.local`):**

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ⛔ | Backend base URL (defaults to the deployed Render URL in `utils/api.ts`; set to `http://localhost:8000` for local dev) |
| `VITE_GOOGLE_CLIENT_ID` | ⛔ | Enables the "Sign in with Google" button |

---

## 📡 API Reference

### Authentication — `/api/v1/auth`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user (name, email, password) |
| `POST` | `/api/v1/auth/login` | Log in with email/password → returns JWT |
| `GET` | `/api/v1/auth/google/status` | Check whether Google OAuth is configured server-side |
| `POST` | `/api/v1/auth/google` | Exchange a Google ID token for a Team Rocket JWT |
| `GET` | `/api/v1/auth/me` | Get the authenticated user's profile & role (authoritative source for admin gating) |

### Call Sessions — `/api/v1/calls`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/calls/start` | Start a new live call session, returns a `session_id` |
| `GET` | `/api/v1/calls/{session_id}` | Fetch one call session (owner or admin only) |
| `POST` | `/api/v1/calls/{session_id}/end` | End a session; idempotently finalizes exactly one analysis record |
| `GET` | `/api/v1/calls` | List all analysis results + call sessions for the current user (or all users, if admin) |

### Analysis — `/api/v1/analyze`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/analyze/audio` | Batch-analyze an uploaded audio file (`multipart/form-data`: `session_id`, `language`, `file`) → returns full `AnalyzeResponse` |
| `WS` | `/api/v1/analyze/live` | WebSocket for live streaming analysis. Query params: `token`, `session_id`, `language`. Sends binary audio chunks; receives rolling `analysis` messages and a final `final` message on `{"type":"finalize"}` |

**Example `AnalyzeResponse`:**
```json
{
  "session_id": "b3f1e2b0-...",
  "language": "en",
  "risk_score": 78,
  "risk_level": "HIGH",
  "synthetic_probability": 0.91,
  "speaker_match_probability": 0.09,
  "ai_voice_percent": 91.0,
  "scam_score": 65,
  "risk_factors": [
    "High synthetic voice probability",
    "Speaker identity mismatch",
    "Suspicious financial or authentication language"
  ],
  "suggestion": "Perform secondary verification before proceeding.",
  "threat_location": {
    "city": "Bengaluru",
    "latitude": 12.9701,
    "longitude": 77.5978,
    "simulated": true
  }
}
```

---

## 🖥️ Frontend Application Walkthrough

1. **Landing Page** — Product overview, feature highlights, and the "Five Checkpoints" of detection, with sign-up/login entry points.
2. **Dashboard** — Post-login home: quick actions (start live call, upload recording), recent call summaries, and navigation to every module.
3. **Live Analysis** — Starts a call session, streams microphone audio to the backend over WebSocket, and renders a live waveform/oscilloscope, live transcript, live risk gauge, and scam-flag callouts as the call progresses; ends with a finalized verdict.
4. **Recorded Analysis** — Upload an audio file (or pick a bundled sample), see a waveform player, full transcript, synthetic-voice/scam scores, risk factors, and a "Download PDF Report" action.
5. **Call Intelligence** — Searchable/filterable history of every analyzed call (live + recorded) with a detailed forensic inspector view per call, including caught flags and full transcripts.
6. **Auth Modal** — Email/password login & signup, plus "Sign in with Google" (shown only when `VITE_GOOGLE_CLIENT_ID` / backend `GOOGLE_CLIENT_ID` are configured).

---

## 🤖 Machine Learning Pipeline

**Model:** A compact fully-connected DNN (Keras `Sequential`):

```
Input(flattened log-mel spectrogram)
 → Dense(64, relu) → Dropout(0.3)
 → Dense(32, relu) → Dropout(0.2)
 → Dense(1, sigmoid)   # synthetic_probability
```

**Feature extraction pipeline** (`ml_service.py`):
1. Decode incoming audio (direct `librosa.load`, falling back to an **FFmpeg subprocess** transcode for browser WebM/Opus).
2. Resample to **16 kHz mono**.
3. Split into **2-second clips** (zero-padded if the recording is shorter).
4. Compute a **40-band mel-spectrogram** (`n_fft=512`, `hop_length=256`) per clip.
5. Convert to log scale (`power_to_db`) and **z-score normalize**.
6. Flatten and batch-feed all clips through the DNN.
7. Average per-clip probabilities → `synthetic_probability`; `speaker_match_probability = 1 − synthetic_probability`; confidence is derived from the **standard deviation across clips** (low variance = high confidence).

**Graceful degradation:** if TensorFlow/librosa fail to import or model weights fail to load, `analyze_voice()` returns a neutral 50/50 placeholder instead of crashing the API — so the rest of the pipeline (transcription, scam scoring) still functions.

**Optional self-update loop** (`ENABLE_SELF_UPDATE=true`): when a prediction is extremely confident (≥ 0.95 fake or ≤ 0.05 real), the model performs a tiny single-epoch fine-tuning step using the new sample mixed with a **replay buffer** (`replay_buffer.npz`) of past examples — a lightweight defense against catastrophic forgetting. This is disabled by default in production for predictability.

---

## 🌐 Multilingual Scam Scoring Engine

`scam_score_service.py` implements a **fully deterministic, offline-first rules engine** (no external API dependency by default) that scans the call transcript for fraud-indicative language across **seven languages/registers**:

- 🇬🇧 English
- 🇮🇳 Hindi (Devanagari)
- 🇮🇳 Hinglish (Romanized Hindi)
- 🇧🇩 Bengali
- 🇮🇳 Marathi
- 🇮🇳 Telugu
- 🇮🇳 Tamil

Each language has a matching set of regex rules covering categories such as:
- OTP / verification-code requests
- PIN / password / credential requests
- Money-transfer & UPI payment requests
- Bank-account / KYC pressure tactics
- Artificial urgency
- High-risk payment methods (gift cards, crypto)
- Sensitive financial data requests (card numbers, CVV)
- Secrecy requests ("don't tell anyone")
- Threats / legal intimidation (police, arrest, fines)
- Common fraud pretexts (lottery, refund, parcel/customs, job offers)

Each matched rule contributes weighted points to a **0–100 scam score**, with a bonus for transcripts matching **3+** or **5+** distinct rule categories (compounding suspicion). An optional **Gemini LLM layer** (`ENABLE_GEMINI_SCORING=true`) can additionally classify the transcript and is combined via `max(local_score, gemini_score)` — but the system is designed to be fully functional and reliable **without** any external LLM call.

---

## ⚖️ Risk Scoring Model

`risk_engine.py` fuses everything into one final verdict:

```
risk_score = (synthetic_probability × 60)
           + ((1 − speaker_match_probability) × 10)
           + (scam_score × 0.30)
           + min(8, financial_keyword_hits × 2)
```

| Risk Score | Risk Level |
|---|---|
| 0–30 | 🟢 LOW |
| 31–60 | 🟡 MEDIUM |
| 61–80 | 🟠 HIGH |
| 81–100 | 🔴 CRITICAL |

The engine also derives human-readable **risk factors** (e.g. *"High synthetic voice probability"*, *"Speaker identity mismatch"*, *"Suspicious financial or authentication language"*) and a **plain-language suggestion** via `suggestion_engine.py`:

- **CRITICAL** → *"Do not approve the transaction. Verify the caller independently."*
- **HIGH** → *"Perform secondary verification before proceeding."*
- **LOW / MEDIUM** → *"Proceed with standard verification."*

The `analyse.py` API layer additionally computes a plain-English **conclusion** label (e.g. *"HIGH-RISK AI VOICE SCAM"*, *"LIKELY CLONED / SYNTHETIC VOICE"*, *"LIKELY SCAM — HUMAN VOICE POSSIBLE"*, *"SUSPICIOUS CALL — VERIFY BEFORE TRUSTING"*, *"LIKELY SAFE / NO STRONG THREAT DETECTED"*) by combining the AI-voice percentage, scam score, and overall risk score.

---

## 🔐 Authentication & Security

- **Password storage:** bcrypt hashing via `passlib` (never stored in plaintext).
- **Sessions:** stateless JWT bearer tokens (`python-jose`), configurable expiry (`JWT_EXPIRE_MINUTES`, default 24h).
- **Google OAuth:** ID tokens are verified server-side against Google's public keys (`google-auth`) before a first-party JWT is issued — the Google credential itself is never trusted directly by protected routes.
- **Role-based access:** a user's `role` (`user` / `admin`) is determined server-side from `ADMIN_EMAILS` and is the **single source of truth** — `GET /api/v1/auth/me` is the authoritative endpoint the frontend calls after login rather than trusting any client-stored role field.
- **Session ownership checks:** all call-session and analysis endpoints verify that `user_id` matches the requester (or that the requester is an admin) before returning data.
- **CORS:** explicit allow-list of origins (`localhost:3000/5173` by default, extendable via `CORS_ALLOWED_ORIGINS`).

---

## 🗄️ Database Schema (MongoDB)

**`users`**
```
{ user_id, name, email, password (bcrypt, email-provider only),
  provider: "email" | "google", role: "user" | "admin", avatar? }
```

**`call_sessions`**
```
{ session_id, user_id, language, status: "active" | "ended",
  started_at, ended_at, duration_seconds, risk_score, risk_level,
  synthetic_probability, speaker_match_probability, ai_voice_percent,
  scam_score, risk_factors[], suggestion, transcript, conclusion,
  threat_location, analysis_completed }
```

**`analysis_results`**
```
{ session_id, user_id, language, risk_score, risk_level,
  synthetic_probability, speaker_match_probability, ai_voice_percent,
  scam_score, risk_factors[], suggestion, threat_location, transcript,
  file_name, created_at, analysis_type: "recorded" | "live",
  live_final: bool, conclusion, duration_seconds, scam_reasons[] }
```

**`calls`** — demo/seed dataset (`is_demo: true`) visible only to admin accounts, sourced from `frontend/src/data/callIntelligenceData.ts` via `backend/scripts/seed_demo_calls.py`.

---

## ☁️ Deployment

**Live on AWS:** [https://65.2.63.9/](https://65.2.63.9/)

The project is deployed end-to-end on an **AWS EC2** instance:

- **Backend:** FastAPI app served on the EC2 instance (ASGI server behind the box's networking), with **FFmpeg** installed on the host image since both the ML and STT pipelines depend on it.
- **Frontend:** Production build (`npm run build`, Vite) served from the same instance, with `VITE_API_BASE_URL` pointed at the deployed backend.
- **Database:** MongoDB (Atlas or self-hosted) reachable from the instance via `MONGO_URI`.
- **Access:** The app is currently served over HTTPS on a self-signed/IP-based certificate at `https://65.2.63.9/` — browsers will show a certificate warning; proceed past it (or click "Advanced → Proceed") to reach the app, since the deployment does not yet have a domain name or a CA-signed certificate.

> ⚠️ This is a hackathon demo deployment on a bare IP address — a proper domain name and a CA-issued TLS certificate (e.g. via Let's Encrypt) are on the roadmap before any production use.

---

## 🖥️ Running Locally (Why the Free-Tier Deploy Fails)

> **Known issue:** The backend is functionally correct but **will not boot on Render's free instance tier**. Render's free web services are capped at **512 MB RAM**, while this backend's resident memory footprint is roughly **~1 GB** once loaded — mainly TensorFlow 2.15 (~400–600 MB just to import), the Keras DNN weights, and the `faster-whisper` "base" model plus its CTranslate2 runtime, all held in memory simultaneously inside one Uvicorn worker. On boot, the OS OOM-killer terminates the process (or Render reports the service as "unhealthy"/crashing) before `uvicorn` ever finishes starting — so the frontend's requests to the Render URL time out or get connection-refused, even though nothing in the code is broken. This is a **memory ceiling problem, not a bug**.
>
> Running everything **locally** (or on a paid instance / any host with ≥ 2 GB RAM) sidesteps this entirely, since your machine's RAM is not capped at 512 MB. Below is the exact local workflow with `.env` files.

### 1. Clone and lay out the two `.env` files

```bash
git clone https://github.com/<your-org>/Voice-Clone-Detection-SIH-26.git
cd Voice-Clone-Detection-SIH-26
```

**Create `backend/.env`:**
```env
# --- Required ---
MONGO_URI=mongodb://localhost:27017
JWT_SECRET=replace-with-a-long-random-string

# --- Optional (safe defaults shown) ---
DB_NAME=voice_clone_db
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
ADMIN_EMAILS=you@example.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
GOOGLE_CLIENT_ID=
ENABLE_GEMINI_SCORING=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
ENABLE_SELF_UPDATE=false
```

**Create `frontend/.env.local`:**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=
```

`VITE_API_BASE_URL` is the important one — it overrides the hardcoded Render fallback in `utils/api.ts` and points the frontend at your local backend instead.

### 2. Run MongoDB locally

Easiest path is a local Mongo container so you don't need `MONGO_URI` to point at Atlas:

```bash
docker run -d --name voice-clone-mongo -p 27017:27017 mongo:7
```

(If you'd rather keep using Atlas, just leave `MONGO_URI` in `backend/.env` pointed at your Atlas connection string — that works fine locally too, it's only Render's compute that's memory-capped, not Atlas.)

### 3. Install FFmpeg

```bash
# Ubuntu/Debian
sudo apt-get install -y ffmpeg

# macOS
brew install ffmpeg

# Windows
choco install ffmpeg
```

Confirm it's on `PATH`: `ffmpeg -version`.

### 4. Start the backend (loads env from `backend/.env` automatically via `python-dotenv`)

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Give it a moment on first boot — TensorFlow import + Keras weight load + the `faster-whisper` base model download/load is the slow part (this is exactly the ~1 GB footprint that Render's free tier can't hold). Once you see Uvicorn's "Application startup complete", check `http://localhost:8000/docs`.

### 5. Start the frontend (loads env from `frontend/.env.local` automatically via Vite)

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. Because `VITE_API_BASE_URL=http://localhost:8000`, all REST calls and the `/api/v1/analyze/live` WebSocket now hit your local backend instead of the (crashing) Render deployment.

### 6. If you still want it hosted, not just local

Render's **free** tier is the actual blocker, not Render itself — any of these fix it without touching code:
- Upgrade to a **Render paid instance** with ≥ 1 GB (ideally 2 GB) RAM.
- Deploy the backend on **Railway**, **Fly.io**, or a small **VPS/Docker host** with ≥ 2 GB RAM instead.
- Split the deploy: keep the lightweight parts (auth, scam-rules engine) on free-tier compute, and move only `ml_service.py`'s TF/whisper inference to a separate, adequately-sized instance or GPU/CPU endpoint, called over HTTP from the main API.
- Swap `faster-whisper base` for the smaller `tiny` model and/or lazy-load TensorFlow only on first `/analyze` request (rather than at import time) to shave peak memory — reduces but does not eliminate the risk of crossing 512 MB.

---

## 🗺️ Roadmap

- [ ] Real-time carrier/telephony integration (SIP/PSTN bridge) instead of browser-only microphone capture
- [ ] Speaker-embedding-based voiceprint matching against a known-contacts registry
- [ ] Expanded language coverage for the scam-rules engine
- [ ] Push/SMS alerting for CRITICAL-risk live calls
- [ ] Model upgrade path to a spectrogram-CNN or self-supervised (wav2vec-style) backbone for higher accuracy
- [ ] Dockerized one-command local deployment (backend + frontend + MongoDB)

---

## 👥 Team

Built by **Team Rocket** for **Smart India Hackathon 2026**, Problem Statement **SIH26104** — AI-based detection of spoofed/cloned voices and fraudulent call intent.

| Name | Role |
|:---:|:---:|
| Parth Jain | Team Lead & Frontend Architect |
| Tushar Tanwar | Backend & Cloud Infrastructure Engineer |
| Akshay Singh Bchehhat | AI/ML Engineer — Voice Detection |
| Ichha Poddar | Associate Backend Engineer |
| Prachi Verma | Public Relations |
| Amishi Prasad | Tester |

---

<div align="center">

**⚠️ Disclaimer:** Team Rocket is a hackathon prototype built for demonstration purposes. The DNN model, scam-scoring rules, and simulated threat-location feature are **not** production-grade fraud-detection guarantees and should not be solely relied upon for real-world financial or legal decisions.

</div>
