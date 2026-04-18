# 🏛️ Civic-AI-System: Comprehensive Project Analysis

**Analysis Date:** April 18, 2026  
**Status:** Stage 1 (NLP & Text Processing) Complete  
**Tech Stack:** MERN (MongoDB, Express, React, Node.js) + Python (Flask, ML)

---

## 📋 Executive Summary

Civic-AI-System is a **smart city complaint management platform** that leverages AI to automatically classify, analyze, and prioritize civic issues reported by citizens. The system intelligently routes issues to appropriate maintenance crews with AI-generated insights, enabling data-driven decision-making and optimized resource allocation.

---

---

## 🎯 What The Project Does

### Core Problem Solved
Citizens report civic issues (potholes, garbage, streetlights, water leaks) but lack:
- Automated categorization → manual admin work
- Prioritization by urgency → delayed critical issues  
- Context summaries → vague issue descriptions
- Asset-based insights → inefficient crew assignment

### Solution Provided
The Civic-AI-System provides:

1. **Intelligent Issue Processing** - Automatic AI analysis on issue creation
2. **Multi-Role Platform** - Separate portals for citizens, admins, and maintenance crews
3. **Real-time Tracking** - Status updates with activity logs and photo evidence
4. **AI-Powered Insights** - Classification, summarization, urgency detection, CV analysis
5. **Analytics Dashboard** - Heatmaps, trends, resource utilization metrics
6. **Crew Management** - Task assignment and resolution workflows

---

## 🛠️ Current Tech Stack

### Backend
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB (via Mongoose ODM)
- **Authentication:** JWT + OTP (Email-based)
- **File Storage:** Cloudinary (image hosting + CDN)
- **Mail Service:** Nodemailer (OTP & password reset emails)
- **Package Manager:** npm
- **Dev Tool:** nodemon

### Frontend (3 Applications)
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.3.1
- **Styling:** Tailwind CSS 4.2.0
- **UI Library:** Lucide React (icons)
- **Maps:** Leaflet + React Leaflet
- **Animations:** Framer Motion
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Routing:** React Router DOM 7
- **Dev Tool:** ESLint

### AI Services  
- **Framework:** Flask (Python)
- **Computer Vision:** YOLOv8 (object detection)
- **NLP:** 
  - Hugging Face Transformers (BART models)
  - Google Gemini API (vision + text analysis)
- **Image Compression:** Browser-side (client-side)
- **Environment:** Python 3.x

### DevOps & Infrastructure
- **Frontend Hosting:** Vite (development) - no production deployment config found
- **Backend Hosting:** Node.js server on configurable port (default 5000)
- **AI Service Hosting:** Flask on port 8000
- **Database:** MongoDB URI from environment
- **File Upload:** Cloudinary API
- **Containerization:** ❌ **MISSING** - No Docker/Kubernetes setup

---

## 🗂️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CIVIC-AI-SYSTEM ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│  Admin Portal          │  Citizen Portal        │  Crew Portal    │
│  - Dashboard           │  - Report Issue        │  - Assigned     │
│  - All Issues          │  - My Reports          │  - Details      │
│  - Analytics           │  - Activity Logs       │  - Updates      │
│  - Crew Management     │  - Profile             │  - Evidence     │
│  (React/Vite)          │  (React/Vite)         │  (React/Vite)   │
└──────────────────────────────────────────────────────────────────┘
                           ↕ (Axios HTTP)
┌──────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                            │
│              Express.js Server (Port 5000)                       │
├──────────────────────────────────────────────┬──────────────────┤
│ Routes:                                      │ Middleware:      │
│ • POST /api/auth/register                   │ • JWT Auth       │
│ • POST /api/auth/login                      │ • Role-Based     │
│ • POST /api/issues (create)                 │ • Error Handler  │
│ • GET /api/issues (all/admin)               │ • CORS           │
│ • PUT /api/issues/:id/assign                │ • Body Parser    │
│ • PUT /api/issues/:id/status                │                  │
│ • GET /api/nlp/analyze                      │                  │
│ • POST /api/nlp/batch                       │                  │
└──────────────────────────────┬───────────────┴──────────────────┘
                  ↕                        ↕
        ┌──────────────┐         ┌──────────────────┐
        │  MongoDB     │         │ AI Services      │
        │  Database    │         │ (Flask, Py 3)    │
        │              │         │                  │
        │ Collections: │         │ Endpoints:       │
        │ • Users      │         │ /analyze-text    │
        │ • Issues     │         │ /classify-text   │
        │ • CrewTasks  │         │ /summarize-text  │
        │              │         │ /detect-urgency  │
        │              │         │ /analyze         │
        └──────────────┘         └──────────────────┘
                                  ↓
                    ┌─────────────────────────┐
                    │   ML Models             │
                    │ • YOLO v8 (CV)         │
                    │ • BART (NLP)           │
                    │ • Gemini API (Vision)  │
                    └─────────────────────────┘
