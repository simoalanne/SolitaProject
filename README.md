# Solita Boost – Cheatsheet

## How to set up

### Environment variables
Create a `.env` file inside `src/backend`.

Add the following to `src/backend/.env`:
```env
GEMINI_API_KEY=your_Google_Gemini_API_key
```

### How to run

Locally:
```command
npm install && npm run start
```

Via Docker (if installed):
```command
npm run start:docker
```

Development (live reload):
```command
npm run dev
```

## Backend endpoints

when running the app see http://localhost:3000/api/docs/ for guidance (adjust port if needed)

## Calling the backend — examples

```javascript 
await fetch("api/companies/by-business-id...")
``` 
Or 

```javascript
await axios.post("/api/assess", projectInput)
```
