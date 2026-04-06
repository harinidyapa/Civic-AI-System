# 🚀 Civic AI System - Complete Startup Guide

## Problem You Encountered
```
RAG suggestion error: connect ECONNREFUSED ::1:8000
```

**Cause:** The backend cannot connect to the AI service because:
1. The AI service (Flask) is not running on port 8000
2. IPv6/IPv4 mismatch in connection string (localhost resolved to ::1 instead of 127.0.0.1)

**Fixed:** Updated `backend/.env` with `AI_SERVICE_URL=http://127.0.0.1:8000`

---

## ✅ Required Setup (One-Time)

### 1. Python Environment Setup
```bash
cd ai-services

# Create Python virtual environment
python -m venv venv

# Activate venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Verify Dependencies Installed
```bash
# Check if key packages are available
pip list | grep -E "flask|pymongo|google-generativeai|ultralytics"
```

---

## 🎯 How to Run All Services (Every Time)

### **Terminal 1: MongoDB** (if using local)
```bash
# If using MongoDB Atlas (cloud), skip this step
# For local MongoDB:
mongod
```

### **Terminal 2: AI Service (Flask)** ⭐ **START THIS FIRST**
```bash
cd c:\Users\harin\Civic-AI-System\ai-services

# Activate Python venv if not already active
venv\Scripts\activate

# Start Flask app
python app.py

# Expected output:
# WARNING in app.run(): This is a development server...
# Running on http://0.0.0.0:8000
# Press CTRL+C to quit
```

✅ **Keep this running** - Flask must be active before starting backend

---

### **Terminal 3: Backend (Node.js)**
```bash
cd c:\Users\harin\Civic-AI-System\backend

# Install dependencies (first time only)
npm install

# Start backend
npm start

# Expected output:
# Server running on port 5000...
# MongoDB connected...
```

✅ **Verify connection** - Check that backend successfully connects to Flask on startup

---

### **Terminal 4: Crew Web (React Frontend)**
```bash
cd c:\Users\harin\Civic-AI-System\crew-web

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev

# Expected output:
# VITE v7.3.1 ready in XXX ms
# Local: http://localhost:5177
```

---

### **Terminal 5 (Optional): Citizen Web**
```bash
cd c:\Users\harin\Civic-AI-System\citizen-web

npm install

npm run dev

# Should be on http://localhost:5173 or higher
```

---

### **Terminal 6 (Optional): Admin Web**
```bash
cd c:\Users\harin\Civic-AI-System\admin-web

npm install

npm run dev

# Should be on another port
```

---

## 🔍 Verification Checklist

### Test AI Service is Running
```bash
# In any terminal/PowerShell, test the Flask API directly:
curl -X POST http://127.0.0.1:8000/rag-suggest ^
  -H "Content-Type: application/json" ^
  -d "{\"current_issue\":{\"title\":\"Test\",\"category\":\"Pothole\",\"description\":\"Test issue\",\"urgencyLabel\":\"Medium\"},\"similar_issues\":[]}"

# Should return a JSON response with summary, steps, materials, etc.
# NOT an error like "Connection refused"
```

### Test Backend → AI Connection
```bash
# Open crew web
# Navigate to an assigned issue
# Click "In Progress" button
# If RAG auto-fill works → Backend can reach AI service ✅
# If "Could not generate suggestion" → AI service not running ❌
```

### Troubleshooting Matrix

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED ::1:8000` | AI service not running OR IPv6 issue | Run `python app.py` in ai-services |
| `Could not generate suggestion` | Backend can't reach AI service | Check port 8000 is open, Flask is running |
| No auth errors but RAG panel empty | Response parsing issue | Check browser DevTools → Network tab for API response |
| `ModuleNotFoundError: No module named 'flask'` | Python dependencies missing | Run `pip install -r requirements.txt` |
| `ECONNREFUSED port 5000` | Backend not running | Run `npm start` in backend folder |
| `Cannot find module 'express'` | Node dependencies missing | Run `npm install` in backend folder |

---

## 📋 Quick Reference - Port Map

| Service | Port | Tech | Terminal | Command |
|---------|------|------|----------|---------|
| **AI Service** | 8000 | Flask (Python) | T2 | `python app.py` |
| **Backend API** | 5000 | Node.js/Express | T3 | `npm start` |
| **Crew Web** | 5177 | React/Vite | T4 | `npm run dev` |
| **Citizen Web** | 5173+ | React/Vite | T5 | `npm run dev` |
| **Admin Web** | 5173+ | React/Vite | T6 | `npm run dev` |
| **MongoDB** | 27017 | Atlas/Local | T1 | `mongod` (local only) |

---

## 🐛 Debug Commands

### Check if Port is Open
```powershell
# Windows - Check if port 8000 is listening
netstat -ano | findstr ":8000"

# Windows - Check if port 5000 is listening
netstat -ano | findstr ":5000"
```

### Kill Process on Port (if stuck)
```powershell
# Kill process on port 8000
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process

# Kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### View Backend Logs
```bash
cd backend
npm start
# Look for: "RAG suggestion error: connect ECONNREFUSED"
# If you see it, AI service is not running
```

---

## ✨ Expected Behavior (After Fix)

### On Crew Web - Issue Detail Page:
1. **AI Resolution Guide panel loads** showing summary, steps, materials ✅
2. **Click "In Progress" modal** pre-fills resolution plan with AI-generated text ✅
3. **No error messages** about connection refused ✅

### On Browser Console:
- No `ECONNREFUSED` errors ✅
- RAG API calls return proper JSON data ✅

---

## 📞 If Still Not Working

1. **Check Terminal 2 (AI Service):**
   - Does it show `Running on http://0.0.0.0:8000`?
   - Are there any Python errors?

2. **Check Terminal 3 (Backend):**
   - Does it show `Server running on port 5000`?
   - Look for `❌ CRITICAL: Cannot connect to AI Service at http://127.0.0.1:8000`?

3. **Check Terminal 4 (Crew Web):**
   - Does it show `Local: http://localhost:5177`?
   - Open DevTools (F12) → Network tab → look for `/rag-suggest` calls

4. **Test API Directly:**
   ```bash
   curl http://127.0.0.1:8000/health
   # Should return: {"status":"AI Service is running","version":"2.0"}
   ```

---

## 🎉 RAG System Now Works!

Once all services are running in correct order:
1. Flask AI Service (port 8000)
2. Node Backend (port 5000) → connects to Flask
3. React Frontend (displays RAG suggestions)

The crew web RAG panel will show AI-generated resolution guides! 🚀
