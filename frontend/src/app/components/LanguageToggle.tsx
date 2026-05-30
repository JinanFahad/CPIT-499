import { useLanguage } from "../contexts/LanguageContext";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar";

  return (
    <button
      onClick={toggleLanguage}
      aria-label={isAr ? "Switch to English" : "التبديل للعربية"}
      className="flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 font-[Changa] font-semibold text-sm"
      style={{
        background: "transparent",
        border: "1px solid #C6A75E",
        color: "#C6A75E",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4AF37";
        (e.currentTarget as HTMLButtonElement).style.color = "#D4AF37";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#C6A75E";
        (e.currentTarget as HTMLButtonElement).style.color = "#C6A75E";
      }}
    >
      {isAr ? "EN" : "Ar"}
    </button>
  );
}
