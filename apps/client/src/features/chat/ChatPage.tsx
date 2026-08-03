import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createLogger } from "../../lib/logger";
import api from "../../lib/api";
import { Send, User, Bot, MessageCircle } from "lucide-react";

const logger = createLogger("ChatPage");

const quickPrompts = [
  "I need his CV",
  "Tell me about his projects",
  "I need a service",
  "What technologies does he use?",
];

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load history if logged in
  useEffect(() => {
    if (user && !historyLoaded) {
      api
        .get("/chat/history")
        .then((res) => {
          logger.log("Chat history loaded");
          // Just take the latest conversation if exists, or start fresh
          const conversations = res.data;
          if (conversations.length > 0) {
            const lastConv = conversations[conversations.length - 1];
            setConversationId(lastConv.conversationId);
            setMessages(lastConv.messages);
          }
        })
        .catch(() => {})
        .finally(() => setHistoryLoaded(true));
    }
  }, [user, historyLoaded]);

  // Pre-fill input from URL param
  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg && !loading && messages.length === 0) {
      handleSend(msg);
    }
  }, [searchParams]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message) return;
    setInput("");

    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post("/chat/message", {
        message,
        conversationId,
      });
      const aiMsg: Message = { role: "ai", content: res.data.response };
      setMessages((prev) => [...prev, aiMsg]);
      setConversationId(res.data.conversationId);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-base-200">
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center pt-20">
            <MessageCircle className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h2 className="text-2xl font-bold font-['Cormorant_Garamond'] text-base-content/70">
              Ask me anything
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="btn btn-sm btn-outline"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className="avatar placeholder shrink-0">
                  <div className="w-8 h-8 rounded-full bg-neutral text-neutral-content">
                    {msg.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-content"
                      : "bg-base-100 shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral flex items-center justify-center">
                  <Bot className="w-4 h-4 text-neutral-content" />
                </div>
                <div className="px-4 py-2 rounded-xl bg-base-100 shadow-sm">
                  <span className="loading loading-dots loading-sm"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-base-100 border-t border-base-300 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="input input-bordered flex-1"
          />
          <button
            onClick={() => handleSend()}
            className="btn btn-primary"
            disabled={loading}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
