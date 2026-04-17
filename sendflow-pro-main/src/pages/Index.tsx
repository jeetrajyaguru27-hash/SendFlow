import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Eye, Mail, MousePointerClick, Plus, Search, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { LoginPage } from "./Login";
import { api } from "@/api/client";

const Index = () => {
  const { isAuthenticated, token, login, user, loading, initialized } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const [campaignData, dashboard] = await Promise.all([
          api.getCampaigns(token),
          api.getDashboard(token),
        ]);

        const statsMap = new Map((dashboard.campaigns || []).map((campaign: any) => [campaign.campaign_id, campaign.stats]));
        const merged = (campaignData || []).map((campaign: any) => ({
          ...campaign,
          stats: statsMap.get(campaign.id) || {
            total_leads: 0,
            sent: 0,
            read: 0,
            clicked: 0,
            replied: 0,
          },
        }));

        setCampaigns(merged);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campaigns");
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [isAuthenticated, token]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch = [campaign.name, campaign.description, campaign.subject_template]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  if (!initialized) {
    return <div className="py-20 text-center text-white">Checking login status...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  const dailyProgress = Math.min(((user?.sent_today || 0) / (user?.daily_limit || 30)) * 100, 100);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="mt-1 text-muted-foreground">Your campaign dashboard, onboarding steps, and daily sending capacity in one place.</p>
        </div>
        <Link to="/campaign/new">
          <Button className="gradient-accent border-0 text-white hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <Card className="border-purple-500/30 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-sky-500/10">
        <CardHeader>
          <CardTitle className="text-lg text-white">Getting Started</CardTitle>
          <CardDescription>Follow this quick path to launch your first campaign safely.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          {[
            { step: "Step 1", title: "Add Account", icon: UserPlus, href: "/accounts" },
            { step: "Step 2", title: "Import Leads", icon: Mail, href: "/leads" },
            { step: "Step 3", title: "Create Campaign", icon: Plus, href: "/campaign/new" },
            { step: "Step 4", title: "Launch", icon: Send, href: "/app" },
          ].map((item) => (
            <Link key={item.title} to={item.href}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.step}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="rounded-xl bg-white/10 p-2">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-semibold text-white">{item.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Daily Send Limit</CardTitle>
            <CardDescription>
              {user?.sent_today || 0} / {user?.daily_limit || 30} emails used today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={dailyProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Remaining today: {Math.max(0, (user?.daily_limit || 30) - (user?.sent_today || 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Search & Filter</CardTitle>
            <CardDescription>Quickly narrow down campaigns by name or status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search campaigns..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="running">Active</option>
              <option value="paused">Paused</option>
              <option value="queued">Queued</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Error: {error}
        </div>
      )}

      {loading || loadingCampaigns ? (
        <div className="py-12 text-center text-muted-foreground">Loading campaigns...</div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mb-2 text-lg font-semibold text-foreground">No campaigns yet</p>
            <p className="mb-5 text-sm text-muted-foreground">Create your first campaign, import leads, and launch from the same workspace.</p>
            <Link to="/campaign/new">
              <Button className="gradient-accent border-0 text-white">Create your first campaign</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.map((campaign: any) => {
            const sent = campaign.stats?.sent || 0;
            const opened = campaign.stats?.read || 0;
            const clicked = campaign.stats?.clicked || 0;
            const replied = campaign.stats?.replied || 0;
            const replyRate = sent ? ((replied / sent) * 100).toFixed(1) : "0.0";

            return (
              <Link key={campaign.id} to={`/campaign/${campaign.id}`}>
                <Card className="group h-full border-border bg-card transition-all duration-200 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge status={campaign.status} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground group-hover:gradient-accent-text">
                        {campaign.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {campaign.description || "No description added yet."}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="rounded-xl bg-muted/30 p-3 text-center">
                        <Mail className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold text-foreground">{sent}</p>
                        <p className="text-[11px] text-muted-foreground">Sent</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3 text-center">
                        <Eye className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold text-foreground">{opened}</p>
                        <p className="text-[11px] text-muted-foreground">Opened</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3 text-center">
                        <MousePointerClick className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold text-foreground">{clicked}</p>
                        <p className="text-[11px] text-muted-foreground">Clicked</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3 text-center">
                        <Clock3 className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold text-foreground">{replyRate}%</p>
                        <p className="text-[11px] text-muted-foreground">Reply Rate</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                      Leads: <span className="text-foreground">{campaign.stats?.total_leads || 0}</span>
                      {" • "}
                      Scheduled start: <span className="text-foreground">{campaign.send_start_time ? new Date(campaign.send_start_time).toLocaleString() : "Not scheduled"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Index;
