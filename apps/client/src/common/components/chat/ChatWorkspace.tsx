import { useState } from "react";
import {
  ArrowDown,
  ChevronRight,
  Download,
  LogIn,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import ChatBubble from "./ChatBubble";
import ChatComposer from "./ChatComposer";
import ChatEmptyState from "./ChatEmptyState";
import ConversationList from "./ConversationList";
import TypingIndicator from "./TypingIndicator";
import { defaultQuickPrompts } from "./quickPrompts";
import type { useChatSession } from "../../hooks/useChatSession";

type ChatSession = ReturnType<typeof useChatSession>;

interface ChatWorkspaceProps {
  session: ChatSession;
  onDownloadPdf: (text: string, title?: string) => void | Promise<void>;
  onDownloadConversationPdf: () => void | Promise<void>;
  heightClass?: string;
  canClearConversation?: boolean;
}

export default function ChatWorkspace({
  session,
  onDownloadPdf,
  onDownloadConversationPdf,
  heightClass = "h-[calc(100dvh-4rem)]",
  canClearConversation = false,
}: ChatWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const filteredConversations = session.conversations.filter((conversation) =>
    conversation.preview.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const showTyping =
    session.loading &&
    session.messages[session.messages.length - 1]?.role !== "ai";

  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setSidebarCollapsed((previous) => !previous);
    } else {
      session.setSidebarOpen(true);
    }
  };

  const renderSidebar = (mobile = false) => (
    <aside
      className={`${
        mobile
          ? "absolute inset-y-0 left-0 z-10 w-[min(21rem,88vw)] rounded-r-[2rem] shadow-2xl"
          : `hidden md:flex ${
              sidebarCollapsed ? "md:w-0 border-r-0" : "md:w-[18rem]"
            } shrink-0`
      } flex-col overflow-hidden border-r border-neutral-content/10 bg-neutral text-neutral-content transition-[width] duration-300`}
    >
      <div className="flex items-center gap-3 border-b border-neutral-content/10 px-5 py-5">
        <div className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content shadow-lg shadow-neutral/20">
          <Sparkles className="size-5" />
          <span className="absolute -bottom-1 -right-1 size-2.5 rounded-full border-2 border-neutral bg-success" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight">Higna / AI</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-content/50">Portfolio studio</p>
        </div>
        {mobile ? (
          <button
            type="button"
            onClick={() => session.setSidebarOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close conversation history"
          >
            <X className="size-4" />
          </button>
        ) : (
            <span className="rounded-full border border-neutral-content/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-content/60">Archive</span>
        )}
      </div>

      <div className="p-4 pb-3">
        <button
          type="button"
          onClick={session.startNewChat}
          className="flex h-12 w-full items-center justify-start gap-3 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-content shadow-lg shadow-neutral/10 transition hover:-translate-y-0.5 hover:brightness-105"
        >
          <Plus className="size-4" />
          <span>Start a new thread</span>
          <span className="ml-auto text-[10px] font-medium opacity-55">New</span>
        </button>
      </div>

      <div className="px-4 pb-3">
        <label className="flex h-10 items-center gap-2 rounded-xl border border-neutral-content/10 bg-neutral-content/5 px-3 focus-within:border-primary/50">
          <Search className="size-4 text-neutral-content/45" />
          <input
            type="search"
            placeholder="Search conversations"
            aria-label="Search conversations"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 bg-transparent text-sm text-neutral-content placeholder:text-neutral-content/40 focus:outline-none"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <p className="px-3 pb-2 pt-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-content/45">
          Recent threads
        </p>
        <ConversationList
          conversations={filteredConversations}
          activeConvId={session.activeConvId}
          onSelect={session.selectConversation}
          onDelete={session.deleteConversation}
          onRename={session.renameConversation}
          emptyLabel={
            searchQuery ? "No matching conversations" : "Your chats will appear here"
          }
          tone="inverse"
        />
      </div>

      <div className="space-y-2 border-t border-neutral-content/10 p-4">
        <button
          type="button"
          onClick={() => void onDownloadConversationPdf()}
          disabled={session.messages.length === 0}
          className="flex h-10 w-full items-center justify-start gap-3 rounded-xl px-3 text-xs text-neutral-content/70 transition hover:bg-neutral-content/10 hover:text-neutral-content"
        >
          <Download className="size-4" />
          Export this conversation
        </button>
        {canClearConversation && (
          <button
            type="button"
            onClick={session.clearConversation}
            disabled={session.messages.length === 0}
            className="flex h-10 w-full items-center justify-start gap-3 rounded-xl px-3 text-xs text-neutral-content/70 transition hover:bg-neutral-content/10 hover:text-neutral-content"
          >
            <X className="size-4" />
            Clear current chat
          </button>
        )}
        {!session.user && (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3.5">
            <p className="text-sm font-medium text-neutral-content">Keep your ideas close</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-content/65">
              Sign in to save your conversation history across devices.
            </p>
            <Link
              to="/login"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Sign in <ChevronRight className="size-3" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <section
      className={`relative mx-auto flex w-full max-w-[1680px] overflow-hidden bg-base-200 text-base-content shadow-2xl shadow-base-content/10 md:rounded-[2rem] md:border md:border-base-content/10 ${heightClass}`}
      aria-label="AI chat workspace"
    >
      {renderSidebar()}

      {session.sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 size-full cursor-default bg-neutral/45 backdrop-blur-[2px]"
            onClick={() => session.setSidebarOpen(false)}
            aria-label="Close conversation history"
          />
          {renderSidebar(true)}
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-base-200 text-base-content">
        <header className="z-[1] flex min-h-[4.5rem] items-center gap-3 border-b border-base-content/10 bg-base-100/90 px-4 backdrop-blur-xl sm:px-7">
          <button
            type="button"
            onClick={toggleSidebar}
            className="grid size-9 place-items-center rounded-xl text-base-content/65 transition hover:bg-base-content/5 hover:text-base-content"
            aria-label="Toggle conversation history"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>

          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral text-primary md:hidden">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                The portfolio, in conversation
              </h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-base-content/10 bg-base-200 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-base-content/70 sm:inline-flex">
                <span className={`size-1.5 rounded-full ${session.loading ? "animate-pulse bg-warning" : "bg-success"}`} />
                {session.loading ? "Thinking" : "Online"}
              </span>
            </div>
            <p className="hidden text-xs text-base-content/55 sm:block">
              Projects · engineering · ideas for what comes next
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={session.startNewChat}
              className="flex h-9 items-center gap-2 rounded-xl bg-neutral px-3 text-xs font-semibold text-neutral-content transition hover:brightness-125"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">New chat</span>
            </button>
            <button
              type="button"
              onClick={() => void onDownloadConversationPdf()}
              disabled={session.messages.length === 0}
              className="grid size-9 place-items-center rounded-xl text-base-content/65 transition hover:bg-base-content/5 hover:text-base-content"
              aria-label="Export conversation as PDF"
              title="Export conversation as PDF"
            >
              <Download className="size-4" />
            </button>
          </div>
        </header>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-36 -top-32 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-48 -left-40 size-[30rem] rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div
          ref={session.chatContainerRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
        >
          {session.messages.length === 0 && !session.loading && (
            <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center">
              <ChatEmptyState
                prompts={defaultQuickPrompts}
                onSelect={session.handleSend}
              />
              {!session.user && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-base-content/55">
                  <LogIn className="size-4" aria-hidden="true" />
                  <span>Save your chat history across devices:</span>
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    sign in
                  </Link>
                  <span>or</span>
                  <Link to="/signup" className="font-medium text-primary hover:underline">
                    create an account
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="relative mx-auto max-w-3xl space-y-8 pb-4">
            {session.messages.map((message, index) => (
              <ChatBubble
                key={message.id}
                message={message}
                isLast={index === session.messages.length - 1}
                copied={session.copiedMessageId === message.id}
                editing={session.editingId === message.id}
                loading={session.loading}
                onCopy={session.copyMessage}
                onRegenerate={session.regenerateLast}
                onStartEdit={session.setEditingId}
                onCancelEdit={() => session.setEditingId(null)}
                onSubmitEdit={session.editAndResend}
                onDeleteMessage={session.deleteMessage}
                onDownloadPdf={onDownloadPdf}
              />
            ))}

            {showTyping && <TypingIndicator />}
            <div ref={session.chatEndRef} />
          </div>
        </div>

        {session.showScrollButton && (
          <div className="absolute bottom-28 right-4 z-[2] sm:right-8">
            <button
              type="button"
              onClick={() => session.scrollToBottom()}
              className="btn btn-sm gap-2 rounded-full border border-base-content/10 bg-base-100 text-base-content shadow-lg"
            >
              <ArrowDown className="size-4" />
              Latest message
            </button>
          </div>
        )}

        <footer className="relative z-[1] border-t border-base-content/10 bg-base-100/95 px-4 pb-4 pt-3 backdrop-blur-xl sm:px-8 sm:pb-5">
          <div className="mx-auto max-w-3xl">
            <ChatComposer
              input={session.input}
              setInput={session.setInput}
              loading={session.loading}
              onSend={() => session.handleSend()}
              onStop={session.stopStreaming}
              placeholder="Ask anything about Higna's work..."
            />
            <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-base-content/45">
              <span className="flex items-center gap-1.5 text-base-content/50">
                <MessageSquareText className="size-3.5" />
                Responses may be imperfect. Feel free to ask follow-ups.
              </span>
              <span className="hidden shrink-0 text-base-content/45 sm:inline">
                Enter to send · Shift+Enter for a new line
              </span>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
