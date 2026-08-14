import { FileText, FolderGit2, Wrench, GraduationCap, MessageCircle, Briefcase } from "lucide-react";
import type { QuickPrompt } from "./ChatEmptyState";

export const defaultQuickPrompts: QuickPrompt[] = [
  { label: "I need his CV", icon: FileText },
  { label: "Tell me about his projects", icon: FolderGit2 },
  { label: "I need a service", icon: Wrench },
  { label: "What technologies does he use?", icon: GraduationCap },
  { label: "Show me his portfolio", icon: MessageCircle },
  { label: "How can we collaborate?", icon: Briefcase },
];