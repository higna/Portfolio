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
  user?: any;
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
  user,
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
      <div className={`group flex gap-3 max-w-[95%] sm:max-w-[85%] ${isUser ? "flex-row-reverse" : ""}`}>
        <ChatAvatar role={message.role} user={isUser ? user : undefined} />

        <div className="flex flex-col gap-1 min-w-0">
          {editing ? (
            <div className="px-3 py-2 rounded-2xl bg-base-100/80 backdrop-blur-md border border-primary/50 shadow-[0_0_16px_rgba(212,175,55,0.15)] text-sm min-w-[16rem] max-w-full">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="textarea textarea-ghost w-full resize-none p-0 min-h-12 focus:outline-none"
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
                  ? "bg-base-100/70 border border-primary/20 shadow-[0_0_12px_rgba(212,175,55,0.1)] text-base-content"
                  : "bg-base-100/70 border border-base-300/40 shadow-sm text-base-content"
              }`}
            >
              {message.role === "ai" ? (
                <div className="prose prose-sm max-w-none prose-headings:font-['Cormorant_Garamond']">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || " "}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{message.content}</span>
              )}
            </div>
          )}

          {!editing && message.content && !message.pending && (
            <div className={`flex gap-1 ${isUser ? "justify-end" : "justify-start"} opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity`}>
              <button onClick={() => onCopy(message.content, message.id)} className="btn btn-ghost btn-xs" aria-label="Copy">
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
              <button onClick={() => onDeleteMessage(message.id)} className="btn btn-ghost btn-xs" aria-label="Delete">
                <Trash2 className="w-3 h-3" />
              </button>
              {isUser && !loading && (
                <button onClick={() => onStartEdit(message.id)} className="btn btn-ghost btn-xs" aria-label="Edit">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {!isUser && onDownloadPdf && !loading && (
                <button onClick={() => onDownloadPdf(message.content)} className="btn btn-ghost btn-xs" aria-label="Download PDF">
                  <Download className="w-3 h-3" />
                </button>
              )}
              {!isUser && isLast && !loading && (
                <button onClick={onRegenerate} className="btn btn-ghost btn-xs" aria-label="Regenerate">
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