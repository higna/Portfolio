import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useChatSession } from "../../common/hooks/useChatSession";
import { useChatShortcuts } from "../../common/hooks/useChatShortcuts";
import ChatWorkspace from "../../common/components/chat/ChatWorkspace";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function ChatPageInner() {
  const session = useChatSession();
  const [searchParams] = useSearchParams();

  useChatShortcuts({
    onNewChat: session.startNewChat,
    onStop: session.stopStreaming,
    isGenerating: session.loading,
  });

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg && !session.loading && session.messages.length === 0) {
      session.handleSend(msg);
    }
  }, [searchParams]);

  const downloadPdf = async (text: string, title = "Generated Document") => {
    try {
      const res = await api.post(
        "/pdf/generate",
        { text, title, fileName: "document.pdf" },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const downloadConversationPdf = async () => {
    if (session.messages.length === 0) {
      toast.error("No messages to export");
      return;
    }
    const text = session.messages
      .map((m) => `${m.role === "user" ? "You" : "AI"}: ${m.content}`)
      .join("\n\n");
    await downloadPdf(text, "Chat Conversation");
  };

  return (
    <ChatWorkspace
      session={session}
      onDownloadPdf={downloadPdf}
      onDownloadConversationPdf={downloadConversationPdf}
    />
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const userId = user?.id || "guest";
  return <ChatPageInner key={userId} />;
}
