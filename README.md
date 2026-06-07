<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <h1>🚀 CareerPath AI (Job Seeker Dashboard)</h1>
  <p><strong>Next-Generation Career Orchestration & AI Job Readiness Platform</strong></p>
</div>

<br />

## 🌟 Overview

**CareerPath AI** is an advanced, AI-driven career orchestration platform designed to bridge the gap between job seekers and their dream careers. Leveraging cutting-edge Large Language Models (LLMs), the platform provides hyper-personalized career roadmaps, dynamic skill gap analysis, ATS resume optimization, and Netflix-style gamified learning paths.

Whether you're a fresh graduate, a mid-level professional seeking a career pivot, or a seasoned expert aiming for executive roles, the Job Seeker Dashboard dynamically adapts to your profile to offer unparalleled market intelligence.

---

## 🔥 Core Features

### 1. 🧠 Dynamic Skill Gap Analyzer
Upload your resume, and our AI instantly parses your technical and soft skills, cross-referencing them against current global industry demands to identify precise gaps in your profile.

### 2. 🎯 Private Job Match Engine
Stop relying on generic job boards. Our system aligns your validated skills with the best-matching job roles, providing realistic expected salary ranges and top hiring companies.

### 3. 📉 ATS Resume Optimizer
Get instant feedback on your CV. The system calculates an ATS compatibility score and provides actionable feedback on how to bypass automated screening filters.

### 4. 📺 Binge Learning Series (Netflix-Style)
We don't just tell you what you're missing; we teach you how to learn it. Get a curated, episodic learning series tailored to your missing skills, complete with direct links to high-quality YouTube tutorials.

### 5. 🏆 Actionable Certifications & Projects
- **Genuine Certifications:** Google search links for the exact certifications you need to validate your skills.
- **Resume-Worthy Projects:** Direct GitHub repository searches for projects that will make your portfolio stand out.
- **Matched Job Roles:** One-click navigation to LinkedIn job searches tailored to your recommended roles.

### 6. 🎮 Gamified Career Progression
Earn XP and industry-specific badges as you complete milestones. Career growth shouldn't be boring; it should be an engaging journey.

---

## 🛠️ Technology Stack

**Frontend Architecture:**
- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4 (Advanced animations and glassmorphism UI)
- Lucide React (Iconography)

**Backend Architecture:**
- Node.js & Express
- Prisma ORM
- PostgreSQL (Database)
- Multer & PDF-Parse (Resume Processing)

**AI & Cloud:**
- Groq API (`llama-3.3-70b-versatile` & `llama-3.1-8b-instant`)
- Dynamic Prompt Orchestration

---

## 🚀 Quick Start Guide

Follow these instructions to clone the repository and run the Omni-Dashboard locally.

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (Running locally or via Docker)
- **Groq API Key** (Get one at [console.groq.com](https://console.groq.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/reeduversity/-careerpath-ai.git
   cd -careerpath-ai
   ```

2. **Install dependencies:**
   The project uses `concurrently` to manage both frontend and backend from the root.
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Environment Setup:**
   Create a `.env` file in the **root** directory and the **backend** directory.
   
   **`backend/.env`**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/careerpath"
   GROQ_API_KEY="your_groq_api_key_here"
   PORT=4000
   ```

4. **Database Migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   cd ..
   ```

5. **Run the Application:**
   ```bash
   npm run dev
   ```
   *The frontend will start on `http://localhost:3000` and the backend on `http://localhost:4000`.*

---

## 🔒 Security Notice
- All `.env` files, API keys, and sensitive database credentials are strictly ignored via `.gitignore`.
- **Never commit your `GROQ_API_KEY` to version control.**

---

<div align="center">
  <p>Built with ❤️ for the future of Career Navigation.</p>
</div>
