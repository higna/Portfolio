import { useEffect } from "react";

interface ChatShortcutsOptions {
  onNewChat: () => void;
  onStop: () => void;
  isGenerating: boolean;
}

export function useChatShortcuts({ onNewChat, onStop, isGenerating }: ChatShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onNewChat();
      } else if (e.key === "Escape" && isGenerating) {
        onStop();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewChat, onStop, isGenerating]);
}