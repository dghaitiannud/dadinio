import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 🔐 SECURITY FIX #4: Safe service worker registration with error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swPath)
      .then(registration => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch(err => {
        // Service Worker is optional - app works without it
        console.warn('Service Worker registration failed (non-fatal):', err);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found! Check index.html');
}

const root = createRoot(rootElement);
root.render(<App />);
