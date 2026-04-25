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
        border: "1px solid",
        borderColor: "var(--border)",
        color: "var(--gray-700)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#C6A75E";
        (e.currentTarget as HTMLButtonElement).style.color = "#C6A75E";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--gray-700)";
      }}
    >
      {isAr ? "EN" : "Ar"}
    </button>
  );
}