```

---

## 📊 Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: Enum["citizen", "admin", "crew"],
  active: Boolean,
  otpCode: String,
  otpExpiresAt: Date,
  otpAttempts: Number,
  timestamps: { createdAt, updatedAt }
}
```

### Issue Model (Comprehensive)
```javascript
{
  // Basic Info
  title: String,
  description: String,
  category: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  images: [String] (Cloudinary URLs),
  
  // Status & Assignment
  status: Enum["pending", "assigned", "in_progress", "resolved", "rejected"],
  reportedBy: ObjectId → User,
  assignedTo: ObjectId → User,
  severityScore: Number,
  
  // Computer Vision AI Results
  aiCategory: String,
  aiConfidence: Number,
  aiGeneratedDescription: String,
  aiSeverityScore: Number,
  is_miscategorized: Boolean,
  
  // NLP Text Analysis Results
  textClassification: {
    category: String,
    confidence: Number
  },
  textSummary: String,
  urgencyLevel: Number (1-5),
  urgencyLabel: String,
  urgencyKeywords: [String],
  
  // Activity Tracking
  activityLog: [{
    status: String,
    changedBy: ObjectId → User,
    timestamp: Date,
    comment: String,
    evidenceImages: [String],
    rejectionReason: String,
    crewNote: String,
    relatedIssue: ObjectId → Issue,
    isViewed: Boolean
  }],
  
  timestamps: { createdAt, updatedAt }
}
```

### CrewTask Model
```javascript
// Currently EMPTY - placeholder for future crew task tracking
```

---

## 🔐 Authentication & Authorization

### Authentication Flow
1. **Registration** → User creates account (citizen/admin/crew)
2. **OTP Verification** → Email-based OTP sent (6 digits, 10-min expiry)
3. **Login** → Username/email + password → JWT token issued
4. **Token Storage** → Stored in localStorage (frontend)
5. **Token Verification** → JWT verified on protected routes
6. **Session** → No explicit logout (token-based stateless)

### Role-Based Access Control (RBAC)
```
Citizen:
  ✅ Create issues with images
  ✅ View own issues
  ✅ View activity logs
  ✅ Update profile

Admin:
  ✅ View all issues
  ✅ Filter by category/status/date/location
  ✅ Assign issues to crew
  ✅ Access analytics dashboard
  ✅ View crew list
  ✅ Batch NLP analysis

Crew:
  ✅ View assigned issues
  ✅ Update issue status
  ✅ Upload evidence images
  ✅ Add resolution notes
  ✅ Soft/hard rejection workflow
```

### Security Considerations
- ✅ Passwords hashed with bcryptjs
- ✅ JWT secret configurable via env
- ⚠️ OTP stored in database (should use secure cache)
- ⚠️ No rate limiting on OTP requests
- ⚠️ localStorage vulnerable to XSS attacks (should use secure HTTP-only cookies)
- ⚠️ No HTTPS redirect configured
- ⚠️ No CORS whitelisting (accepts all origins)

---

## 📡 API Endpoints & Features

### Authentication Endpoints
```
POST   /api/auth/register                 - Register new user
POST   /api/auth/register/verify          - Verify registration OTP
POST   /api/auth/login                    - Login (JWT token)
POST   /api/auth/request-otp              - Request OTP via email
POST   /api/auth/verify-otp               - Verify login OTP
POST   /api/auth/forgot-password          - Request password reset
POST   /api/auth/forgot-password/verify   - Reset password with OTP
GET    /api/auth/me                       - Get current user profile
PUT    /api/auth/profile                  - Update profile
PUT    /api/auth/change-password          - Change password
```

