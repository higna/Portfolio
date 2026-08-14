import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, X, ArrowDown, Menu, Search, Download, LogIn } from "lucide-react";
import { useChatSession } from "../../common/hooks/useChatSession";
import { useChatShortcuts } from "../../common/hooks/useChatShortcuts";
import ChatBubble from "../../common/components/chat/ChatBubble";
import ChatComposer from "../../common/components/chat/ChatComposer";
import ChatEmptyState from "../../common/components/chat/ChatEmptyState";
import ConversationList from "../../common/components/chat/ConversationList";
import TypingIndicator from "../../common/components/chat/TypingIndicator";
import { defaultQuickPrompts } from "../../common/components/chat/quickPrompts";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function ChatPage() {
  const session = useChatSession();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const filteredConversations = session.conversations.filter((c) =>
    c.preview.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const showTyping =
    session.loading &&
    session.messages[session.messages.length - 1]?.role !== "ai";

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
    <div className="flex h-[calc(100vh-4rem)] bg-base-200 rounded-2xl overflow-hidden border border-base-300">
      {/* Sidebar for logged-in users */}
      {session.user && (
        <aside
          className={`hidden md:flex ${
            sidebarCollapsed ? "md:w-0" : "md:w-72"
          } bg-base-100 border-r border-base-300 flex-col shrink-0 overflow-hidden transition-all duration-300`}
        >
          <div className="p-3 border-b border-base-300">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <ConversationList
              conversations={filteredConversations}
              activeConvId={session.activeConvId}
              onSelect={session.selectConversation}
              onDelete={session.deleteConversation}
              onRename={session.renameConversation}
            />
          </div>

          <div className="p-3 border-t border-base-300 space-y-2">
            <button
              onClick={session.startNewChat}
              className="btn btn-primary w-full gap-2"
            >
              <Plus className="w-4 h-4" /> New chat
            </button>
            <button
              onClick={downloadConversationPdf}
              className="btn btn-ghost btn-sm w-full gap-2"
            >
              <Download className="w-4 h-4" /> Export as PDF
            </button>
          </div>
        </aside>
      )}

      {/* Mobile sidebar for logged-in users */}
      {session.user && session.sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => session.setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-base-100 shadow-xl flex flex-col">
            <div className="p-3 border-b border-base-300 flex items-center justify-between">
              <span className="font-bold">Conversations</span>
              <button
                onClick={() => session.setSidebarOpen(false)}
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Close conversations"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ConversationList
                conversations={filteredConversations}
                activeConvId={session.activeConvId}
                onSelect={session.selectConversation}
                onDelete={session.deleteConversation}
                onRename={session.renameConversation}
              />
            </div>
            <div className="p-3 border-t border-base-300 space-y-2">
              <button
                onClick={session.startNewChat}
                className="btn btn-primary w-full gap-2"
              >
                <Plus className="w-4 h-4" /> New chat
              </button>
              <button
                onClick={downloadConversationPdf}
                className="btn btn-ghost btn-sm w-full gap-2"
              >
                <Download className="w-4 h-4" /> Export as PDF
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="p-2 bg-base-100 border-b border-base-300 flex items-center gap-2">
          {session.user && (
            <button
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setSidebarCollapsed((prev) => !prev);
                } else {
                  session.setSidebarOpen(true);
                }
              }}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="font-semibold font-['Cormorant_Garamond'] text-lg">
            AI Chat
          </span>
          <button
            onClick={downloadConversationPdf}
            className="btn btn-ghost btn-sm btn-circle ml-auto"
            aria-label="Download conversation as PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={session.chatContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-6"
        >
          {session.messages.length === 0 && !session.loading && (
            <>
              <ChatEmptyState
                prompts={defaultQuickPrompts}
                onSelect={session.handleSend}
              />
              {!session.user && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-base-content/60">
                    Sign in to save your chat history and access it from any device.
                  </p>
                  <div className="flex justify-center gap-2 mt-3">
                    <Link to="/login" className="btn btn-sm btn-primary gap-2">
                      <LogIn className="w-4 h-4" /> Login
                    </Link>
                    <Link to="/signup" className="btn btn-sm btn-outline">
                      Create Account
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-6 max-w-3xl mx-auto">
            {session.messages.map((msg, idx) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isLast={idx === session.messages.length - 1}
                copied={session.copiedMessageId === msg.id}
                editing={session.editingId === msg.id}
                loading={session.loading}
                user={session.user}
                onCopy={session.copyMessage}
                onRegenerate={session.regenerateLast}
                onStartEdit={session.setEditingId}
                onCancelEdit={() => session.setEditingId(null)}
                onSubmitEdit={session.editAndResend}
                onDeleteMessage={session.deleteMessage}
                onDownloadPdf={downloadPdf}
              />
            ))}
            {showTyping && <TypingIndicator />}
            <div ref={session.chatEndRef} />
          </div>
        </div>

        {session.showScrollButton && (
          <button
            onClick={() => session.scrollToBottom()}
            className="absolute bottom-28 right-6 btn btn-primary btn-sm gap-2 shadow-lg"
          >
            <ArrowDown className="w-4 h-4" /> New messages
          </button>
        )}

        <div className="bg-base-100 border-t border-base-300 p-4">
          <div className="max-w-3xl mx-auto">
            <ChatComposer
              input={session.input}
              setInput={session.setInput}
              loading={session.loading}
              onSend={() => session.handleSend()}
              onStop={session.stopStreaming}
            />
          </div>
          {!session.user && session.messages.length > 0 && (
            <p className="text-center text-xs text-base-content/50 mt-2">
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>{" "}
              to save this conversation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}