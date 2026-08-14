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
}

export default function ChatEmptyState({
  prompts,
  onSelect,
  title = "Ask me anything",
}: ChatEmptyStateProps) {
  return (
    <div className="text-center pt-10 sm:pt-16 px-4">
      <div className="relative inline-flex">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-60" />
        <div className="relative w-16 h-16 rounded-2xl bg-base-100/70 backdrop-blur-xl border border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-base-content/90 font-['Cormorant_Garamond']">
        {title}
      </h2>
      <p className="mt-2 text-sm text-base-content/50">
        Choose a prompt below or type your own message
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xl mx-auto">
        {prompts.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className="btn btn-sm btn-ghost border border-base-300/60 rounded-full gap-2 text-base-content/80 hover:bg-base-200/70 hover:border-primary/30 hover:text-primary transition-all hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]"
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}