### Issue Management
```
POST   /api/issues/                       - Create issue with images
GET    /api/issues/                       - Get all issues (admin only)
GET    /api/issues/my                     - Get citizen's issues
GET    /api/issues/assigned               - Get crew's assigned issues
GET    /api/issues/:id/detail             - Get issue details
GET    /api/issues/:id/rag-suggest        - Get resolution suggestion (RAG)
PUT    /api/issues/:id/assign             - Assign to crew (admin)
PUT    /api/issues/:id/status             - Update status with evidence
PUT    /api/issues/:id/logs/viewed        - Mark logs as viewed
```

### NLP Analysis (Protected)
```
POST   /api/nlp/analyze                   - Comprehensive text analysis
POST   /api/nlp/classify                  - Text classification only
POST   /api/nlp/summarize                 - Text summarization only
POST   /api/nlp/urgency                   - Urgency detection only
POST   /api/nlp/batch                     - Batch analysis (admin only)
GET    /api/nlp/status                    - Service health check
```

### Admin Endpoints
```
GET    /api/admin/crews                   - List all crew members
```

### AI Service Direct (Port 8000) - For Integration
```
POST   /analyze-text                      - Comprehensive analysis
POST   /analyze-and-enhance               - Image + text enhanced analysis
POST   /classify-text                     - Classification only
POST   /summarize-text                    - Summarization only
POST   /detect-urgency                    - Urgency detection only
POST   /analyze                           - Image classification + severity
```

---

## 🎨 Frontend Features

### Admin Web Portal
**Pages:**
- Dashboard - Overview stats, activity metrics
- All Issues - Filterable issue list with paging
- Issue Detail - Full context, activity logs, assignment UI
- Analytics - Charts, heatmaps, trends, performance metrics
- Crew Management - List and manage maintenance crews
- Profile - Account settings, password change
- Login/Register - Authentication flows

**Features:**
- Real-time severity visualization (color-coded bars)
- Multi-filter search (category, location, date range)
- Issue assignment modal with crew selection
- Pagination (10 items per page)
- Activity log display with user avatars
- Analytics with area charts, bar charts, pie charts, heatmaps
- Responsive design (mobile-first)
- Framer Motion animations

### Citizen Web Portal  
**Pages:**
- Home - Landing page
- Report Issue - Form with image upload, map location picker
- My Reports - List of submitted issues with status tracking
- Logs - Activity timeline with proof images
- Profile - Account settings
- Login/Register - Authentication

**Features:**
- Map integration (Leaflet) for location selection
- Multi-image upload with compression (up to 3 images)
- AI-powered severity prediction display
- Real-time urgency level indication
- Address autocomplete (OSM reverse geocoding)
- Status tracking with visual indicators
- Severity bar visualization

### Crew Web Portal
**Pages:**
- Dashboard - Assigned issues overview
- Assigned Issues - List of tasks  
- Issue Detail - Full context and resolution workflow
- Profile - Account settings
- Login/Register

**Features:**
- Issue assignment display
- Status update workflow (pending → in_progress → resolved/rejected)
- Evidence photo upload (up to 3 images)
- Soft/hard rejection handling
- Related issue linking
- Crew notes and resolution comments
- Responsive cards for task tracking

---

## 🤖 AI/ML Capabilities

### Computer Vision (Stage 1 Complete)
**Implementation:**
- YOLOv8 nano model (fast, lightweight)
- Two-stage detection: YOLO → Gemini Vision fallback
- Gemini API for smart civic issue understanding

**Capabilities:**
- Image classification into 5 civic categories
- Confidence scores for predictions
- Severity calculation based on category
- Miscategorization detection
- Training data collection (fire-and-forget)

**Categories:**
- Pothole (road damage)
- Garbage (litter/waste)
- Streetlight (broken poles/lamps)
- Water Leakage (flooding/pipes)
- Uncategorized (other issues)

### NLP Text Analysis (Stage 1 Complete)
**Implementation:**
- Hugging Face Transformers (BART Large models)
- Google Gemini API (text understanding)
- Hybrid keyword + ML approach

