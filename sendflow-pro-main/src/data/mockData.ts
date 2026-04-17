export interface Lead {
  id: string;
  name: string;
  email: string;
  status: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed";
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  status: "draft" | "active" | "completed";
  createdAt: string;
  leads: Lead[];
  analytics: CampaignAnalytics;
}

export interface CampaignAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  timeline: { date: string; opened: number; clicked: number; bounced: number }[];
  linkClicks: { url: string; clicks: number; uniqueClicks: number }[];
}

const generateLeads = (count: number): Lead[] => {
  const names = ["Alex Johnson", "Sarah Chen", "Mike Patel", "Emily Davis", "Ryan Kim", "Lisa Wang", "Tom Brown", "Anna Garcia", "David Lee", "Maria Rodriguez", "James Wilson", "Priya Sharma", "Chris Martinez", "Nina Foster", "Sam Taylor"];
  const statuses: Lead["status"][] = ["sent", "delivered", "opened", "clicked", "bounced", "unsubscribed"];
  return Array.from({ length: count }, (_, i) => ({
    id: `lead-${i + 1}`,
    name: names[i % names.length],
    email: `${names[i % names.length].toLowerCase().replace(" ", ".")}@example.com`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    sentAt: new Date(2024, 2, Math.floor(Math.random() * 28) + 1).toISOString(),
    openedAt: Math.random() > 0.4 ? new Date(2024, 2, Math.floor(Math.random() * 28) + 1).toISOString() : undefined,
    clickedAt: Math.random() > 0.6 ? new Date(2024, 2, Math.floor(Math.random() * 28) + 1).toISOString() : undefined,
  }));
};

const generateTimeline = () =>
  Array.from({ length: 14 }, (_, i) => ({
    date: `Mar ${i + 1}`,
    opened: Math.floor(Math.random() * 120) + 20,
    clicked: Math.floor(Math.random() * 60) + 5,
    bounced: Math.floor(Math.random() * 15),
  }));

export const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Product Launch 2024",
    subject: "Introducing our newest innovation 🚀",
    senderName: "Jeet Rajyaguru",
    senderEmail: "jeet@sendflow.io",
    status: "active",
    createdAt: "2024-03-01T10:00:00Z",
    leads: generateLeads(250),
    analytics: {
      sent: 250, delivered: 242, opened: 178, clicked: 89, bounced: 8, unsubscribed: 3,
      timeline: generateTimeline(),
      linkClicks: [
        { url: "https://example.com/product", clicks: 67, uniqueClicks: 52 },
        { url: "https://example.com/pricing", clicks: 34, uniqueClicks: 29 },
        { url: "https://example.com/demo", clicks: 21, uniqueClicks: 18 },
      ],
    },
  },
  {
    id: "2",
    name: "Weekly Newsletter #12",
    subject: "This week in tech — top stories",
    senderName: "Jeet Rajyaguru",
    senderEmail: "newsletter@sendflow.io",
    status: "completed",
    createdAt: "2024-02-20T09:00:00Z",
    leads: generateLeads(180),
    analytics: {
      sent: 180, delivered: 175, opened: 132, clicked: 45, bounced: 5, unsubscribed: 2,
      timeline: generateTimeline(),
      linkClicks: [
        { url: "https://example.com/blog/post-1", clicks: 28, uniqueClicks: 24 },
        { url: "https://example.com/blog/post-2", clicks: 17, uniqueClicks: 15 },
      ],
    },
  },
  {
    id: "3",
    name: "Black Friday Deals",
    subject: "🔥 50% off everything — today only",
    senderName: "Jeet Rajyaguru",
    senderEmail: "deals@sendflow.io",
    status: "completed",
    createdAt: "2024-01-24T08:00:00Z",
    leads: generateLeads(500),
    analytics: {
      sent: 500, delivered: 488, opened: 356, clicked: 201, bounced: 12, unsubscribed: 7,
      timeline: generateTimeline(),
      linkClicks: [
        { url: "https://example.com/deals", clicks: 156, uniqueClicks: 132 },
        { url: "https://example.com/shop", clicks: 89, uniqueClicks: 71 },
        { url: "https://example.com/cart", clicks: 45, uniqueClicks: 38 },
      ],
    },
  },
  {
    id: "4",
    name: "Onboarding Sequence",
    subject: "Welcome to SendFlow! Let's get started",
    senderName: "Jeet Rajyaguru",
    senderEmail: "hello@sendflow.io",
    status: "draft",
    createdAt: "2024-03-10T14:00:00Z",
    leads: generateLeads(45),
    analytics: {
      sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0,
      timeline: [],
      linkClicks: [],
    },
  },
];
