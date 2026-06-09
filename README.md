<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <h1>🚀 CareerPath AI (Omni-Dashboard)</h1>
  <p><strong>Next-Generation Career Orchestration & AI Job Readiness Platform</strong></p>
</div>

<br />

## 🌟 Project Overview

**CareerPath AI** is an advanced, AI-driven career orchestration platform designed to bridge the gap between job seekers, students, and their dream careers. Leveraging cutting-edge Large Language Models (LLMs) and structured programmatic fallbacks, the platform provides hyper-personalized career roadmaps, dynamic skill gap analysis, ATS resume optimization, and Netflix-style gamified learning paths.

Whether you're a high school student choosing a stream, a fresh graduate seeking higher education, or a seasoned professional pivoting careers, the Omni-Dashboard dynamically adapts to your profile to offer unparalleled market intelligence.

---

## 🔥 Features

### 1. 🧠 Dynamic Skill Gap Analyzer
Upload your resume (PDF/DOCX) and our AI instantly parses your technical and soft skills, cross-referencing them against current global industry demands to identify precise gaps in your profile.

### 2. 🎯 Private Job Match Engine
Stop relying on generic job boards. Our system aligns your validated skills with the best-matching job roles, providing realistic expected salary ranges and top hiring companies.

### 3. 📉 ATS Resume Optimizer
Get instant feedback on your CV. The system calculates an ATS compatibility score and provides actionable feedback on how to bypass automated screening filters.

### 4. 🎓 Higher Education & Exam Prep Validator
Rigorous validation engines ensure students receive realistic recommendations (e.g., PCB students are correctly routed to Medical paths, and budget constraints are strictly enforced).

### 5. 📺 Binge Learning Series (Netflix-Style)
Get a curated, episodic learning series tailored to your missing skills, complete with direct links to high-quality YouTube tutorials.

### 6. 🎮 Gamified Career Progression
Earn XP and industry-specific badges as you complete milestones. Career growth shouldn't be boring; it should be an engaging journey.

---

## 📸 Screenshots

*(Add high-quality screenshots or GIFs here to showcase the beautiful UI)*

| Landing Page | Job Seeker Dashboard |
| --- | --- |
| `<img src="docs/landing.png" alt="Landing Page" width="400"/>` | `<img src="docs/job-dashboard.png" alt="Job Seeker Dashboard" width="400"/>` |

| Higher Education Plan | Binge Learning Series |
| --- | --- |
| `<img src="docs/higher-ed.png" alt="Higher Education Plan" width="400"/>` | `<img src="docs/learning-path.png" alt="Binge Learning Path" width="400"/>` |

---

## 🛠️ Architecture & Tech Stack

CareerPath AI is built on a unified, high-performance edge architecture.

**Frontend & Backend (Unified):**
- Next.js 15 (App Router)
- React 19
- Next.js API Routes (Serverless backend)
- Tailwind CSS v4 (Glassmorphism & Micro-animations)
- Lucide React (Iconography)

**Database Layer:**
- Prisma ORM
- PostgreSQL
- Type-safe strict schema enforcement

**AI & File Processing:**
- Groq API (`llama-3.2-3b-preview` & `llama-3.2-11b-vision-preview`)
- Multi-model orchestration with programmatic fallbacks
- Multer & PDF-Parse (Local memory parsing, no data stored remotely)

---

## 🚀 Installation & Setup

Follow these instructions to clone the repository and run the application locally.

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (Running locally or via Docker)
- **Groq API Key** (Get one at [console.groq.com](https://console.groq.com/))

### 1. Clone the repository
```bash
git clone https://github.com/reeduversity/-careerpath-ai.git
cd -careerpath-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory.

**`.env`**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/careerpath"
GROQ_API_KEY="your_groq_api_key_here"
```

### 4. Database Setup
Initialize the Prisma database and generate the type-safe client.
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Running Locally
```bash
npm run dev
```
*The application will start on `http://localhost:3000` with the unified Next.js App Router handling both frontend and API routes.*

---

## ☁️ Deployment

This project is optimized for deployment on platforms that support Next.js SSR and serverless functions.

**Recommended Platforms:**
- **Railway / Render:** Highly recommended. These platforms run long-lived Node.js processes, completely bypassing the aggressive 10s serverless timeout limits often hit during AI generation.
- **Vercel:** Fully supported, though upgrading to Pro (60s execution limit) is recommended to prevent `504 Gateway Timeouts` during lengthy LLM orchestration steps.

---

## 🤝 Contributing

We welcome contributions from the open-source community! Whether you're fixing a bug, improving the AI prompt engineering, or adding a new dashboard feature, we'd love to see your PRs.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, branching strategy, and the process for submitting pull requests.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <h3>👨‍💻 Lead AI Developer & Architect</h3>
  <h2><strong>Ram Bhajan</strong></h2>
  <p>Built with ❤️ for the future of Career Navigation.</p>
</div>