**Capabilities:**
1. **Text Classification** - 8 issue categories with confidence
2. **Text Summarization** - Long descriptions → concise one-liners
3. **Urgency Detection** - 5-level severity (Very Low to Critical)
4. **Keyword Extraction** - Relevant urgency indicators

**Models Used:**
- `facebook/bart-large-mnli` - Zero-shot classification
- `facebook/bart-large-cnn` - Abstractive summarization  
- `gemini-1.5-flash` - Vision & text understanding (free tier)

**Urgency Levels:**
- Level 1: Very Low (reports, minor issues)
- Level 2: Low (dirty, dusty, small damage)
- Level 3: Medium (broken, cracked, holes)
- Level 4: High (leaking, flooding, hazards)
- Level 5: Critical (fire, accidents, injuries, sparking)

### ML Integration Points
- **Issue Creation** - Auto-analysis on submit
- **Text Analysis** - Classification, summarization, urgency
- **Batch Processing** - Admin can reanalyze multiple issues
- **Training Data** - Auto-collected for model improvement

---

## 💪 Current Strengths

1. ✅ **Complete Core MVP** - All 3 user roles working end-to-end
2. ✅ **AI Integration** - Both CV and NLP fully functional
3. ✅ **Real-time Analytics** - Rich dashboard with multiple chart types
4. ✅ **Responsive Design** - Mobile-friendly across all portals
5. ✅ **Multi-image Support** - Up to 3 images per issue
6. ✅ **Activity Tracking** - Complete audit trail with timestamps
7. ✅ **Authentication** - OTP-based + JWT tokens
8. ✅ **Map Integration** - Leaflet-based location picker & heatmaps
9. ✅ **Status Workflows** - Complex rejection/soft rejection logic
10. ✅ **Evidence Storage** - Cloudinary-based image persistence
11. ✅ **Clean Code** - Well-organized controllers/routes/models structure
12. ✅ **Rapid Development** - Vite-based fast frontend builds

---

## ⚠️ Current Weaknesses & Gaps

### Architecture & Infrastructure
1. **No Containerization** - No Docker/docker-compose for easy deployment
2. **No CI/CD** - No automated testing/deployment pipelines
3. **Environment Management** - Limited config validation
4. **No Load Balancing** - Single instance deployment only
5. **No Caching Layer** - No Redis for session/data caching
6. **No Message Queue** - No async job processing (critical for AI calls)

### Testing
7. **No Automated Tests** - Zero unit/integration/E2E tests
8. **No Test Coverage** - No CI validation
9. **Manual QA Only** - All testing manual

### Logging & Monitoring
10. **Minimal Logging** - Logger utility exists but empty
11. **No Monitoring** - No Prometheus/error tracking (Sentry, etc.)
12. **No Alerting** - No alerts for failed API calls or crashes
13. **No Request Tracing** - No distributed tracing for debugging

### Security
14. **CORS Open** - Accepts all origins (should whitelist)
15. **No Rate Limiting** - Vulnerable to brute force/DDoS
16. **localStorage for JWT** - Vulnerable to XSS (should use secure cookies)
17. **No HTTPS/SSL** - Configuration missing
18. **OTP in DB** - Should use Redis with strict TTL
19. **No Input Validation** - Minimal request validation
20. **No SQL Injection Protection** - Mongoose used (safe by design, but not explicit validation)

### Database
21. **No Indexing** - Database queries could be slow
22. **No Backup Strategy** - No backup configuration found
23. **No Sharding** - No partitioning for scale

### Performance
24. **Synchronous Image Upload** - Blocking file uploads to Cloudinary
25. **No Image Optimization** - Client-side compression only
26. **No API Pagination Docs** - Unclear pagination standards
27. **No Query Optimization** - No `lean()`, `select()` limiting in queries

### Frontend
28. **No Error Boundaries** - React errors crash UI
29. **No Offline Support** - No PWA or offline caching
30. **No State Management** - Scattered useState hooks (consider Context/Redux)
31. **No Form Validation** - Limited client-side form validation

