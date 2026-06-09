# Contributing to CareerPath AI

First off, thank you for considering contributing to CareerPath AI! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

This document provides guidelines and instructions for contributing to this repository.

## 🛠️ Setup Instructions

To get the project running locally on your machine, follow these steps:

1. **Fork the Repository:** Click the "Fork" button at the top right of this page to create your own copy of the repository.
2. **Clone your Fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/-careerpath-ai.git
   cd -careerpath-ai
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Set Up Environment Variables:**
   Create a `.env` file in the root directory based on the `.env.example` file.
   ```bash
   cp .env.example .env
   ```
   *Make sure you add your Groq API key and configure your local PostgreSQL URL.*
5. **Set Up the Database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
6. **Start the Development Server:**
   ```bash
   npm run dev
   ```

## 🌿 Branch Naming

We follow a structured branch naming convention to keep our workflow organized. Please use one of the following prefixes:

- `feat/` for new features (e.g., `feat/add-new-dashboard`)
- `fix/` for bug fixes (e.g., `fix/ai-fallback-bug`)
- `docs/` for documentation updates (e.g., `docs/update-readme`)
- `refactor/` for code refactoring (e.g., `refactor/prisma-schema`)
- `test/` for adding or fixing tests

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]
```

**Examples:**
- `feat: add gamified learning path UI`
- `fix(ai): resolve Groq rate limit timeout`
- `docs: update installation instructions`

## 💻 Coding Standards

- **TypeScript First:** We use strict TypeScript. Ensure all new functions, components, and API routes have proper type definitions. Avoid using `any`.
- **Linting:** We enforce strict Next.js linting. Before committing, run `npm run lint` and resolve any warnings or errors.
- **Prettier:** Use Prettier for code formatting to maintain a consistent style across the codebase.
- **Database:** All database interactions must happen through Prisma. Do not use raw SQL queries unless absolutely necessary and documented.

## 🚀 Pull Request Rules

1. **Keep it focused:** A PR should ideally address a single issue or implement a specific feature.
2. **Describe your changes:** Provide a clear and comprehensive description of what your PR does. Include screenshots if your changes affect the UI.
3. **Pass checks:** Ensure `npm run lint` and `npm run build` pass without errors before requesting a review.
4. **Link issues:** If your PR resolves an open issue, link it using keywords like `Fixes #123`.

Thank you for your contributions!
