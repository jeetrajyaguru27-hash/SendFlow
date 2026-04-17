import { BarChart3, Brain, Inbox, LayoutDashboard, LogOut, MailPlus, Menu, Users, Workflow } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Campaigns", url: "/app", icon: LayoutDashboard },
  { title: "New Campaign", url: "/campaign/new", icon: MailPlus },
  { title: "Lead Intelligence", url: "/leads", icon: Brain },
  { title: "Inbox", url: "/inbox", icon: Inbox },
  { title: "Accounts", url: "/accounts", icon: Users },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Sequences", url: "/sequence/new", icon: Workflow },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? "w-[88px]" : "w-[320px]"} shrink-0 border-r border-white/10 bg-[#090a12] text-white transition-all duration-200`}>
      <div className="flex h-full min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/logo.png" alt="SendFlow Logo" className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-rose-500/20" />
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">SendFlow</h1>
                <p className="text-xs text-slate-400">Campaign workspace</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setCollapsed((current) => !current)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 px-2 pb-4">
          {!collapsed && <p className="px-3 pb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/app"}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
                activeClassName="bg-white/10 text-white ring-1 ring-fuchsia-500/70"
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="space-y-3 p-5">
          {user && !collapsed && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Active sender</p>
              <p className="mt-2 text-sm font-medium text-white break-all">{user.email}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="w-full border-red-600/30 bg-transparent text-red-400 hover:bg-red-600/10 hover:text-red-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Logout"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
