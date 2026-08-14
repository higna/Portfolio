import { MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface QuickPrompt {
  label: string;
  icon: LucideIcon;
}

interface ChatEmptyStateProps {
  prompts: QuickPrompt[];
  onSelect: (label: string) => void;
  title?: string;
  compact?: boolean;
}

export default function ChatEmptyState({
  prompts,
  onSelect,
  title = "Ask me anything",
  compact = false,
}: ChatEmptyStateProps) {
  return (
    <div className={compact ? "text-center pt-6" : "text-center pt-10"}>
      <MessageCircle
        className={compact ? "w-10 h-10 mx-auto text-primary/40 mb-3" : "w-16 h-16 mx-auto text-primary/40 mb-4"}
      />
      <h2
        className={`font-['Cormorant_Garamond'] text-base-content/70 ${
          compact ? "text-lg" : "text-2xl font-bold"
        }`}
      >
        {title}
      </h2>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {prompts.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className="btn btn-sm btn-outline btn-primary gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}