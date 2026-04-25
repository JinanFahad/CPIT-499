// =====================================================================
// ConsultantChatPage.tsx — شات المستشار الذكي على دراسة جدوى محددة
// عند الفتح:
//   1) يجيب المشروع من الباك اند للحصول على report_id
//   2) يعرض رسالة ترحيب مع نظرة عامة على المشروع
// عند إرسال سؤال:
//   - يرسل لـ /api/advisor/chat مع report_id + كل تاريخ المحادثة
//   - الـ AI يرد بناءً على دراسة الجدوى الكاملة للمشروع
// =====================================================================

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { Send, Loader2, Bot, User, Lightbulb } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";

const BACKEND_URL = "http://localhost:5000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ConsultantChatPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    if (!projectId) return;

    fetch(`${BACKEND_URL}/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.id) return;
        setProject(data);

        const projectName = isAr ? data.project_name : (data.project_name_en || data.project_name);
        const city = isAr ? data.city : (data.city_en || data.city);
        const capital = data.capital ? data.capital.toLocaleString() : "—";
        const customers = data.customers_per_day || "—";

        setMessages([
          {
            id: "1",
            role: "assistant",
            content: isAr
              ? `مرحباً! 👋\n\nأنا مساعدك الاستشاري المتخصص. سأساعدك في تحليل ومناقشة مشروع "${projectName}".\n\n**نظرة سريعة على مشروعك:**\n• رأس المال: ${capital} ر.س\n• المدينة: ${city}\n• العملاء اليومي: ${customers}\n\nكيف يمكنني مساعدتك اليوم؟ يمكنني:\n✓ تحليل جدوى مشروعك بناءً على دراسة الجدوى\n✓ اقتراح تحسينات\n✓ مناقشة المخاطر والفرص\n✓ المساعدة في التخطيط المالي`
              : `Hello! 👋\n\nI'm your specialized AI consultant. I'll help you analyze and discuss your project "${projectName}".\n\n**Quick overview:**\n• Capital: ${capital} SAR\n• City: ${city}\n• Expected daily customers: ${customers}\n\nHow can I help you today? I can:\n✓ Analyze your project feasibility based on the study\n✓ Suggest improvements\n✓ Discuss risks and opportunities\n✓ Help with financial planning`,
            timestamp: new Date(),
          },
        ]);
      })
      .catch(() => setProject(null));
  }, [projectId, isAr]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // إرسال رسالة جديدة للمستشار:
  // - تتأكد من وجود تقرير مرتبط بالمشروع
  // - ترسل سؤال + كل المحادثة السابقة (history) للـ AI
  // - تظهر "يكتب..." أثناء الانتظار
  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || !project) return;

    if (!project.report_id) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: isAr
            ? "❌ لا توجد دراسة جدوى مرتبطة بهذا المشروع. أعيدي إنشاء المشروع أو عدّليه لإعادة توليد الدراسة."
            : "❌ No feasibility report linked to this project. Re-create or edit the project to regenerate the study.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    const messageText = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Build history from existing messages (skip initial welcome)
    const history = messages
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch(`${BACKEND_URL}/api/advisor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: project.report_id,
          message: messageText,
          history,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Server error");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply || (isAr ? "عذرًا، لم أتمكن من الرد" : "Sorry, no response"),
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isAr
            ? "❌ تعذّر الاتصال بالخادم. تأكدي أن الباك اند شغّال."
            : "❌ Failed to connect to server. Make sure the backend is running.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-transparent">
        <div className="text-center">
          <div className="text-[#08312D] dark:text-gray-900 text-xl mb-4 font-[Changa]">
            {isAr ? "جاري تحميل بيانات المشروع..." : "Loading project data..."}
          </div>
          <Loader2 className="w-8 h-8 text-[#C6A75E] dark:text-secondary-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div
        className="min-h-screen bg-transparent p-6 lg:p-8"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
          {/* Page Header */}
          <motion.div
            className="bg-white dark:bg-gray-200 rounded-xl p-8 border border-gray-200 dark:border-gray-300 shadow-sm mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-lg bg-[#C6A75E] dark:bg-secondary-600 flex items-center justify-center">
                    <Lightbulb className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-[#08312d] dark:text-gray-900">
                    {isAr ? "المستشار الذكي" : "AI Consultant"}
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-700 text-lg font-medium mr-[68px] font-[Changa]">
                  {project
                    ? isAr
                      ? `استشارات حول: ${project.project_name || "مشروعك"}`
                      : `Consulting about: ${project.project_name_en || project.project_name || "your project"}`
                    : isAr
                      ? "استشارات لمشروعك"
                      : "Project consultation"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Chat Container */}
          <motion.div
            className="flex-1 bg-white dark:bg-gray-200 rounded-xl border border-gray-200 dark:border-gray-300 shadow-sm flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-[#08312D] dark:bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        message.role === "user"
                          ? "bg-[#08312D] dark:bg-primary-600 text-white"
                          : "bg-gray-50 dark:bg-gray-100 text-[#08312D] dark:text-gray-900 border border-gray-200 dark:border-gray-300"
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed text-sm font-medium font-[Changa]">
                        {message.content}
                      </p>
                      <span
                        className={`text-[10px] mt-1.5 block ${message.role === "user" ? "text-gray-200" : "text-gray-500 dark:text-gray-600"}`}
                      >
                        {message.timestamp.toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-[#C6A75E] dark:bg-secondary-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </motion.div>
                </div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-[#08312D] dark:bg-primary-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-100 rounded-2xl px-4 py-2.5 border border-gray-200 dark:border-gray-300">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-300 p-4">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب سؤالك هنا..."
                  className="flex-1 bg-gray-50 dark:bg-gray-100 border-gray-300 dark:border-gray-400 text-[#08312D] dark:text-gray-900 placeholder:text-gray-500 text-base py-6 font-[Changa]"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="px-6 py-6 bg-[#C6A75E] dark:bg-secondary-600 hover:bg-[#a88f4e] dark:hover:bg-secondary-700 disabled:opacity-50"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
