import ChatAvatar from "./ChatAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-3">
        <ChatAvatar role="ai" />
        <div className="px-4 py-3 rounded-2xl bg-base-100 border border-base-300/40 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  );
}