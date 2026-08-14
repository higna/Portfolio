import ChatAvatar from "./ChatAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-3">
        <ChatAvatar role="ai" />
        <div className="px-4 py-3 rounded-2xl bg-base-100/70 backdrop-blur-md border border-base-300/40 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
        </div>
      </div>
    </div>
  );
}