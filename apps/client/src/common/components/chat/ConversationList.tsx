import { useState } from "react";
import { Trash2, MessageCircle, Pencil, Check, X } from "lucide-react";
import type { ChatConversation } from "../../types/chat";

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConvId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRename: (id: string, newTitle: string, e?: React.MouseEvent) => void;
  emptyLabel?: string;
}

function groupByDate(convs: ChatConversation[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysStart = todayStart - 6 * 86400000;

  const groups: { label: string; items: ChatConversation[] }[] = [];

  const todayConvs: ChatConversation[] = [];
  const yesterdayConvs: ChatConversation[] = [];
  const previous7Convs: ChatConversation[] = [];
  const olderConvs: ChatConversation[] = [];

  convs.forEach((c) => {
    const d = new Date(c.createdAt).getTime();
    if (d >= todayStart) todayConvs.push(c);
    else if (d >= yesterdayStart) yesterdayConvs.push(c);
    else if (d >= sevenDaysStart) previous7Convs.push(c);
    else olderConvs.push(c);
  });

  if (todayConvs.length) groups.push({ label: "Today", items: todayConvs });
  if (yesterdayConvs.length) groups.push({ label: "Yesterday", items: yesterdayConvs });
  if (previous7Convs.length) groups.push({ label: "Previous 7 Days", items: previous7Convs });
  if (olderConvs.length) groups.push({ label: "Older", items: olderConvs });

  return groups;
}

export default function ConversationList({
  conversations,
  activeConvId,
  onSelect,
  onDelete,
  onRename,
  emptyLabel = "No conversations yet",
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const groups = groupByDate(conversations);

  if (conversations.length === 0) {
    return (
      <div className="text-center text-base-content/40 py-10">
        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  const startEdit = (conv: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.conversationId);
    setDraftTitle(conv.preview || "Untitled");
  };

  const finishEdit = (id: string) => {
    const trimmed = draftTitle.trim();
    if (trimmed) {
      onRename(id, trimmed);
    }
    setEditingId(null);
  };

  const handleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    finishEdit(id);
  };

  const handleKey = (id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEdit(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-base-content/40 px-3 mt-5 mb-1.5">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((conv) => (
              <div
                key={conv.conversationId}
                onClick={() => onSelect(conv.conversationId)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  activeConvId === conv.conversationId
                    ? "bg-primary/10 border-primary/30 shadow-[0_0_12px_rgba(212,175,55,0.15)]"
                    : "border-transparent hover:bg-base-200/70 text-base-content/80"
                }`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === conv.conversationId ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => handleKey(conv.conversationId, e)}
                        className="input input-xs input-ghost flex-1 px-1"
                        placeholder="Conversation title"
                      />
                      <button
                        onClick={(e) => handleCheck(conv.conversationId, e)}
                        className="btn btn-ghost btn-xs"
                        aria-label="Save title"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="btn btn-ghost btn-xs"
                        aria-label="Cancel edit"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <p
                      className={`truncate text-sm ${
                        activeConvId === conv.conversationId
                          ? "font-semibold text-primary"
                          : "font-medium"
                      }`}
                    >
                      {conv.preview || "Untitled"}
                    </p>
                  )}
                </div>
                {editingId !== conv.conversationId && (
                  <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEdit(conv, e)}
                      className="btn btn-ghost btn-xs"
                      aria-label="Rename conversation"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => onDelete(conv.conversationId, e)}
                      className="btn btn-ghost btn-xs text-error hover:text-error"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}