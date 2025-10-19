::: mermaid
flowchart TD
    A[Frontend calls Backend api/assess] --> B[Backend receives businessIds, project's budget, grant and description]
    B --> C["Fetches Financial Stats<br/>(API or other solution)"]
    B --> D["Fetches Previous Business Finland Funding<br/>(JSON file or local DB)"]
    B --> E["Analyzes Project description in terms of novelty and strategic fit<br/>(Gemini LLM API)"]
    C & D & E --> F["Runs collected data through some formula"]
    F --> G[Responds with success probability, company risks and LLM feedback ]
