// Central app config. Edit values here — every page imports from this file.
//
// BACKEND_URL points at the Flask API. In development it falls back to the
// localhost dev server; in production set VITE_BACKEND_URL in `.env` (or
// in your hosting platform's env settings) to your deployed API origin.
export const BACKEND_URL: string =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";
