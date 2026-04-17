import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  running: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  queued: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paused: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  scheduled: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sent: "bg-muted text-muted-foreground border-border",
  delivered: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  opened: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  clicked: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  bounced: "bg-red-500/10 text-red-400 border-red-500/20",
  unsubscribed: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize text-xs", statusStyles[status] || "")}>
      {status}
    </Badge>
  );
}
