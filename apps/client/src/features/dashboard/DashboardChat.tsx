import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { createLogger } from "../../lib/logger";
import api from "../../lib/api";
import { Send, User, Bot, MessageCircle, Trash2 } from "lucide-react";

const logger = createLogger("DashboardChat");
const MAX_MESSAGES = 3;

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function DashboardChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* Load last 3 messages from history on mount */
  useEffect(() => {
    if (!user) return;
    api
      .get("/chat/history")
      .then((res) => {
        const conversations = res.data;
        if (conversations.length > 0) {
          const lastConv = conversations[conversations.length - 1];
          const msgs = lastConv.messages;
          // Keep only the last 3 messages
          const trimmed = msgs.slice(-MAX_MESSAGES);
          setMessages(trimmed);
          setConversationId(lastConv.conversationId);
          logger.log("Chat history loaded (max 3)");
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message) return;
    setInput("");

    const userMsg: Message = { role: "user", content: message };
    const updatedMessages = [...messages, userMsg].slice(-MAX_MESSAGES);
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await api.post("/chat/message", {
        message,
        conversationId,
      });
      const aiMsg: Message = { role: "ai", content: res.data.response };
      setMessages((prev) => [...prev, aiMsg].slice(-MAX_MESSAGES));
      setConversationId(res.data.conversationId);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold font-['Cormorant_Garamond']">
          AI Chat
        </h2>
        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              setConversationId(null);
            }}
            className="btn btn-ghost btn-sm gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-base-content/40 gap-2">
            <MessageCircle className="w-12 h-12" />
            <p>Ask me anything – your last 3 messages are saved</p>
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

      <div className="flex gap-2">
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
  );
}
