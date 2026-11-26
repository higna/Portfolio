import { ArrowUpRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface QuickPrompt {
  label: string;
  icon: LucideIcon;
}

interface ChatEmptyStateProps {
  prompts: QuickPrompt[];
  onSelect: (label: string) => void;
  title?: string;
}

export default function ChatEmptyState({
  prompts,
  onSelect,
  title = "A good conversation can start anywhere.",
}: ChatEmptyStateProps) {
  return (
    <div className="px-1 py-8 sm:px-4 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="size-3.5" />
          Your portfolio guide
        </div>

        <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-end">
          <div>
            <h2 className="max-w-xl text-4xl font-medium leading-[1.04] tracking-tight text-base-content sm:text-5xl lg:text-6xl">
              {title}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-base-content/60 sm:text-base">
              Get to know the work, the thinking behind it, and how we could
              build something useful together.
            </p>
          </div>
          <div className="relative hidden min-h-40 overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 p-6 md:flex md:items-end">
            <div className="absolute -right-8 -top-14 size-48 rounded-full border border-primary/20" />
            <div className="absolute -right-2 -top-8 size-36 rounded-full border border-primary/15" />
            <div className="absolute right-8 top-8 size-20 rounded-full bg-primary/15 blur-xl" />
            <div className="relative">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-base-content/45">
                Curious about
              </span>
              <p className="mt-1 text-xl font-medium tracking-tight">
                ideas, craft &amp; impact
              </p>
            </div>
          </div>
        </div>

        <div className="mt-9">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-base-content/45">
              Try asking
            </p>
            <p className="text-xs text-base-content/40">Choose a starting point</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {prompts.map(({ label, icon: Icon }) => (
              <button
                type="button"
                key={label}
                onClick={() => onSelect(label)}
                className="group flex min-h-16 items-center gap-3 rounded-2xl border border-base-300/70 bg-base-100/80 px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-base-100 hover:shadow-lg hover:shadow-base-content/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-base-content/80">
                  {label}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-base-content/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}