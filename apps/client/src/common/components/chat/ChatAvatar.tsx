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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-secondary/20 text-base-content ring-1 ring-primary/30 shadow-md shadow-primary/25">
          <Bot className="w-4 h-4" />
        </div>
      </div>
    );
  }

  const imageUrl = user?.avatarUrl || user?.picture || user?.photoURL || user?.image;

  if (imageUrl) {
    return (
      <div className="avatar shrink-0">
        <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-primary/60 ring-offset-1 ring-offset-base-100 shadow-md shadow-primary/20">
          <img src={imageUrl} alt={user?.fullName || user?.name || "You"} referrerPolicy="no-referrer" />
        </div>
      </div>
    );
  }

  const initials = getInitials(user?.fullName || user?.name);

  if (initials) {
    return (
      <div className="avatar placeholder shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary to-secondary text-primary-content ring-1 ring-primary/40 shadow-md shadow-primary/30">
          <span className="text-xs font-semibold">{initials}</span>
        </div>
      </div>
    );
  }

  // Guest fallback
  return (
    <div className="avatar placeholder shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-300/60 text-base-content/70 ring-1 ring-primary/30 shadow-sm shadow-primary/15">
        <User className="w-4 h-4" />
      </div>
    </div>
  );
}
