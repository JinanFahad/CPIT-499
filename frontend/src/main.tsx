// =====================================================================
// main.tsx — Entry point for the React application
// =====================================================================
// This file is what Vite loads first when the page boots.
// It mounts the React app onto the <div id="root"> in index.html.
// =====================================================================

// React 18+ way to mount a React tree to a DOM node
import { createRoot } from "react-dom/client";

// The root component (sets up all Providers + routing)
import App from "./app/App.tsx";

// Global styles — Tailwind base + theme variables + custom CSS
// (importing CSS here injects it into the build automatically)
import "./styles/index.css";

// Find the <div id="root"> in index.html and render the app inside it.
// The "!" tells TypeScript "trust me, this element definitely exists".
createRoot(document.getElementById("root")!).render(<App />);
