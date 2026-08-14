import { Bot, User } from "lucide-react";

interface ChatUserLike {
  fullName?: string;
  name?: string;
  avatarUrl?: string;
  picture?: string;
  photoURL?: string;
  image?: string;
}

interface ChatAvatarProps {
  role: "user" | "ai";
  user?: ChatUserLike | null;
}

function getInitials(name?: string) {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function ChatAvatar({ role, user }: ChatAvatarProps) {
  if (role === "ai") {
    return (
      <div className="avatar placeholder shrink-0">
        <div className="w-8 h-8 rounded-full bg-base-300/60 text-base-content/70 ring-1 ring-primary/30 flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
      </div>
    );
  }

  const imageUrl = user?.avatarUrl || user?.picture || user?.photoURL || user?.image;

  if (imageUrl) {
    return (
      <div className="avatar shrink-0">
        <div className="w-8 h-8 rounded-full ring-1 ring-primary/60 ring-offset-1 ring-offset-base-100 overflow-hidden">
          <img src={imageUrl} alt={user?.fullName || user?.name || "You"} referrerPolicy="no-referrer" />
        </div>
      </div>
    );
  }

  const initials = getInitials(user?.fullName || user?.name);

  if (initials) {
    return (
      <div className="avatar placeholder shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-content ring-1 ring-primary/40 flex items-center justify-center">
          <span className="text-xs font-semibold">{initials}</span>
        </div>
      </div>
    );
  }

  // Guest fallback
  return (
    <div className="avatar placeholder shrink-0">
      <div className="w-8 h-8 rounded-full bg-base-300/60 text-base-content/70 ring-1 ring-primary/30 flex items-center justify-center">
        <User className="w-4 h-4" />
      </div>
    </div>
  );
}