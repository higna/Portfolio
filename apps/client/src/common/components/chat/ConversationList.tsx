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
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groups: { label: string; items: ChatConversation[] }[] = [];

  const todayConvs = convs.filter((c) => new Date(c.createdAt).toDateString() === today);
  const yesterdayConvs = convs.filter((c) => new Date(c.createdAt).toDateString() === yesterday);
  const olderConvs = convs.filter((c) => {
    const d = new Date(c.createdAt).toDateString();
    return d !== today && d !== yesterday;
  });

  if (todayConvs.length) groups.push({ label: "Today", items: todayConvs });
  if (yesterdayConvs.length) groups.push({ label: "Yesterday", items: yesterdayConvs });
  if (olderConvs.length) groups.push({ label: "Previous 7 Days", items: olderConvs });

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
      <div className="text-center text-base-content/40 py-8">
        <MessageCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-xs">{emptyLabel}</p>
      </div>
    );
  }

  const startEdit = (conv: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.conversationId);
    setDraftTitle(conv.preview);
  };

  const finishEdit = (id: string) => {
    onRename(id, draftTitle);
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
    }
  };

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs uppercase tracking-widest text-base-content/40 px-2 mt-4 mb-1">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((conv) => (
              <div
                key={conv.conversationId}
                onClick={() => onSelect(conv.conversationId)}
                className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                  activeConvId === conv.conversationId
                    ? "bg-primary/10 border border-primary/30 text-primary"
                    : "hover:bg-base-200 text-base-content/80"
                }`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === conv.conversationId ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => handleKey(conv.conversationId, e)}
                        className="input input-xs input-ghost flex-1"
                      />
                      <button onClick={(e) => handleCheck(conv.conversationId, e)} className="btn btn-ghost btn-xs">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="btn btn-ghost btn-xs">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="truncate text-sm font-medium">{conv.preview}</p>
                  )}
                </div>
                {editingId !== conv.conversationId && (
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEdit(conv, e)}
                      className="btn btn-ghost btn-xs"
                      aria-label="Rename conversation"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => onDelete(conv.conversationId, e)}
                      className="btn btn-ghost btn-xs text-error"
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