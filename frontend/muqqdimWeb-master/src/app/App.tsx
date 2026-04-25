// =====================================================================
// App.tsx — الجذر الرئيسي للتطبيق
// نلفّ كل شي بـ Providers عشان كل الصفحات تقدر تستخدم:
//   - ThemeProvider: التحكم بالوضع الليلي/الفاتح
//   - LanguageProvider: التحكم باللغة (عربي/إنجليزي)
// و RouterProvider يفعّل التنقل بين الصفحات
// =====================================================================

import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;