### Development
32. **No Environment Files** - .env examples missing
33. **No Seed Data** - No database initialization script
34. **No API Documentation** - No Swagger/OpenAPI docs
35. **No README** - Root README is empty

### Scalability
36. **No Microservices** - Monolithic backend
37. **No Horizontal Scaling** - Session storage not distributed
38. **No API Versioning** - All endpoints v1 (implicit)

### Maintenance
39. **No Dependency Audits** - No security scanning
40. **Outdated Dependencies** - Some packages may have vulnerabilities
41. **No Version Control Hooks** - No pre-commit linting
42. **No Architecture Docs** - Limited documentation

---

## ✨ 15-20 Recommended Improvements

### Priority: CRITICAL

**1. Add Unit & Integration Tests**
```
Impact: Ensures code reliability, prevents regressions
Effort: 2 weeks
Dependencies: Jest/Vitest, Supertest, Mock libraries
```

**2. Implement Request Rate Limiting**
```
Impact: Protects against abuse/brute force
Effort: 1-2 days
Tech: express-rate-limit + Redis
```

**3. Set Up Docker & Docker Compose**
```
Impact: Enables easy deployment, environment consistency
Effort: 2-3 days
Deliverable: dockerfile, docker-compose.yml, .dockerignore
```

**4. Configure HTTPS & Secure Cookies**
```
Impact: Encrypts data in transit, prevents JWT theft
Effort: 1 day
Tech: helmet.js, express-session with secure cookies
```

**5. Implement Authentication Rate Limiting & Account Lockout**
```
Impact: Prevents credential brute force
Effort: 1 day
Features: Max OTP attempts (already done), login attempts, IP-based blocking
```

### Priority: HIGH

**6. Add Comprehensive API Logging & Monitoring**
```
Impact: Production debugging, performance insights
Effort: 2-3 days
Tech: Winston/Pino logger + Prometheus metrics + optional ELK stack
```

**7. Add Swagger/OpenAPI Documentation**
```
Impact: Clear API contracts, auto-generated docs
Effort: 2 days
Tech: swagger-ui-express, swagger-jsdoc
```

**8. Implement Error Boundaries & Fallbacks (Frontend)**
```
Impact: Graceful error handling, better UX
Effort: 1 day
```

**9. Set Up CI/CD Pipeline**
```
Impact: Automated testing & deployment
Effort: 1-2 days
Tech: GitHub Actions / GitLab CI / Jenkins
Stages: Lint → Test → Build → Deploy
```

**10. Add Database Indexes & Query Optimization**
```
Impact: Faster queries, reduced latency
Effort: 1 day
Tasks: Index user.email, issue.status, user.role
Use: .lean() for read-only queries
```

**11. Implement Async Job Queue for AI Processing**
```
Impact: Non-blocking AI calls, better responsiveness
Effort: 3 days
Tech: Bull/RabbitMQ + queue worker process
Use: Queue image analysis, batch processing, email sending
```

**12. Add Comprehensive Input Validation**
```
Impact: Prevents invalid data, security
Effort: 2 days
Tech: Joi/Yup validation schemas on routes
```

### Priority: MEDIUM

**13. Implement State Management (Frontend)**
```
Impact: Better component reuse, easier debugging
Effort: 2-3 days
Options: Context API (simple) or Redux/Zustand (complex apps)
```

**14. Add PWA Support & Offline Caching**
```
Impact: Works offline, faster repeat visits
Effort: 2 days
Tech: workbox, service workers
```

**15. Set Up Comprehensive Environment Configuration**
```
Impact: Clear env vars, validation, docs
Effort: 1 day
Add: .env.example, env validation in app startup
```

**16. Implement Database Backup Strategy**
```
Impact: Data recovery capability
Effort: 1 day
Tech: MongoDB Atlas automated backups OR manual scripts
```

**17. Add Analytics Tracking (Privacy-Respectful)**
```
Impact: Understand user behavior, improve UX
Effort: 1 day
Tech: Mixpanel or self-hosted Plausible
```

**18. Implement Search & Advanced Filtering**
```
Impact: Better issue discovery
Effort: 2 days
Features: Full-text search, faceted filtering, saved filters
Tech: MongoDB text indexes or Elasticsearch
```

### Priority: LOW

