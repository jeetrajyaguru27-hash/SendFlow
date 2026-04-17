import { Bell, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/api/client";

type LayoutProps = {
  children: React.ReactNode;
};

const getStoredTheme = () => localStorage.getItem("sendflow_theme") || "dark";

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, token, user, accounts } = useAuth();
  const [theme, setTheme] = useState<string>(getStoredTheme);
  const [summary, setSummary] = useState({
    totalLeads: 0,
    emailsSent: 0,
    openRate: 0,
    replyRate: 0,
    notifications: 0,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("sendflow_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const loadSummary = async () => {
      try {
        const [dashboard, inbox] = await Promise.all([
          api.getAnalyticsOverview(token),
          api.getInbox(token),
        ]);
        const notificationCount = (inbox.messages || []).filter((message: any) => message.needs_follow_up || message.reply_category === "interested").length;
        const totalLeads = (dashboard.best_campaigns || []).reduce((sum: number, campaign: any) => sum + ((campaign.sent || 0) + (campaign.replies || 0)), 0);
        setSummary({
          totalLeads,
          emailsSent: dashboard.summary.emails_sent || 0,
          openRate: dashboard.summary.open_rate || 0,
          replyRate: dashboard.summary.reply_rate || 0,
          notifications: notificationCount,
        });
      } catch {
        // Ignore summary fetch failures in shell.
      }
    };

    loadSummary();
  }, [isAuthenticated, token]);

  const accountLabel = useMemo(() => {
    if (!user) return "No sender connected";
    if (accounts.length <= 1) return user.email;
    return `${user.email} +${accounts.length - 1} more`;
  }, [accounts.length, user]);

  return (
    <div className="flex min-h-screen bg-[#04050b] text-white">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.16),_transparent_40%)] px-4 py-4 backdrop-blur-2xl md:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">SendFlow</p>
                <p className="text-xs text-slate-400">Dark-mode outbound workspace</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 md:block">
                  {accountLabel}
                </div>
                <Link to="/inbox">
                  <Button variant="outline" size="icon" className="relative border-white/10 bg-white/5 text-white hover:bg-white/10">
                    <Bell className="h-4 w-4" />
                    {summary.notifications > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {summary.notifications}
                      </span>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isAuthenticated && (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Leads</p>
                  <p className="mt-2 text-2xl font-bold text-white">{summary.totalLeads}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Emails Sent Today</p>
                  <p className="mt-2 text-2xl font-bold text-white">{user?.sent_today || 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Open Rate</p>
                  <p className="mt-2 text-2xl font-bold text-white">{summary.openRate}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reply Rate</p>
                  <p className="mt-2 text-2xl font-bold text-white">{summary.replyRate}%</p>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
