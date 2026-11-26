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
    <div className="relative flex items-end gap-2 rounded-[1.4rem] border border-base-300/70 bg-base-100 p-2 pl-4 shadow-xl shadow-base-content/5 transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/10">
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
        aria-label="Message"
        className="textarea textarea-ghost min-h-11 flex-1 resize-none px-1 py-2 text-sm leading-6 text-base-content focus:outline-none placeholder:text-base-content/40 sm:text-base"
        disabled={loading}
      />
      {loading ? (
        <button
          onClick={onStop}
          className="btn btn-error btn-circle shadow-lg shadow-error/20 transition-transform hover:scale-105"
          aria-label="Stop generation"
        >
          <StopCircle className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={onSend}
          className="btn btn-primary btn-circle shadow-lg shadow-primary/20 transition-transform hover:scale-105 disabled:opacity-40"
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}