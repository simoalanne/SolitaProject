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

1. Assess a project  
    - POST `/api/assess` — takes project input and returns assessment output.

2. Get company by business ID  
    - GET `/api/companies/by-business-id?businessId=1234567-8` — returns company name.

3. Autocomplete company names  
    - GET `/api/companies/autocomplete?partialName=partialCompanyName&limit=X` — returns a list of pairs: business ID + company name.

See [src/backend/test.http](src/backend/test.http) for example calls.

## Calling the backend — examples

```javascript 
await fetch("api/companies/by-business-id...")
``` 
Or 

```javascript
await axios.post("/api/assess", projectInput)
```
