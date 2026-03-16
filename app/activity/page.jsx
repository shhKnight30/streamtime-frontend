import Link from "next/link";
import { History, MessageSquare, ThumbsUp, Video, ChevronRight } from "lucide-react";

export default function ActivityHubPage() {
  const MenuLink = ({ href, icon: Icon, title, description }) => (
    <Link 
      href={href} 
      className="group flex items-center justify-between p-4 transition-colors hover:bg-[var(--surface-raised)] rounded-xl border border-transparent hover:border-[var(--border)]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] group-hover:bg-[var(--surface)]">
          <Icon className="h-5 w-5 text-[var(--text-primary)]" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[var(--text-primary)]">{title}</span>
          <span className="text-sm text-[var(--text-muted)]">{description}</span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
    </Link>
  );

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Your Activity</h1>
        <p className="text-sm text-[var(--text-muted)]">One place to manage your interactions and content history.</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Section 1: Content History */}
        <section className="flex flex-col gap-2">
          <h2 className="px-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">How you use StreamTime</h2>
          <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
            <MenuLink 
              href="/activity/history" 
              icon={History} 
              title="Watch History" 
              description="Videos you have watched" 
            />
          </div>
        </section>

        {/* Section 2: Interactions */}
        <section className="flex flex-col gap-2">
          <h2 className="px-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Interactions</h2>
          <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
            <MenuLink 
              href="/liked" 
              icon={ThumbsUp} 
              title="Likes" 
              description="Videos you have liked" 
            />
            <div className="mx-4 h-px bg-[var(--border)]" />
            <MenuLink 
              href="/activity/comments" 
              icon={MessageSquare} 
              title="Comments" 
              description="Comments you have posted" 
            />
          </div>
        </section>

        {/* Section 3: Your Content */}
        <section className="flex flex-col gap-2">
          <h2 className="px-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Your Content</h2>
          <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
            <MenuLink 
              href="/dashboard" 
              icon={Video} 
              title="Your Uploads" 
              description="Manage your published videos" 
            />
          </div>
        </section>

      </div>
    </div>
  );
}