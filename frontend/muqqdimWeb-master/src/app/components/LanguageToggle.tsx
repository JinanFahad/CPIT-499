// Hook that gives us the current language + the toggleLanguage function
import { useLanguage } from "../contexts/LanguageContext";

export function LanguageToggle() {
  // Pull the current language + toggle function from the global LanguageContext
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar"; // shorthand for Arabic check

  return (
    <button
      onClick={toggleLanguage}
      // Accessibility label describes the ACTION the button will perform
      aria-label={isAr ? "Switch to English" : "التبديل للعربية"}
      className="flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 font-[Changa] font-semibold text-sm"
      // Inline style for the default gold border + transparent background
      style={{
        background: "transparent",
        border: "1px solid #C6A75E",
        color: "#C6A75E",
      }}
      // On hover: brighten the gold to #D4AF37 (richer gold)
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4AF37";
        (e.currentTarget as HTMLButtonElement).style.color = "#D4AF37";
      }}
      // On mouse leave: restore the original gold
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#C6A75E";
        (e.currentTarget as HTMLButtonElement).style.color = "#C6A75E";
      }}
    >
      {/* Label is the OTHER language (clicking switches to it) */}
      {isAr ? "EN" : "Ar"}
    </button>
  );
}
