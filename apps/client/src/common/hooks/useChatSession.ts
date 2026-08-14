import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { createLogger } from "../../lib/logger";
import api from "../../lib/api";
import type { ChatMessage, ChatConversation } from "../types/chat";

const logger = createLogger("ChatSession");

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isCanceled = (err: any) =>
  err?.name === "CanceledError" || err?.name === "AbortError" || err?.code === "ERR_CANCELED";

interface GuestSession {
  id: string;
  preview: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const GUEST_SESSIONS_KEY = "guest-chat-sessions";

function loadGuestSessions(): GuestSession[] {
  try {
    const raw = localStorage.getItem(GUEST_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestSessions(sessions: GuestSession[]) {
  try {
    localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // ignore quota errors
  }
}

export function useChatSession() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sticky scroll behavior
  const isUserAtBottomRef = useRef(true);

  const isNearBottom = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    chatEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    isUserAtBottomRef.current = true;
  }, []);

  /* ---------------------------------- */
  /*  INITIAL LOAD                      */
  /* ---------------------------------- */

  // User: fetch conversation history from API
  useEffect(() => {
    if (!user || historyLoaded) return;
    api
      .get("/chat/conversations")
      .then((res) => {
        setConversations(res.data);
        logger.log("User conversations loaded");
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [user, historyLoaded]);

  // Guest: load local sessions from localStorage
  useEffect(() => {
    if (user || historyLoaded) return;
    const sessions = loadGuestSessions();
    const mapped = sessions.map((s) => ({
      conversationId: s.id,
      preview: s.preview,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
    setConversations(mapped);
    setHistoryLoaded(true);

    // Restore most recent session if any
    if (sessions.length > 0) {
      const latest = sessions[0]; // we will sort in UI; here just take first
      setActiveConvId(latest.id);
      setMessages(latest.messages);
    }
  }, [user, historyLoaded]);

  /* ---------------------------------- */
  /*  SCROLL HANDLING                   */
  /* ---------------------------------- */

  // Auto-scroll only when user is at bottom
  useEffect(() => {
    if (isUserAtBottomRef.current && isNearBottom()) {
      scrollToBottom();
    }
  }, [messages, isNearBottom, scrollToBottom]);

  // Update sticky flag on scroll
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const near = isNearBottom();
      isUserAtBottomRef.current = near;
      setShowScrollButton(!near);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isNearBottom]);

  /* ---------------------------------- */
  /*  STREAMING                         */
  /* ---------------------------------- */

  const clearStreamInterval = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };

  const stopStreaming = () => {
    clearStreamInterval();
    abortControllerRef.current?.abort();
    setLoading(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.role === "ai" && m.pending
          ? { ...m, content: m.content || "Generation stopped.", pending: false }
          : m,
      ),
    );
  };

  const streamResponse = (aiMsgId: string, fullText: string) => {
    let charIndex = 0;
    const chunkSize = 3;
    const intervalMs = 20;
    streamIntervalRef.current = setInterval(() => {
      charIndex += chunkSize;
      const done = charIndex >= fullText.length;
      const partial = done ? fullText : fullText.slice(0, charIndex);
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, content: partial, pending: !done } : m)),
      );
      if (done) {
        clearStreamInterval();
        setLoading(false);
      }
    }, intervalMs);
  };

  /* ---------------------------------- */
  /*  SEND / API                        */
  /* ---------------------------------- */

  const sendToApi = async (message: string, history: ChatMessage[]) => {
    clearStreamInterval();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    isUserAtBottomRef.current = isNearBottom();

    const userMsg: ChatMessage = { id: genId(), role: "user", content: message };
    setMessages([...history, userMsg]);

    try {
      const res = await api.post(
        "/chat/message",
        {
          message,
          conversationId: user ? activeConvId : activeConvId, // same for both
        },
        { signal: abortControllerRef.current.signal },
      );

      const aiResponse: string = res.data.response;
      const backendConvId: string = res.data.conversationId;

      if (user) {
        // Update conversation list and active id from backend
        setConversations((prev) => {
          if (prev.some((c) => c.conversationId === backendConvId)) return prev;
          return [
            {
              conversationId: backendConvId,
              preview: message.slice(0, 50) + (message.length > 50 ? "…" : ""),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        });
        setActiveConvId(backendConvId);
      } else {
        // Guest: keep our local session id; don't use backend conv id
        // But ensure conversation list preview updates
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.conversationId === activeConvId
              ? {
                  ...c,
                  preview: message.slice(0, 50) + (message.length > 50 ? "…" : ""),
                  updatedAt: new Date().toISOString(),
                }
              : c,
          );
          return updated;
        });
      }

      const aiMsgId = genId();
      setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "", pending: true }]);
      streamResponse(aiMsgId, aiResponse);
    } catch (err) {
      if (isCanceled(err)) {
        setLoading(false);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: genId(), role: "ai", content: "Something went wrong. Please try again." },
      ]);
      setLoading(false);
    }
  };

  const handleSend = (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    sendToApi(message, messages);
  };

  /* ---------------------------------- */
  /*  EDIT / REGENERATE                 */
  /* ---------------------------------- */

  const regenerateLast = () => {
    if (loading) return;
    const idx = [...messages].map((m) => m.role).lastIndexOf("user");
    if (idx === -1) return;
    sendToApi(messages[idx].content, messages.slice(0, idx));
  };

  const editAndResend = (id: string, newContent: string) => {
    if (loading || !newContent.trim()) return;
    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) return;
    setEditingId(null);
    sendToApi(newContent.trim(), messages.slice(0, idx));
  };

  /* ---------------------------------- */
  /*  CONVERSATION MANAGEMENT           */
  /* ---------------------------------- */

  const startNewChat = () => {
    clearStreamInterval();
    abortControllerRef.current?.abort();
    setActiveConvId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);

    if (!user) {
      // Create a new guest session
      const sessionId = genId();
      const newSession: GuestSession = {
        id: sessionId,
        preview: "New chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newSession, ...loadGuestSessions()];
      saveGuestSessions(updated);
      setConversations((prev) => [
        {
          conversationId: sessionId,
          preview: "New chat",
          createdAt: newSession.createdAt,
          updatedAt: newSession.updatedAt,
        },
        ...prev,
      ]);
      setActiveConvId(sessionId);
    }
  };

  const selectConversation = async (convId: string) => {
    if (convId === activeConvId) return;
    setActiveConvId(convId);
    setSidebarOpen(false);

    if (user) {
      try {
        const res = await api.get(`/chat/history/${convId}`);
        const loaded: ChatMessage[] = (res.data || []).map((m: any) => ({
          id: m.id ?? genId(),
          role: m.role,
          content: m.content,
        }));
        setMessages(loaded);
        scrollToBottom(false);
      } catch {}
    } else {
      const sessions = loadGuestSessions();
      const session = sessions.find((s) => s.id === convId);
      if (session) {
        setMessages(session.messages);
        scrollToBottom(false);
      }
    }
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (user) {
        await api.delete(`/chat/conversations/${convId}`);
        setConversations((prev) => prev.filter((c) => c.conversationId !== convId));
        if (activeConvId === convId) {
          setActiveConvId(null);
          setMessages([]);
        }
      } else {
        const updated = loadGuestSessions().filter((s) => s.id !== convId);
        saveGuestSessions(updated);
        setConversations((prev) => prev.filter((c) => c.conversationId !== convId));
        if (activeConvId === convId) {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch {}
  };

  const renameConversation = async (convId: string, newTitle: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cleaned = newTitle.trim();
    if (!cleaned) return;
    if (user) {
      // Backend does not support rename yet. We'll update local state only for now.
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === convId ? { ...c, preview: cleaned } : c,
        ),
      );
      // TODO: add backend rename endpoint in future
    } else {
      const sessions = loadGuestSessions();
      const updatedSessions = sessions.map((s) =>
        s.id === convId ? { ...s, preview: cleaned, updatedAt: new Date().toISOString() } : s,
      );
      saveGuestSessions(updatedSessions);
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === convId ? { ...c, preview: cleaned, updatedAt: new Date().toISOString() } : c,
        ),
      );
    }
  };

  const clearConversation = () => {
    clearStreamInterval();
    abortControllerRef.current?.abort();
    setMessages([]);
    setActiveConvId(null);
    setLoading(false);
  };

  /* ---------------------------------- */
  /*  MESSAGE ACTIONS                   */
  /* ---------------------------------- */

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 1500);
    });
  };

  const deleteMessage = (id: string) => {
    // Guest: remove from local session
    // User: backend does not support single message delete yet
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (!user) {
      const sessions = loadGuestSessions();
      const updatedSessions = sessions.map((s) => {
        if (s.id === activeConvId) {
          return { ...s, messages: s.messages.filter((m: ChatMessage) => m.id !== id) };
        }
        return s;
      });
      saveGuestSessions(updatedSessions);
    }
    // For user, we'll need backend endpoint; currently only local UI removal.
  };

  /* ---------------------------------- */
  /*  RETURN                            */
  /* ---------------------------------- */

  return {
    user,
    messages,
    conversations,
    activeConvId,
    input,
    setInput,
    loading,
    sidebarOpen,
    setSidebarOpen,
    showScrollButton,
    copiedMessageId,
    editingId,
    setEditingId,
    chatContainerRef,
    chatEndRef,
    handleSend,
    stopStreaming,
    regenerateLast,
    editAndResend,
    startNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    copyMessage,
    deleteMessage,
    clearConversation,
    scrollToBottom,
  };
}