import { useState, useRef, useEffect, useMemo } from "react";

import { Building2, Bot, User, Send, Loader2 } from "lucide-react";

import { motion } from "motion/react";
import { Header } from "../components/Header";
import { SparkleField } from "../components/SparkleField";
import { useLanguage } from "../contexts/LanguageContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { BACKEND_URL } from "../config";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  showOptions?: "main" | "procedures" | "none";
}

export default function GovernmentProceduresPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const getInitialMessage = (ar: boolean): Message => ({
    id: 1,
    text: ar
      ? "مرحباً بك في مساعد الإجراءات الحكومية! 👋\n\nأنا هنا لمساعدتك في معرفة جميع التراخيص والإجراءات اللازمة لمشروعك في قطاع المطاعم والكافيهات.\n\nاختر من الخيارات بالأسفل:"
      : "Welcome to the Government Procedures Assistant! 👋\n\nI'm here to help you with all licenses and procedures required for your restaurant or café.\n\nChoose from the options below:",
    sender: "bot",
    timestamp: new Date(),
    showOptions: "main",
  });

  const [messages, setMessages] = useState<Message[]>([
    getInitialMessage(isAr),
  ]);

  useEffect(() => {
    setMessages([getInitialMessage(isAr)]);
  }, [language]);

  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem("gov_session_id");
    if (existing) return existing;
    const newId = `gov_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("gov_session_id", newId);
    return newId;
  });

  const fetchBotResponse = async (message: string): Promise<string> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/government/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message, language }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      return (
        data.reply ||
        (isAr ? "عذرًا، لم أتمكن من الإجابة" : "Sorry, no response")
      );
    } catch {
      return isAr
        ? "❌ تعذّر الاتصال بالخادم. تأكدي أن الباك اند شغّال."
        : "❌ Failed to connect to server. Make sure the backend is running.";
    }
  };

  const mainOptions = useMemo(
    () => [
      {
        id: 1,
        text: isAr ? "الإجراءات الحكومية" : "Government Procedures",
        action: "procedures",
      },
      {
        id: 2,
        text: isAr ? "ما الترتيب الأفضل للإجراءات؟" : "What's the best order?",
        action: "order",
      },
      {
        id: 3,
        text: isAr ? "التكلفة الإجمالية للإجراءات" : "Total cost of procedures",
        action: "cost",
      },
    ],
    [isAr],
  );

  const proceduresOptions = useMemo(
    () => [
      {
        id: 1,
        text: isAr ? "السجل التجاري" : "Commercial Registration",
        query: isAr
          ? "اشرح لي خطوات استخراج السجل التجاري لمطعم/كافيه"
          : "Explain the steps to issue a Commercial Registration for a restaurant or cafe",
      },
      {
        id: 2,
        text: isAr ? "الرقم الضريبي" : "Tax Number",
        query: isAr
          ? "اشرح لي خطوات استخراج الرقم الضريبي من هيئة الزكاة والضريبة لمطعم/كافيه"
          : "Explain the steps to issue a Tax Number from ZATCA for a restaurant or cafe",
      },
      {
        id: 3,
        text: isAr ? "رخصة البلدية" : "Municipal License",
        query: isAr
          ? "اشرح لي خطوات استخراج رخصة البلدية لمطعم/كافيه"
          : "Explain the steps to issue a Municipal License for a restaurant or cafe",
      },
      {
        id: 4,
        text: isAr ? "رخصة الدفاع المدني" : "Civil Defense License",
        query: isAr
          ? "اشرح لي خطوات استخراج رخصة الدفاع المدني لمطعم/كافيه"
          : "Explain the steps to issue a Civil Defense License for a restaurant or cafe",
      },
      {
        id: 5,
        text: isAr ? "التأمينات الاجتماعية" : "Social Insurance",
        query: isAr
          ? "اشرح لي خطوات تسجيل المنشأة في التأمينات الاجتماعية لمطعم/كافيه"
          : "Explain the steps to register the business with GOSI (Social Insurance) for a restaurant or cafe",
      },
      {
        id: 6,
        text: isAr ? "رخصة العمل للأجانب" : "Work Permits",
        query: isAr
          ? "اشرح لي خطوات استخراج رخصة العمل للأجانب لمطعم/كافيه"
          : "Explain the steps to issue Work Permits for foreign employees in a restaurant or cafe",
      },
    ],
    [isAr],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const messageText = inputValue;
    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    const reply = await fetchBotResponse(messageText);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        text: reply,
        sender: "bot",
        timestamp: new Date(),
        showOptions: "main",
      },
    ]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMainOption = async (action: string) => {
    let userText = "";
    let apiQuery = "";
    let instantReply: string | null = null;
    let showOptions: "main" | "procedures" | "none" = "main";

    if (action === "order") {
      userText = isAr
        ? "ما الترتيب الأفضل للإجراءات؟"
        : "What's the best order for the procedures?";
      apiQuery = userText;
    } else if (action === "procedures") {
      userText = isAr ? "الإجراءات الحكومية" : "Government Procedures";
      instantReply = isAr
        ? "📋 اختاري الإجراء الي تبغين تفاصيله:"
        : "📋 Select the procedure you'd like details on:";
      showOptions = "procedures";
    } else if (action === "cost") {
      userText = isAr
        ? "كم التكلفة الإجمالية لجميع الإجراءات الحكومية؟"
        : "What's the total cost of all government procedures?";
      apiQuery = userText;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: userText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const reply = instantReply ?? (await fetchBotResponse(apiQuery));

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        text: reply,
        sender: "bot",
        timestamp: new Date(),
        showOptions,
      },
    ]);
    setIsTyping(false);
  };

  const handleQuickOption = async (query: string, displayText?: string) => {
    const userMessage: Message = {
      id: Date.now(),
      text: displayText || query,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const reply = await fetchBotResponse(query);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        text: reply,
        sender: "bot",
        timestamp: new Date(),
        showOptions: "main",
      },
    ]);
    setIsTyping(false);
  };

  return (
    <>
      <Header />
      <div
        className="min-h-screen bg-transparent p-6 lg:p-8 relative"
        dir={isAr ? "rtl" : "ltr"}
      >
        <SparkleField />
        <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
          {/* Header */}
          <motion.div
            className="bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl p-8 border border-[#C6A75E]/30 card-glow mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-lg bg-[#C6A75E] dark:bg-secondary-600 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-[#08312d] dark:text-white">
                    {isAr
                      ? "مساعد الإجراءات الحكومية"
                      : "Government Procedures Assistant"}
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-white/70 text-lg font-medium mr-[68px] font-[Changa]">
                  {isAr
                    ? "اسأل عن أي إجراء حكومي لمشروعك"
                    : "Ask about any government procedure for your project"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Chat Container */}
          <motion.div
            className="flex-1 bg-white/80 dark:bg-[#08312D]/40 backdrop-blur-md rounded-2xl border border-[#C6A75E]/30 card-glow flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "bot" && (
                      <div className="w-8 h-8 rounded-full bg-[#08312D] dark:bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        message.sender === "user"
                          ? "bg-[#08312D] dark:bg-primary-600 text-white"
                          : "bg-gray-50 dark:bg-[#062620] text-[#08312D] dark:text-white border border-gray-200 dark:border-white/15"
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed text-sm font-medium font-[Changa]">
                        {message.text}
                      </p>
                      <span
                        className={`text-[10px] mt-1.5 block ${message.sender === "user" ? "text-gray-200" : "text-gray-500 dark:text-white/50"}`}
                      >
                        {message.timestamp.toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {message.sender === "user" && (
                      <div className="w-8 h-8 rounded-full bg-[#C6A75E] dark:bg-secondary-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </motion.div>

                  {/* Show options if this is the last message and it's from bot */}
                  {message.sender === "bot" &&
                    index === messages.length - 1 &&
                    message.showOptions !== "none" &&
                    !isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="flex flex-col gap-2 ms-10 mt-2 max-w-[55%]"
                      >
                        {message.showOptions === "main" &&
                          mainOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleMainOption(option.action)}
                              disabled={isTyping}
                              className="w-full bg-white dark:bg-[#062620] hover:bg-gray-50 dark:hover:bg-[#08312D] border-2 border-[#08312D] dark:border-[#C6A75E]/50 text-[#08312D] dark:text-white rounded-lg px-3 py-2 text-center font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[Changa]"
                              style={{ fontSize: "12px" }}
                            >
                              {option.text}
                            </button>
                          ))}
                        {message.showOptions === "procedures" &&
                          proceduresOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() =>
                                handleQuickOption(option.query, option.text)
                              }
                              disabled={isTyping}
                              className="w-full bg-white dark:bg-[#062620] hover:bg-gray-50 dark:hover:bg-[#08312D] border-2 border-[#08312D] dark:border-[#C6A75E]/50 text-[#08312D] dark:text-white rounded-lg px-3 py-2 text-center font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[Changa]"
                              style={{ fontSize: "12px" }}
                            >
                              {option.text}
                            </button>
                          ))}
                      </motion.div>
                    )}
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
                  <div className="bg-gray-50 dark:bg-[#062620] rounded-2xl px-4 py-2.5 border border-gray-200 dark:border-white/15">
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
            <div className="border-t border-gray-200 dark:border-[#C6A75E]/20 p-4">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isAr ? "اكتبي سؤالك هنا..." : "Type your question here..."
                  }
                  className="flex-1 bg-gray-50 dark:bg-[#062620] border-gray-300 dark:border-white/20 text-[#08312D] dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 text-base py-6 font-[Changa]"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
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
