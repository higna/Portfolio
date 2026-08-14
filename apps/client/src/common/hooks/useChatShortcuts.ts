import { useEffect } from "react";

interface ChatShortcutsOptions {
  onNewChat: () => void;
  onStop: () => void;
  onFocusComposer?: () => void;
  isGenerating: boolean;
}

export function useChatShortcuts({
  onNewChat,
  onStop,
  onFocusComposer,
  isGenerating,
}: ChatShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onNewChat();
      } else if (e.key === "Escape" && isGenerating) {
        onStop();
      } else if (e.key === "/" && !isTyping && onFocusComposer) {
        e.preventDefault();
        onFocusComposer();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewChat, onStop, onFocusComposer, isGenerating]);
}