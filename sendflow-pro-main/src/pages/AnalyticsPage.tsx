import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/api/client";

const AnalyticsPage = () => {
  const { token, isAuthenticated } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const analytics = await api.getAnalyticsOverview(token);
        setData(analytics);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, isAuthenticated]);

  if (!isAuthenticated) {
    return <div className="py-12 text-center text-muted-foreground">Login to view analytics.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Open rate trends, best campaigns, sequence performance, and send timing insights.</p>
      </div>

      {loading || !data ? (
        <div className="py-12 text-center text-muted-foreground">Loading analytics...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card border-border"><CardContent className="pt-6"><p className="text-2xl font-bold">{data.summary.campaigns}</p><p className="text-xs text-muted-foreground mt-1">Campaigns</p></CardContent></Card>
            <Card className="bg-card border-border"><CardContent className="pt-6"><p className="text-2xl font-bold">{data.summary.emails_sent}</p><p className="text-xs text-muted-foreground mt-1">Emails Sent</p></CardContent></Card>
            <Card className="bg-card border-border"><CardContent className="pt-6"><p className="text-2xl font-bold">{data.summary.open_rate}%</p><p className="text-xs text-muted-foreground mt-1">Open Rate</p></CardContent></Card>
            <Card className="bg-card border-border"><CardContent className="pt-6"><p className="text-2xl font-bold">{data.summary.reply_rate}%</p><p className="text-xs text-muted-foreground mt-1">Reply Rate</p></CardContent></Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Open Rate Over Time</CardTitle>
                <CardDescription>Line chart of opens, clicks, and replies</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.open_rate_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="opens" stroke="#a855f7" strokeWidth={2} />
                    <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="replies" stroke="#f43f5e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Best Performing Campaigns</CardTitle>
                <CardDescription>Campaign reply rate comparison</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.best_campaigns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="campaign_name" stroke="#94a3b8" hide />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="reply_rate" fill="#ec4899" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Reply Rate By Sequence Step</CardTitle>
                <CardDescription>See which follow-up step drives replies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.reply_rate_by_sequence_step.length === 0 ? (
                  <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                    No sequence step analytics yet.
                  </div>
                ) : (
                  data.reply_rate_by_sequence_step.map((item: any) => (
                    <div key={item.sequence_step_id} className="rounded-lg border border-border p-4">
                      <p className="font-medium text-foreground">Sequence Step #{item.sequence_step_id}</p>
                      <p className="text-sm text-muted-foreground">Sent: {item.sent} • Replies: {item.replies} • Reply rate: {item.reply_rate}%</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Best Time Of Day</CardTitle>
                <CardDescription>Heatmap-style hourly send distribution</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-3 md:grid-cols-6">
                {data.best_time_of_day.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                    No time-of-day data yet.
                  </div>
                ) : (
                  data.best_time_of_day.map((slot: any) => (
                    <div key={slot.hour} className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                      <p className="text-lg font-semibold text-foreground">{slot.hour}:00</p>
                      <p className="text-xs text-muted-foreground mt-1">{slot.count} sends</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
