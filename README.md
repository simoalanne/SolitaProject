# FundingAssessmentTool

Full-stack application designed to evaluate multi-company R&D or innovation projects.

## Table of Contents
- [Concept](#concept)
- [Overview](#overview)
- [Key Features](#key-features)
  - [Frontend](#frontend)
  - [Multi-Company Assessment](#multi-company-assessment)
  - [Financial Data Input](#financial-data-input)
  - [Funding History](#funding-history)
  - [Enhanced PRH Company Search](#enhanced-prh-company-search)
  - [AI-Assisted Text Analysis](#ai-assisted-text-analysis)
  - [Configurable Rule Engine](#configurable-rule-engine)
- [Score Aggregation](#score-aggregation)
- [Tech Stack](#tech-stack)
- [Running the Project](#running-the-project)
  - [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Data Sources](#data-sources)

## Concept

The tool combines deterministic financial rules, historical funding data, and AI-powered text interpretation to provide clear feedback on project readiness and potential fit for public funding.  
The overall assessment result is **not** intended as a prediction or guarantee of funding. Instead, the tool’s value comes from helping users identify potential weaknesses, highlight strengths, and better understand how an application may be perceived.

## Overview

Users provide project details, company information, financial data, and textual descriptions. These inputs are analyzed through a combination of structured rule-based logic and AI-driven interpretation, resulting in a clear and readable summary of strengths, risks, and alignment with common funding criteria.

The system mirrors many patterns used in real-world evaluation processes by public funding organizations. While it cannot cover every nuance of actual decision-making, it is designed to be highly customizable, extendable, and adaptable to different assessment styles.

This tool has been developed in collaboration with **Solita Oy** and **Tampere University of Applied Sciences (TAMK)**.

## Screenshots
- TBA

## Key Features

### Frontend

The UI is a responsive, form-driven interface with:
- Live input validation and autocomplete  
- Finnish and English localization
- Light and dark mode support
- About page that make it easy to understand how the tool works

### Multi-Company Assessment
Users can define one or multiple participating companies, each with:
- Business ID  
- Budget and requested funding  
- Role description  
- Financial inputs when applicable  
- Additional context such as whether the company should be treated as a startup or an R&D-driven organization  

### Financial Data Input
Finland has no public API for company financials, so the tool provides two user-friendly alternatives:
- Direct manual entry  
- Smart parsing of pasted financial data copied directly from sources like Kauppalehti  

### Funding History
Historical funding information is sourced from Business Finland.  
Because there is no official API for this data either, the repository includes:
- A local dataset stored in the backend  
- A Playwright-based automation script for downloading updated funding files from the Business Finland website  

This keeps funding history data easily and reliably up to date.

### Enhanced PRH Company Search
Company autocomplete and Business ID lookups rely on the existing PRH API.  
The backend improves the raw responses by applying custom sorting, filtering, and name selection logic to provide more relevant results to end users.

### AI-Assisted Text Analysis
An LLM (Gemini) assists with evaluating:
- Project description (strategic fit, novelty)  
- Company role descriptions (clarity, relevance)  

The AI component is used only where interpretive text analysis adds meaningful value. It does not replace the rule-based evaluation.

### Configurable Rule Engine
All rules and weights can be adjusted, including:
- Financial ratio thresholds  
- Funding risk parameters  
- Category-level weightings  

This enables tailoring the strictness of the evaluation or exploring alternative scoring models.

## Score Aggregation

Scores are combined using configurable weighted averages.  
Company-level scores are scaled according to each company’s relative budget share, ensuring balanced multi-company evaluation.

## Tech Stack

- Frontend: React, TypeScript, Vite  
- Backend: Express, TypeScript  
- Validation & Shared Models: Zod  
- OpenAPI: Live, partly automated API documentation generated from Zod schemas  
- Automation: Playwright script for funding data retrieval (located in `src/setup/`)  
- Containerization: Docker  

## Running the Project

Install dependencies:
```
npm install
```

Start both backend and frontend:
```
npm run start
```

Development mode:
```
npm run dev
```

Run via Docker:
```
npm run start:docker
```

### Environment Variables
Create `src/backend/.env`:
```
GEMINI_API_KEY=your_key_here
```
Optional — without it, the AI analysis is simply skipped.

## API Documentation

OpenAPI documentation is available at runtime:
```
http://localhost:3000/api/docs/
```
(Adjust the port as needed.)

## Data Sources

### Funding History
- Stored locally as JSON  
- Updated using a Playwright script that fetches the latest datasets from the Business Finland website  

### Company Search
- Uses the PRH company API with improved backend-side relevance ranking  

### Financial Data
- Entered manually or parsed from pasted financial information using custom frontend parsing logic  
