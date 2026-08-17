import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import type { ChatMessage, ChatConversation } from "../types/chat";

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
  } catch { }
}

export function useChatSession() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const hasToken = Boolean(token);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userHistoryLoaded, setUserHistoryLoaded] = useState(false);
  const [guestHistoryLoaded, setGuestHistoryLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollPausedRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserRef = useRef(user);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isNearBottom = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = chatContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    scrollPausedRef.current = false;
  }, []);

  /* Clean up pause timer on unmount */
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  /* Reset chat state when user logs out */
  useEffect(() => {
    const wasLoggedIn = Boolean(prevUserRef.current);
    const isLoggedIn = Boolean(user);

    if (wasLoggedIn && !isLoggedIn) {
      // Clear all chat state
      setMessages([]);
      setConversations([]);
      setActiveConvId(null);
      setUserHistoryLoaded(false);
      setGuestHistoryLoaded(false);
      setInput("");
      setLoading(false);
      setSidebarOpen(false);
      setShowScrollButton(false);
      scrollPausedRef.current = false;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      clearStreamInterval();
      abortControllerRef.current?.abort();

      // Clear guest sessions to prevent old user messages from being stored as guest data
      localStorage.removeItem(GUEST_SESSIONS_KEY);
    }

    prevUserRef.current = user;
  }, [user]);

  /* ------------------------------ */
  /*  USER: load conversations      */
  /* ------------------------------ */
  useEffect(() => {
    if (!user || userHistoryLoaded || !hasToken) return;

    api
      .get("/chat/conversations")
      .then((res) => {
        setConversations(res.data);
        if (res.data.length > 0) {
          const latest = res.data[0];
          setActiveConvId(latest.conversationId);
        }
      })
      .catch(() => { })
      .finally(() => setUserHistoryLoaded(true));
  }, [user, userHistoryLoaded, hasToken]);

  /* ------------------------------ */
  /*  GUEST: load local sessions    */
  /* ------------------------------ */
  useEffect(() => {
    if (user || guestHistoryLoaded || hasToken) return;

    const sessions = loadGuestSessions();
    const mapped: ChatConversation[] = sessions.map((s) => ({
      conversationId: s.id,
      preview: s.preview,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
    setConversations(mapped);
    setGuestHistoryLoaded(true);

    if (sessions.length > 0) {
      const latest = sessions[0];
      setActiveConvId(latest.id);
      setMessages(latest.messages);
    }
  }, [user, guestHistoryLoaded, hasToken]);

  /* ------------------------------ */
  /*  SAFETY: fetch history for     */
  /*  active conversation when      */
  /*  messages are empty           */
  /* ------------------------------ */
  useEffect(() => {
    if (!user || !activeConvId || !userHistoryLoaded) return;
    if (messages.length === 0) {
      api
        .get(`/chat/history/${activeConvId}`)
        .then((res) => {
          const loaded: ChatMessage[] = (res.data || []).map((m: any) => ({
            id: m.id ?? genId(),
            role: m.role,
            content: m.content,
          }));
          setMessages(loaded);
          scrollToBottom(false);
        })
        .catch(() => { });
    }
  }, [activeConvId, user, userHistoryLoaded, messages.length, scrollToBottom]);

  /* ------------------------------ */
  /*  Guest persistence             */
  /* ------------------------------ */
  useEffect(() => {
    if (user || !activeConvId) return;

    const sessions = loadGuestSessions();
    const firstUserMsg = messages.find((m) => m.role === "user");
    const preview = firstUserMsg
      ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "…" : "")
      : messages.length > 0
        ? "New chat"
        : "";

    const updated = sessions.map((s) => {
      if (s.id === activeConvId) {
        return {
          ...s,
          messages,
          updatedAt: new Date().toISOString(),
          preview: preview || s.preview,
        };
      }
      return s;
    });
    saveGuestSessions(updated);
  }, [messages, activeConvId, user]);

  /* ------------------------------ */
  /*  Scroll handling (fixed)       */
  /* ------------------------------ */
  useEffect(() => {
    if (!scrollPausedRef.current && isNearBottom()) {
      const el = chatContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, isNearBottom]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const near = isNearBottom();
      setShowScrollButton(!near);

      if (!near) {
        scrollPausedRef.current = true;
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = setTimeout(() => {
          scrollPausedRef.current = false;
        }, 2000);
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isNearBottom]);

  /* ------------------------------ */
  /*  Streaming                     */
  /* ------------------------------ */
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

  /* ------------------------------ */
  /*  Sending messages              */
  /* ------------------------------ */
  const sendToApi = async (message: string, history: ChatMessage[]) => {
    clearStreamInterval();
    abortControllerRef.current = new AbortController();
    setLoading(true);

    const userMsg: ChatMessage = { id: genId(), role: "user", content: message };
    setMessages([...history, userMsg]);

    try {
      const res = await api.post(
        "/chat/message",
        {
          message,
          conversationId: user ? activeConvId : activeConvId,
        },
        { signal: abortControllerRef.current.signal },
      );

      const aiResponse: string = res.data.response;
      const backendConvId: string = res.data.conversationId;

      if (user) {
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

    if (!user && !activeConvId) {
      const newSession: GuestSession = {
        id: genId(),
        preview: "New chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const sessions = loadGuestSessions();
      const updated = [newSession, ...sessions];
      saveGuestSessions(updated);
      setConversations((prev) => [
        {
          conversationId: newSession.id,
          preview: "New chat",
          createdAt: newSession.createdAt,
          updatedAt: newSession.updatedAt,
        },
        ...prev,
      ]);
      setActiveConvId(newSession.id);
    }

    setInput("");
    sendToApi(message, messages);
  };

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

  const startNewChat = () => {
    clearStreamInterval();
    abortControllerRef.current?.abort();
    setActiveConvId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);

    if (!user) {
      const newSession: GuestSession = {
        id: genId(),
        preview: "New chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const sessions = loadGuestSessions();
      const updated = [newSession, ...sessions];
      saveGuestSessions(updated);
      setConversations((prev) => [
        {
          conversationId: newSession.id,
          preview: "New chat",
          createdAt: newSession.createdAt,
          updatedAt: newSession.updatedAt,
        },
        ...prev,
      ]);
      setActiveConvId(newSession.id);
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
      } catch { }
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
    } catch { }
  };

  const renameConversation = async (convId: string, newTitle: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cleaned = newTitle.trim();
    if (!cleaned) return;

    if (user) {
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === convId ? { ...c, preview: cleaned } : c,
        ),
      );
    } else {
      const sessions = loadGuestSessions();
      const updated = sessions.map((s) =>
        s.id === convId ? { ...s, preview: cleaned, updatedAt: new Date().toISOString() } : s,
      );
      saveGuestSessions(updated);
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

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 1500);
    });
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

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