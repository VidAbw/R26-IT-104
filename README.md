# Group 104 - Child Safety Ecosystem

Welcome to the **Child Safety Ecosystem**, a comprehensive platform designed to provide intelligent monitoring, real-time alerts, and legal guidance to ensure child safety. This project is built using an Expo (React Native) frontend, a FastAPI backend for AI model processing, and Supabase for real-time database and authentication.

## 🌟 Project Overview

The Child Safety Ecosystem integrates AI-driven computer vision and audio analysis to detect potential child abuse or environmental hazards. It provides a Nanny Cam dashboard for parents, offering peace of mind through constant monitoring and intelligent alerts.

### Core Architecture
- **Frontend**: React Native with Expo, utilizing file-based routing.
- **Backend Services**: FastAPI handling YOLOv8 and MediaPipe for threat detection, and audio processing algorithms.
- **Database & Auth**: Supabase handles secure authentication and real-time syncing of threat alerts.

---

## 🚀 Key Features by Branch

This repository contains multiple feature branches developed by our team members. Below is a summary of the specialized modules available in their respective branches:

### 👩‍💻 Malithi's Branch
**Focus**: Legal Guidance & Parent Profiles
- **Legal RAG System (Retrieval-Augmented Generation)**: An AI-driven module providing specific legal guidance on child abuse incidents.
- **Bilingual Support**: Fully supports English and Sinhala (`si`) queries.
- **Legal Guidance UI**: Dedicated screens for parents to query the AI, receive decision roadmaps, and read relevant laws.
- **Parent Profile**: UI for managing parent details, including an image picker and state store management.

### 👨‍💻 Vidusha's Branch
**Focus**: Guardian Dashboard & Audio Threat Detection
- **Guardian Dashboard**: A real-time monitoring interface that connects directly to the FastAPI server and Supabase.
- **Dynamic API Configuration**: Allows parents to update the backend server IP dynamically without recompiling the app.
- **Real-Time Acoustic Alerts**: Subscribes to Supabase's `audio_threat_alerts` table to notify parents of high/moderate threats instantly.
- **Guided Voice Registration**: A teleprompter-style interface that guides parents through voice registration, training the AI to recognize "Dynamic Parent Identity" via audio processing.

---

## 🛠️ Getting Started

To run the main dashboard locally:

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Variables
Ensure you have your `.env` file configured with your Supabase credentials and default API URLs:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_API_URL=http://your_fastapi_backend_ip:8000
```

### 3. Start the App
```bash
npx expo start
```

In the output, you can choose to run the app on:
- Android Emulator
- iOS Simulator
- Expo Go on a physical device

## 🤝 Contribution Guidelines
When checking out specific features, make sure to sync your local environment variables and ensure the FastAPI backend is running before testing real-time components like the Guardian Dashboard or the Legal RAG client.
