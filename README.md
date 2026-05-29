ApexPath is an immersive, high-performance horizontal pathfinding visualizer and tactical strategy engine designed to simulate and optimize racing lines across diverse motorsport disciplines—including **Formula 1, WRC Rally, Dakar Rally, MotoGP, NASCAR, and Motocross**.

Powered by Google's Gemini API, Firebase, and a rich suite of pathfinding algorithms, ApexPath delivers professional-grade telemetry, real-time auditory feedback of roaring F1 engines, and a hyper-polished "Antigravity-inspired" dark dashboard with a custom mechanical speedometer.

🚀 Key Features

* 🏎️ Motorsport Discipline Selector**: Instantly toggle between F1 (Asphalt), Rally (Dirt), Dakar (Sand), MotoGP (Leans), NASCAR (Ovals), and Motocross (Mud) to tune optimization priorities.
* 🛠️ Deep Algorithm Suite (10 Engines)**:
    *   *Uninformed*: Breadth-First Search (BFS), Depth-First Search (DFS).
    *   *Heuristic*: Neural A*, Best-First Pursuit, Greedy Apex Strategy.
    *   *Specialized*: Dijkstra, Hill-Climbing, Simulated Annealing, Genetic Algorithm, Beam Search.
* 🧠 ApexAI Strategist**: Real-time racing strategy feedback analyzing tyre management, sector latency, overtaking corridors, and racing line optimization using motorsport telemetry.
* 📉 Real-Time Speedometer & Audio**: Experience realistic acceleration via a background speedometer synced directly to computational progress, backed by a roaring F1 engine audio cycle.
* 🚧 Custom Track Modeling**: Interactive brush tools to draw **Track Barriers**, **Oil Slicks** (traction loss), **Water Puddles** (aquaplaning hazards), and **Slipstreams** (drag reduction corridors).
* 💾 Cloud Telemetry Archives**: Seamless Google Authentication and Firestore mapping to save, compare, and study previous fast-lapping sessions.


🛠️ Technology Stack

*   Frontend: React (TypeScript), Vite, Framer Motion (for high-fidelity fluid entry animations).
*   Backend: Express Server handles proxy request security for Gemini API.
*   Styling: Tailwind CSS (featuring custom glassmorphism, scanner line effects, and a neon-carbon aesthetic).
*   Database & Auth: Firebase Auth and Firestore.
*   AI Integration: `@google/genai` (utilizing `gemini-3-flash-preview`).

Prerequisites:  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