**19. Add Notification System**
```
Impact: Real-time updates via email/SMS/push
Effort: 2-3 days
Features: Issue status changes, assignments, comments
Tech: Push notifications (Firebase), SMS (Twilio)
```

**20. Implement Multi-Language Support**
```
Impact: Broader user base
Effort: 2-3 days
Tech: i18next, automatic translation via Google Translate API
```

---

## 🚀 Recommended Next Phases

### Stage 2: Computer Vision Enhancement
- Fine-tune YOLO model on local civic images
- Add more categories (electrical hazards, paving issues)
- Implement real-time camera detection for crew app
- Add confidence thresholding

### Stage 3: Advanced AI Features
- Implement RAG (Retrieval-Augmented Generation) for crew suggestions ✓ (Started)
- Add predictive maintenance (when issues likely recur)
- Implement root cause analysis
- Add duplicate detection

### Stage 4: Scalability & DevOps
- Containerize & deploy to Kubernetes
- Set up automated scaling
- Implement caching layer
- Database optimization & replication

### Stage 5: Enterprise Features
- Multi-city/multi-admin support
- Roles customization
- Custom workflows
- SLA tracking
- Budget tracking per department

---

## 📊 Key Metrics to Track

1. **Issue Resolution Time** - Avg time from creation to resolution
2. **Classification Accuracy** - % of correctly categorized issues
3. **Crew Assignment Efficiency** - Time between assignment and in-progress
4. **AI Model Performance** - Precision, recall, F1 score
5. **API Response Time** - P50/P95/P99 latencies
6. **Error Rate** - % of failed requests
7. **User Engagement** - Active citizens/crew per day
8. **System Uptime** - Availability percentage
9. **Database Query Performance** - Slow query logs
10. **Cost Optimization** - Cloudinary usage, API call costs

---

## 🔄 Development Workflow Recommendations

### For New Features
1. Create feature branch from `develop`
2. Add tests FIRST (TDD approach)
3. Implement feature
4. Ensure tests pass locally
5. Create PR with description
6. Automatic CI runs tests + linting + builds
7. Code review required before merge
8. Deploy to staging automatically on merge to `develop`
9. Manual QA on staging
10. PR to `main` for production release
11. Automatic production deployment

### For Bug Fixes
1. Create hotfix branch from `main`
2. Fix + test
3. Merge back to both `main` and `develop`

---

## 📝 Configuration Checklist

### Backend
- [ ] `.env` file with all required variables (template provided in docs)
- [ ] JWT_SECRET (strong, random)
- [ ] MongoDB connection string
- [ ] Cloudinary credentials
- [ ] AI service URL (local or remote)
- [ ] Email configuration (SMTP or test account)
- [ ] Optional: Rate limiting config, CORS whitelist

### Frontend (All 3 apps)
- [ ] `.env` with API base URL
- [ ] Mapbox key (if using real maps)
- [ ] Analytics key (if using tracking)

### AI Service
- [ ] Python 3.8+
- [ ] Hugging Face token (optional, for private models)
- [ ] Google Gemini API key
- [ ] Required packages installed

---

## 🎓 Learning Resources for Team

1. **Express.js Best Practices** - Security, middleware
2. **MongoDB Indexing** - Query optimization
3. **React Hooks** - Functional component patterns  
4. **Docker & Container Orchestration** - For DevOps team
5. **JWT vs Session-based Auth** - Security implications
6. **Testing Pyramid** - Unit/Integration/E2E approach
7. **CI/CD Pipelines** - GitHub Actions or GitLab CI
8. **ML Model Deployment** - Model versioning, monitoring

---

## ✅ Conclusion

The Civic-AI-System is a **well-architected MVP with solid foundations**. Stage 1 (NLP) is complete and production-ready. The next priorities should be:

1. **Add tests** (ensures stability)
2. **Implement monitoring** (understand production)
3. **Containerize** (deploy consistently)
4. **Secure** (hardening)
5. **Optimize** (performance & cost)

This creates a strong base for Stages 2-5 of the roadmap while maintaining code quality and operational excellence.

---

**Document Version:** 1.0  
**Last Updated:** April 18, 2026  
**Status:** Ready for Implementation Planning
