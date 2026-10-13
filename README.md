# ApexPath

ApexPath is an immersive, high-performance horizontal pathfinding visualizer and tactical strategy engine designed to simulate and optimize racing lines across diverse motorsport disciplines—including Formula 1, WRC Rally, Dakar Rally, MotoGP, NASCAR, and Motocross.

Powered by Google's Gemini API, Firebase, and a robust suite of pathfinding algorithms, ApexPath delivers professional-grade telemetry, real-time auditory feedback of dynamic racing engines, and an Antigravity-inspired dark dashboard with a custom mechanical speedometer.

---

## Key Features

- **Motorsport Discipline Selector**: Instantly toggle between F1 (Asphalt), Rally (Dirt), Dakar (Sand), MotoGP (Leans), NASCAR (Ovals), and Motocross (Mud) to adapt optimization priorities.
- **Deep Algorithm Suite (10 Engines)**:
  - *Uninformed*: Breadth-First Search (BFS), Depth-First Search (DFS).
  - *Heuristic*: Neural A*, Best-First Pursuit, Greedy Apex Strategy.
  - *Specialized*: Dijkstra, Hill-Climbing, Simulated Annealing, Genetic Algorithm, Beam Search.
- **ApexAI Strategist**: Real-time racing strategy feedback analyzing tyre management, sector latency, overtaking corridors, and racing line optimization using motorsport telemetry.
- **Real-Time Speedometer & Audio**: Experience realistic acceleration via a mechanical speedometer synced directly to computational progress, backed by dynamic engine sound cycles.
- **Custom Track Modeling**: Interactive brush tools to place Track Barriers, Oil Slicks (traction loss), Water Puddles (aquaplaning hazards), and Slipstreams (drag reduction corridors).
- **Cloud Telemetry Archives**: Seamless Google Authentication and Firestore mapping to save, compare, and study previous fast-lapping sessions.

---

## Technology Stack

- **Frontend**: React (TypeScript), Vite, Framer Motion
- **Styling**: Tailwind CSS (featuring custom glassmorphism, scanner line effects, and a neon-carbon aesthetic)
- **Backend**: Express (handles secure proxy requests for Gemini API)
- **Database & Auth**: Firebase Auth and Cloud Firestore
- **AI Integration**: `@google/genai` (utilizing Gemini 3 Flash Preview)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Gemini API Key from Google AI Studio

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/rishipatel1011/ApexPath.git](https://github.com/rishipatel1011/ApexPath.git)
   cd ApexPath
