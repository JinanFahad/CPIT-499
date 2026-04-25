import { Link } from "react-router";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-[#C6A75E] font-[Changa]">404</h1>
        <h2 className="text-3xl font-bold text-[#08312D] mt-4 font-[Changa]">الصفحة غير موجودة</h2>
        <p className="text-gray-600 mt-4 max-w-md font-[Changa]">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى موقع آخر.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 bg-[#08312D] hover:bg-[#0E4A43] rounded-lg px-6 py-3 text-white font-bold transition-all shadow-md font-[Changa]"
        >
          <Home className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}