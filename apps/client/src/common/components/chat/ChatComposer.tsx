import { useEffect, useRef } from "react";
import { Send, StopCircle } from "lucide-react";

interface ChatComposerProps {
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  onStop: () => void;
  placeholder?: string;
}

export default function ChatComposer({
  input,
  setInput,
  loading,
  onSend,
  onStop,
  placeholder = "Type a message...",
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="relative flex items-end gap-2 bg-base-100/80 backdrop-blur-xl rounded-2xl border border-base-300/50 p-2 pl-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] focus-within:border-primary/70 focus-within:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300">
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
        className="textarea textarea-ghost flex-1 resize-none focus:outline-none text-base-content placeholder:text-base-content/40"
        disabled={loading}
      />
      {loading ? (
        <button
          onClick={onStop}
          className="btn btn-error btn-circle shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-transform hover:scale-105"
          aria-label="Stop generation"
        >
          <StopCircle className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={onSend}
          className="btn btn-primary btn-circle disabled:opacity-40 shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-transform hover:scale-105"
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}