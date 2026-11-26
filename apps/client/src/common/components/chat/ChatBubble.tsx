import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy, Check, RotateCcw, Pencil, Trash2, Download, X as XIcon,
} from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import type { ChatMessage } from "../../types/chat";

interface ChatBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  copied: boolean;
  editing: boolean;
  loading: boolean;
  onCopy: (content: string, id: string) => void;
  onRegenerate: () => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (id: string, content: string) => void;
  onDeleteMessage: (id: string) => void;
  onDownloadPdf?: (content: string) => void;
}

export default function ChatBubble({
  message,
  isLast,
  copied,
  editing,
  loading,
  onCopy,
  onRegenerate,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDeleteMessage,
  onDownloadPdf,
}: ChatBubbleProps) {
  const [draft, setDraft] = useState(message.content);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`group flex w-full max-w-[95%] gap-3 sm:max-w-[88%] ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        {!isUser && <ChatAvatar role="ai" />}

        <div className={`flex min-w-0 flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
          <div className={`flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-base-content/45 ${isUser ? "flex-row-reverse" : ""}`}>
            {isUser ? "You" : "Higna AI"}
            {message.pending && (
              <span className="normal-case tracking-normal text-primary">
                Writing…
              </span>
            )}
          </div>
          {editing ? (
            <div className="min-w-[16rem] max-w-full rounded-2xl border border-primary/40 bg-base-100 px-4 py-3 text-sm shadow-lg shadow-primary/5">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="textarea textarea-ghost min-h-12 w-full resize-none p-0 focus:outline-none"
                rows={2}
              />
              <div className="flex justify-end gap-1 mt-1">
                <button onClick={onCancelEdit} className="btn btn-ghost btn-xs">
                  <XIcon className="w-3 h-3" />
                </button>
                <button onClick={() => onSubmitEdit(message.id, draft)} className="btn btn-primary btn-xs" disabled={!draft.trim()}>
                  Resend
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all backdrop-blur-md ${
                isUser
                  ? "rounded-tr-md border border-primary/20 bg-primary/10 text-base-content shadow-sm"
                  : "rounded-tl-md border border-base-300/70 bg-base-100 text-base-content shadow-sm"
              }`}
            >
              {message.role === "ai" ? (
                <div className="prose prose-sm max-w-none break-words prose-headings:font-['Cormorant_Garamond'] prose-a:text-primary prose-pre:overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || " "}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{message.content}</span>
              )}
            </div>
          )}

          {!editing && message.content && !message.pending && (
            <div className={`flex gap-1 ${isUser ? "justify-end" : "justify-start"} opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100`}>
              <button onClick={() => onCopy(message.content, message.id)} className="btn btn-ghost btn-xs rounded-lg" aria-label="Copy message" title="Copy message">
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
              <button onClick={() => onDeleteMessage(message.id)} className="btn btn-ghost btn-xs rounded-lg" aria-label="Delete message" title="Delete message">
                <Trash2 className="w-3 h-3" />
              </button>
              {isUser && !loading && (
                <button onClick={() => onStartEdit(message.id)} className="btn btn-ghost btn-xs rounded-lg" aria-label="Edit message" title="Edit message">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {!isUser && onDownloadPdf && !loading && (
                <button onClick={() => onDownloadPdf(message.content)} className="btn btn-ghost btn-xs rounded-lg" aria-label="Download response as PDF" title="Download response as PDF">
                  <Download className="w-3 h-3" />
                </button>
              )}
              {!isUser && isLast && !loading && (
                <button onClick={onRegenerate} className="btn btn-ghost btn-xs rounded-lg" aria-label="Regenerate response" title="Regenerate response">
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
