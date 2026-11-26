import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Clock3, Mail, MessageSquarePlus, Send, X } from "lucide-react";
import ChatBubble from "./ChatBubble";
import ChatComposer from "./ChatComposer";
import ChatContactForm from "./ChatContactForm";
import ConversationList from "./ConversationList";
import { defaultQuickPrompts } from "./quickPrompts";
import { useChatSession } from "../../hooks/useChatSession";

export const OPEN_CHAT_EVENT = "portfolio:open-chat-assistant";

export function openChatAssistant(message?: string) {
  window.dispatchEvent(
    new CustomEvent(OPEN_CHAT_EVENT, { detail: { message: message ?? "" } }),
  );
}

export default function ChatAssistantFab() {
  const session = useChatSession();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateScrollOffset = () => setShowBackToTop(window.scrollY > 400);
    updateScrollOffset();
    window.addEventListener("scroll", updateScrollOffset, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollOffset);
  }, []);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      setOpen(true);
      setShowHistory(false);
      setShowContact(false);
      if (message) session.setInput(message);
    };
    window.addEventListener(OPEN_CHAT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handleOpen);
  }, [session.setInput]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return createPortal(
    <>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[9997] cursor-default bg-neutral/35 backdrop-blur-[2px] animate-fade-in sm:hidden"
            aria-label="Close chat assistant"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-label="Portfolio AI assistant"
            className="animate-chat-panel fixed inset-x-0 bottom-0 z-[9999] flex h-[min(86dvh,48rem)] flex-col overflow-hidden rounded-t-[1.75rem] border border-base-content/10 bg-base-100 shadow-2xl ring-1 ring-base-content/10 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(46rem,calc(100dvh-8rem))] sm:w-[min(34rem,calc(100vw-3rem))] sm:rounded-[1.75rem]"
          >
            <header className="flex items-center gap-2 border-b border-base-content/10 bg-neutral px-3 py-3.5 text-neutral-content sm:px-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold">Portfolio assistant</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-content/65">
                  <span className={`size-1.5 rounded-full ${session.loading ? "animate-pulse bg-warning" : "bg-success"}`} />
                  {session.loading ? "Thinking through it" : "Ask about my work"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHistory((value) => !value);
                  setShowContact(false);
                }}
                className={`btn btn-ghost btn-sm btn-square text-neutral-content hover:bg-neutral-content/10 ${showHistory ? "bg-neutral-content/10" : ""}`}
                aria-label={showHistory ? "Return to conversation" : "Show conversation history"}
                title="Conversation history"
              >
                <Clock3 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowContact((value) => !value);
                  setShowHistory(false);
                }}
                className={`btn btn-ghost btn-sm btn-square text-neutral-content hover:bg-neutral-content/10 ${showContact ? "bg-neutral-content/10" : ""}`}
                aria-label={showContact ? "Return to conversation" : "Contact me"}
                title="Contact me"
              >
                <Mail className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  session.startNewChat();
                  setShowHistory(false);
                  setShowContact(false);
                }}
                className="btn btn-ghost btn-sm btn-square text-neutral-content hover:bg-neutral-content/10"
                aria-label="Start a new conversation"
                title="New conversation"
              >
                <MessageSquarePlus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm btn-square text-neutral-content hover:bg-neutral-content/10"
                aria-label="Close chat assistant"
              >
                <X className="size-4" />
              </button>
            </header>

            {showContact ? (
              <ChatContactForm />
            ) : showHistory ? (
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">Your conversations</p>
                <ConversationList
                  conversations={session.conversations}
                  activeConvId={session.activeConvId}
                  onSelect={(id) => {
                    session.selectConversation(id);
                    setShowHistory(false);
                  }}
                  onDelete={session.deleteConversation}
                  onRename={session.renameConversation}
                  emptyLabel="Your conversations will show up here"
                />
              </div>
            ) : (
              <>
                <div
                  ref={session.chatContainerRef}
                  className="relative min-h-0 flex-1 overflow-y-auto bg-base-200/50 px-4 py-4"
                >
                  {session.messages.length === 0 && !session.loading ? (
                    <div className="flex min-h-full flex-col justify-center py-3">
                      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Bot className="size-6" />
                      </div>
                      <h3 className="text-center text-lg font-semibold tracking-tight">Curious about my work?</h3>
                      <p className="mx-auto mt-1 max-w-xs text-center text-xs leading-5 text-base-content/55">
                        Ask about projects, experience, or how I approach a problem.
                      </p>
                      <div className="mt-5 space-y-2">
                        {defaultQuickPrompts.slice(0, 4).map(({ label, icon: Icon }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => session.handleSend(label)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-base-content/10 bg-base-100 px-3 py-2.5 text-left text-xs leading-5 text-base-content/75 transition hover:border-primary/35 hover:bg-primary/5"
                          >
                            <Icon className="size-4 shrink-0 text-primary" />
                            <span className="flex-1">{label}</span>
                            <Send className="size-3.5 shrink-0 text-base-content/30 transition group-hover:text-primary" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 pb-2">
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
                        />
                      ))}
                      <div ref={session.chatEndRef} />
                    </div>
                  )}
                  {session.showScrollButton && session.messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => session.scrollToBottom()}
                      className="btn btn-xs absolute bottom-3 right-3 rounded-full border-base-content/10 bg-base-100 shadow"
                    >
                      Latest message
                    </button>
                  )}
                </div>
                <footer className="border-t border-base-content/10 bg-base-100 p-3">
                  <ChatComposer
                    input={session.input}
                    setInput={session.setInput}
                    loading={session.loading}
                    onSend={() => session.handleSend()}
                    onStop={session.stopStreaming}
                    placeholder="Ask me something..."
                  />
                  <p className="mt-2 text-center text-[10px] text-base-content/40">Enter to send · Shift+Enter for a new line</p>
                </footer>
              </>
            )}
          </section>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`group fixed right-5 z-[9998] flex size-14 items-center justify-center rounded-full bg-neutral text-neutral-content shadow-xl ring-4 ring-primary/15 transition-all hover:-translate-y-0.5 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 sm:right-6 ${showBackToTop ? "bottom-24" : "bottom-5 sm:bottom-6"}`}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={open}
      >
        {open ? <X className="size-5" /> : <Bot className="size-6 transition-transform group-hover:scale-110" />}
      </button>
    </>,
    document.body,
  );
}
