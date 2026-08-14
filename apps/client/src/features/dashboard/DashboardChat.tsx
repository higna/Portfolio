import { Plus, X, ArrowDown, Menu } from "lucide-react";
import { useChatSession } from "../../common/hooks/useChatSession";
import { useChatShortcuts } from "../../common/hooks/useChatShortcuts";
import ChatBubble from "../../common/components/chat/ChatBubble";
import ChatComposer from "../../common/components/chat/ChatComposer";
import ChatEmptyState from "../../common/components/chat/ChatEmptyState";
import ConversationList from "../../common/components/chat/ConversationList";
import TypingIndicator from "../../common/components/chat/TypingIndicator";
import { defaultQuickPrompts } from "../../common/components/chat/quickPrompts";

export default function DashboardChat() {
  const session = useChatSession();

  useChatShortcuts({
    onNewChat: session.startNewChat,
    onStop: session.stopStreaming,
    isGenerating: session.loading,
  });

  const showTyping =
    session.loading && session.messages[session.messages.length - 1]?.role !== "ai";

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-base-200 rounded-2xl overflow-hidden border border-base-300">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 bg-base-100 border-r border-base-300 flex-col shrink-0">
        <div className="p-3 border-b border-base-300">
          <button onClick={session.startNewChat} className="btn btn-primary w-full gap-2">
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <ConversationList
            conversations={session.conversations}
            activeConvId={session.activeConvId}
            onSelect={session.selectConversation}
            onDelete={session.deleteConversation}
            onRename={session.renameConversation}
          />
        </div>
        <div className="p-3 border-t border-base-300">
          <button onClick={session.clearConversation} className="btn btn-ghost btn-sm w-full gap-2">
            <X className="w-4 h-4" /> Clear current chat
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {session.sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => session.setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-base-100 shadow-xl flex flex-col">
            <div className="p-3 border-b border-base-300 flex items-center justify-between">
              <span className="font-bold font-['Cormorant_Garamond'] text-lg">Conversations</span>
              <button
                onClick={() => session.setSidebarOpen(false)}
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Close conversations"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 border-b border-base-300">
              <button onClick={session.startNewChat} className="btn btn-primary w-full gap-2">
                <Plus className="w-4 h-4" /> New chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <ConversationList
                conversations={session.conversations}
                activeConvId={session.activeConvId}
                onSelect={session.selectConversation}
                onDelete={session.deleteConversation}
                onRename={session.renameConversation}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative">
        <div className="md:hidden p-2 bg-base-100 border-b border-base-300 flex items-center gap-2">
          <button
            onClick={() => session.setSidebarOpen(true)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Open conversations"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold font-['Cormorant_Garamond'] text-lg">AI Chat</span>
        </div>

        <div ref={session.chatContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
          {session.messages.length === 0 && !session.loading && (
            <ChatEmptyState prompts={defaultQuickPrompts} onSelect={session.handleSend} compact />
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
        </div>
      </div>
    </div>
  );
}