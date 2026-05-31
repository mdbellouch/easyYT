# easyYT Pro

`easyYT` is a secure, high-integrity YouTube Analytics Dashboard and AI Growth Coach. It leverages local heuristics and advanced server-side Gemini LLM connections to help creators perform deep analytics audits, analyze script pacing, evaluate title credibility, model audience retention, architect vertical marketing funnels, and calculate fair-market brand sponsorships.

---

## 📋 App Profile

* **Name:** `easyYT`
* **Description:** A secure offline-first YouTube Analytics Dashboard and AI Growth Coach providing SEO, Title analysis, and content strategies.
* **Core Value:** Data solitude. No credentials leave your server. Full-suite analytical models run completely on-device or proxy safely to your custom LLM environment.

---

## 🚀 How to Run `easyYT` Locally

Follow these steps to set up and run `easyYT` on your local machine:

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (Version 18+ recommended)
* [npm](https://www.npmjs.com/) (Version 9+ recommended)

### 2. Environment Configuration
Create a `.env` file in the root directory of your project based on `.env.example`:
```bash
# Copy example variables
cp .env.example .env
```
Inside your new `.env` file, configure your **Gemini API Key**:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
*(If no API Key is supplied, `easyYT` will gracefully toggle its embedded physical rules engine. This offline-fallback mode lets you preview full charts, grades, and mock audit recommendations seamlessly without any external connections).*

### 3. Install Dependencies
Run the package installation script:
```bash
npm install
```

### 4. Build the Full-Stack Application
Build the client-side bundle and compile your TypeScript server using the production build script:
```bash
npm run build
```
This bundles the Vite React app into `/dist` and compiles the backend TypeScript server into a streamlined `dist/server.cjs` bundle.

### 5. Launch the Server
To run the high-performance compiled server:
```bash
npm run start
```
The application will boot up and bind to `http://localhost:3000`. Open this address in your browser to experience `easyYT`.

*Optional (Development Mode with Hot Reloading):*
```bash
npm run dev
```

---

## 🧪 5 Curated Test Cases for the Creator Toolbox

Below are 5 high-octane text inputs tailored for each module inside the **Creator Growth Labs (Creator Toolbox)**. Copy-paste these scenarios to explore `easyYT`'s advanced analytical curves, clickbait grading, and cognitive reasoning.

### 📍 Tool 1: Hook & Script Doctor (Hook & Script Grading)
This tool evaluates script openings for cognitive hooks, calculates structural pacing shifts, and generates high-retention alternative intros.

*   **Inputs:**
    *   **Video Niche Focus:** `Coding Vlogs & AI Productivity`
    *   **Competitor / Draft Script:**
        ```text
        You are using ChatGPT completely wrong. Most people just paste general questions and get generic, robotic answers back. But if you click this tiny hidden setting in the profile menu, you can lock in custom instructions that turn it into your own advanced junior developer. In this video, I'll show you exactly how to write this instruction block step by step, which literally saved me 20 hours of coding this week alone.
        ```
*   **What to Expect:** An overall psychological **Hook Grade (e.g., A/B)** with detailed critiques, a tabulated **Milestone Pacing Timeline**, and a beautifully rewritten script block ready to copy-paste.

---

### 📉 Tool 2: Retention Curve Plotter (Predicted Retention Plotter)
Analyze how viewer attention decays over the lifecycle of your content relative to specific transition points or dry segments.

*   **Inputs:**
    *   **Draft Video Outline Section Splits:**
        ```text
        - 0:00 - 0:45 Cold hook showing the ChatGPT profile custom setting
        - 0:45 - 2:15 High-level abstract presentation of LLM context models
        - 2:15 - 5:30 Live code walkthrough of custom configuration JSON
        - 5:30 - 7:00 Sponsor Integration (Long-form product commercial plug)
        - 7:00 - 8:30 Sticking custom instruction templates into the prompt
        - 8:30 - 9:00 Outro overlay with clickable end-screen elements
        ```
*   **What to Expect:** A responsive, interactive **Simulated Retention Percentage Trend Line Graph** powered by Recharts, identifying sharp audience drop-offs (e.g., during the Sponsor segment) along with code-level diagnostic remediation steps.

---

### 🛡️ Tool 3: Anti-Clickbait Auditor (Clickbait Audit)
Audit headlines against authentic video concepts to lock in early viewer satisfaction, keeping CTR high without destroying consumer retention.

*   **Inputs:**
    *   **Proposed Video Title:** `This Hidden ChatGPT Secret Will Put 99% of Coders Out of Work!`
    *   **Authentic Script Outline / Concept Detail:** `A detailed step-by-step coding tutorial showing how to write Custom Instructions JSON inside ChatGPT's settings menu. It automates recurrent boilerplate configurations like CSS and database initializers to save time for beginners, but does not replace real developer jobs.`
    *   **Style Integrity Goal:** `Hyper-Viral / Broad Audience`
*   **What to Expect:** A multi-dimensional breakdown yielding an **Audience Trust Score**, a **Click Potential Score**, an **Integrity Warning Status** (labeled `TOO DRAMATIC` if deceptive), and **3 Balanced Title Alternatives** optimized for high-click alignment.

---

### 🔥 Tool 4: Shorts Funnel Architect (Shorts Funnel Campaign Generator)
Extract high-converting stand-alone micro-moments from your long-form transcript to target YouTube Shorts, TikToks, and Instagram Reels.

*   **Inputs:**
    *   **Video Content Outline to Slice:**
        ```text
        First we start by explaining the concept of automated responsive spacing using CSS container queries inside modern React styled-components. At around 1 minute, we conduct a quick live-coding demo replacing standard tailwind break-points with fluid container query units. Then, we demonstrate support grids for Safari 16+ which is where most complex grids break. Finally, we share an open-source GitHub link with the customized utility classes.
        ```
*   **What to Expect:** Extraction of exactly **3 vertical campaign segments** complete with precise timestamp bounds, dynamic short-form hooks, editing pacing ideas, and action-oriented on-screen call-to-actions (CTAs).

---

### 💵 Tool 5: Brand Sponsorship Calculator (Sponsorship & Monetization)
Determine standard fair-market valuation metrics mapped to your specific niche, views distribution, and geographic audience weight.

*   **Inputs:**
    *   **Video Niche:** `Wealth, Investing & Stock Assets` (or select yours dynamically)
    *   **Average View Count:** `25000`
    *   **Top Geographic Location:** `United States (US)`
    *   **Sponsorship Type:** `30-sec mid-roll integration`
*   **What to Expect:** Calculation of custom **Low to High Sponsorship Ranges**, exact projected **CPM Rates**, and recommended **Negotiation Tactics** detailing high-leverage arguments to present to prospective sponsors.

---

## 🏗️ Technical Architecture

```
easyYT/
├── server.ts             # Compiled Express.js API router + Vite development middleware
├── src/
│   ├── App.tsx          # Main workspace with high-contrast UI, responsive grid, & active routes
│   ├── components/      # Modular layout panels (e.g. CreatorToolbox, ChannelAudit, AICoach)
│   ├── utils/           # Advanced state controllers (e.g. apiFetch, niche detector)
│   └── index.css        # Core custom Tailwind CSS styling rules
├── metadata.json        # Unified app metadata descriptors (Name, Description, capabilities)
└── package.json         # Development dependencies and production compilation workflow
```

Enjoy building and optimizing your YouTube presence securely with **easyYT**!
