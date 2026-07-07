# File structure diagram

```mermaid
flowchart TD
  A[index.html] --> B[index.ts]
  B --> C[index2.ts]
  B --> D[dashboardscreen.tsx]
  B --> E[taskscreen.tsx]
  B --> F[sensoryscreen.tsx]
  B --> G[energyscreen.tsx]
  B --> H[recoveryscreen.tsx]
  B --> I[ui.tsx]
  C --> J[store state]
  D --> J
  E --> J
  F --> J
  G --> J
  H --> J
  J --> K[future mobile wrapper / native shell]
```

## Notes
- The current app is web-first, but the shared state and screen modules are isolated so they can be reused in a future mobile build.
- Health integrations from phones, wearables, and rings can be added as future extensions without rewriting the core experience.
