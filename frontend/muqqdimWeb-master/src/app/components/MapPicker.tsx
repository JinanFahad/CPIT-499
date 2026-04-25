// =====================================================================
// MapPicker.tsx — مكوّن نافذة منبثقة لاختيار موقع على خريطة Google
// يستخدمها: FeasibilityStudyPage, EditProjectPage, MarketAnalysisPage
// المميزات:
//   - خريطة Google Maps حقيقية بلغة عربية
//   - بحث مع Autocomplete (يقترح أحياء/شوارع وأنت تكتب)
//   - الضغط على الخريطة → يسقط دبوس ذهبي
//   - زر "استخدم هذا الموقع" يرسل lat/lng للصفحة الأم
// =====================================================================

import { useEffect, useRef, useState } from "react";
import { X, MapPin, Search, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MapPickerProps {
  open: boolean;
  initialLat?: string;
  initialLng?: string;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
}

const GOOGLE_API_KEY = "AIzaSyCMVLHJiz-3hOnp-oOPPE2r72fjKwf6xcQ";

// نخزّن الـ Promise عشان نتأكد إن مكتبة Google Maps تنحمّل مرة واحدة فقط
// حتى لو فتح المستخدم الـ MapPicker عدة مرات
let googleMapsLoadPromise: Promise<void> | null = null;

// تحميل سكريبت Google Maps ديناميكياً (نطلبه مرة واحدة عند أول استخدام)
function loadGoogleMaps(): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&language=ar`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      googleMapsLoadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
  return googleMapsLoadPromise;
}

export function MapPicker({ open, initialLat, initialLng, onClose, onSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // عند فتح النافذة:
  //   1) نحمّل Google Maps (لو ما اتحمّلت بعد)
  //   2) نرسم الخريطة على mapRef
  //   3) لو فيه إحداثيات سابقة (وضع التعديل) نسقط دبوس فوقها
  //   4) نضيف listener للضغط على الخريطة
  //   5) نضيف Autocomplete لخانة البحث
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setSelectedLat(initialLat ? Number(initialLat) : null);
    setSelectedLng(initialLng ? Number(initialLng) : null);

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const google = (window as any).google;

        const startLat = initialLat ? Number(initialLat) : 24.7136;
        const startLng = initialLng ? Number(initialLng) : 46.6753;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: startLat, lng: startLng },
          zoom: initialLat && initialLng ? 15 : 12,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        mapInstance.current = map;

        const placeMarker = (lat: number, lng: number, animate = false) => {
          if (markerInstance.current) markerInstance.current.setMap(null);
          markerInstance.current = new google.maps.Marker({
            position: { lat, lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 11,
              fillColor: "#C6A75E",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
            animation: animate ? google.maps.Animation.DROP : undefined,
          });
          setSelectedLat(lat);
          setSelectedLng(lng);
        };

        if (initialLat && initialLng) {
          placeMarker(Number(initialLat), Number(initialLng));
        }

        map.addListener("click", (event: any) => {
          placeMarker(event.latLng.lat(), event.latLng.lng(), true);
        });

        if (searchRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
            language: "ar",
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;
            map.panTo(place.geometry.location);
            if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
            else map.setZoom(15);
          });
        }

        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (markerInstance.current) markerInstance.current.setMap(null);
      markerInstance.current = null;
      mapInstance.current = null;
    };
  }, [open, initialLat, initialLng]);

  // عند الضغط على "استخدم هذا الموقع":
  // نرسل الإحداثيات للصفحة الأم ونقفل النافذة
  const handleConfirm = () => {
    if (selectedLat !== null && selectedLng !== null) {
      onSelect(selectedLat, selectedLng);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Autocomplete dropdown must float above the modal */}
          <style>{`.pac-container { z-index: 100000 !important; font-family: 'Changa', sans-serif !important; }`}</style>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-gray-200 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-gray-200"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#FFF9F0]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-[#C6A75E] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#08312D] font-[Changa]">تحديد موقع المشروع</h2>
                    <p className="text-xs text-gray-600 font-[Changa] mt-0.5">
                      ابحث عن موقع أو اضغط على الخريطة لوضع دبوس
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              {/* Search */}
              <div className="px-6 py-3 bg-white border-b border-gray-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#C6A75E] pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="ابحث عن حي، شارع، أو مدينة..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pr-10 pl-4 py-2.5 text-[#08312D] placeholder:text-gray-400 font-[Changa] text-sm focus:ring-2 focus:ring-[#C6A75E] focus:border-[#C6A75E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Map */}
              <div className="flex-1 relative bg-gray-100">
                {loading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#C6A75E] animate-spin" />
                      <span className="text-sm text-gray-600 font-[Changa]">جاري تحميل الخريطة...</span>
                    </div>
                  </div>
                )}
                <div ref={mapRef} className="w-full h-full" />
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-[#FFF9F0]">
                <div className="text-sm font-[Changa]">
                  {selectedLat !== null && selectedLng !== null ? (
                    <span className="flex items-center gap-2 text-[#08312D]">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-medium">
                        تم تحديد الموقع: {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-500">اضغط على الخريطة لتحديد الموقع</span>
                  )}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-[Changa] font-semibold text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={selectedLat === null || selectedLng === null}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C6A75E] hover:bg-[#a88f4e] text-white font-[Changa] font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    استخدم هذا الموقع
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
