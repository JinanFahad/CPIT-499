// =====================================================================
// App.tsx — Root component of the application
// =====================================================================
// This is the top-level component that wraps everything else.
// It sets up the global Providers so every page/component below
// can access shared state without prop-drilling.
//
// The Providers used (in nesting order from outermost to innermost):
//   - ThemeProvider:    controls light/dark mode (saved in localStorage)
//   - LanguageProvider: controls the language ar/en (saved in localStorage)
//   - RouterProvider:   enables client-side navigation between pages
// =====================================================================

// Router from react-router that drives the URL ↔ component mapping
import { RouterProvider } from 'react-router';

// The router config (defines all the routes — see routes.tsx)
import { router } from './routes';

// Global state Providers (Context API)
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';


function App() {
  return (
    // Theme is the outermost wrapper because Language uses theme's localStorage too
    <ThemeProvider>
      <LanguageProvider>
        {/* RouterProvider replaces the children with whatever page matches the URL */}
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
