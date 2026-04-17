import { useEffect, useMemo, useState } from "react";
import { Inbox, RefreshCcw, Reply, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

const InboxPage = () => {
  const { token, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getInbox(token);
      setMessages(data.messages || []);
      setSelectedMessageId((current) => current || data.messages?.[0]?.id || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetchInbox();
  }, [isAuthenticated, token]);

  const filteredMessages = useMemo(() => {
    if (!search) return messages;
    return messages.filter((message) =>
      [message.subject, message.from_name, message.from_email, message.campaign_name, message.snippet]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.toLowerCase()))
    );
  }, [messages, search]);

  const selectedMessage = filteredMessages.find((message) => message.id === selectedMessageId) || filteredMessages[0] || null;

  const handleReply = async () => {
    if (!token || !selectedMessage || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      await api.replyToInboxThread(token, {
        thread_id: selectedMessage.thread_id,
        to_email: selectedMessage.from_email,
        subject: selectedMessage.subject,
        body: replyBody,
      });
      setReplyBody("");
      toast({ title: "Reply sent", description: "Your reply was sent successfully." });
      fetchInbox();
    } catch (err) {
      toast({
        title: "Reply failed",
        description: err instanceof Error ? err.message : "Could not send reply",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  const markFollowUp = async () => {
    if (!token || !selectedMessage?.lead_id) return;
    await api.markLeadNeedsFollowUp(token, selectedMessage.lead_id);
    toast({ title: "Marked for follow-up" });
    fetchInbox();
  };

  const markConverted = async () => {
    if (!token || !selectedMessage?.lead_id) return;
    await api.markLeadConverted(token, selectedMessage.lead_id);
    toast({ title: "Lead marked as converted" });
    fetchInbox();
  };

  if (!isAuthenticated) {
    return <div className="py-12 text-center text-muted-foreground">Login to view your Gmail inbox.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inbox</h1>
          <p className="mt-1 text-muted-foreground">Replies for {user?.email}, grouped with their campaign context and next actions.</p>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Search by sender, subject, or campaign..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-[320px]"
          />
          <Button variant="outline" onClick={fetchInbox} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-4 text-sm text-red-300">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="h-4 w-4" />
              Reply Threads
            </CardTitle>
            <CardDescription>Actual Gmail subjects and senders, not raw message IDs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
                No inbox threads match your search.
              </div>
            ) : (
              filteredMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedMessageId(message.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedMessage?.id === message.id
                      ? "border-purple-500/40 bg-purple-500/5"
                      : "border-border bg-muted/10 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{message.subject}</p>
                      <p className="text-sm text-muted-foreground">{message.from_name || message.from_email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {message.received_at ? new Date(message.received_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{message.snippet}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.campaign_name && (
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                        Campaign: {message.campaign_name}
                      </span>
                    )}
                    {message.reply_category && (
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs capitalize text-rose-300">
                        {message.reply_category}
                      </span>
                    )}
                    {message.needs_follow_up && (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">Needs follow-up</span>
                    )}
                    {message.converted && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">Converted</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">{selectedMessage?.subject || "Select a message thread"}</CardTitle>
            <CardDescription>
              {selectedMessage ? `${selectedMessage.from_name || selectedMessage.from_email} • ${selectedMessage.campaign_name || "No campaign matched"}` : "Choose a message to view details and reply"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMessage ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Sender</p>
                    <p className="mt-1 text-foreground">{selectedMessage.from_name || selectedMessage.from_email}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Campaign</p>
                    <p className="mt-1 text-foreground">{selectedMessage.campaign_name || "No matched campaign"}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Lead</p>
                    <p className="mt-1 text-foreground">{selectedMessage.lead_email || "Unknown lead"}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Received</p>
                    <p className="mt-1 text-foreground">{selectedMessage.received_at ? new Date(selectedMessage.received_at).toLocaleString() : "Unknown"}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Thread history</p>
                  <div className="whitespace-pre-wrap text-sm text-foreground">{selectedMessage.body || selectedMessage.snippet}</div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={markFollowUp} disabled={!selectedMessage.lead_id}>
                    <Star className="mr-2 h-4 w-4" />
                    Mark Needs Follow-up
                  </Button>
                  <Button variant="outline" onClick={markConverted} disabled={!selectedMessage.lead_id}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Mark Converted
                  </Button>
                </div>

                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="font-medium text-foreground">Reply</p>
                  <Textarea
                    rows={8}
                    placeholder="Write your reply..."
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                  />
                  <Button onClick={handleReply} disabled={sendingReply || !replyBody.trim()}>
                    <Reply className="mr-2 h-4 w-4" />
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
                Choose a thread from the left to view sender, campaign, and reply tools.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InboxPage;
