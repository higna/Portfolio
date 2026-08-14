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
    <div className="flex gap-2 items-end bg-base-100/60 backdrop-blur-xl rounded-2xl border border-base-300/40 p-2">
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
        <button onClick={onStop} className="btn btn-error btn-circle" aria-label="Stop generation">
          <StopCircle className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={onSend}
          className="btn btn-primary btn-circle disabled:opacity-40"
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}