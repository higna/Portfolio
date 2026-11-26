import { useChatSession } from "../../common/hooks/useChatSession";
import { useChatShortcuts } from "../../common/hooks/useChatShortcuts";
import ChatWorkspace from "../../common/components/chat/ChatWorkspace";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function DashboardChat() {
  const session = useChatSession();

  useChatShortcuts({
    onNewChat: session.startNewChat,
    onStop: session.stopStreaming,
    isGenerating: session.loading,
  });

  const downloadPdf = async (text: string, _title?: string) => {
    const fileName = window.prompt(
      "Enter a name for the PDF file:",
      "document.pdf",
    );
    if (!fileName) return;
    const finalName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    try {
      const res = await api.post(
        "/pdf/generate",
        { text, title: "Generated Document", fileName: finalName },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = finalName;
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
    await downloadPdf(text);
  };

  return (
    <ChatWorkspace
      session={session}
      onDownloadPdf={downloadPdf}
      onDownloadConversationPdf={downloadConversationPdf}
      heightClass="h-[calc(100dvh-6rem)]"
      canClearConversation
    />
  );
}
