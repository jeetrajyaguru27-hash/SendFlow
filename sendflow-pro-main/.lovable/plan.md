

# SendFlow — Email Campaign Dashboard UI

**Brand:** "SendFlow" by Jeet Rajyaguru
**Design:** Dark theme matching portfolio — near-black background (#0a0a0a), white text, pink-blue-purple gradient accents. Clean, modern, minimal.

## Pages & Flow

### 1. Campaigns Page (Home `/`)
- List of all campaigns as cards showing: campaign name, status (draft/active/completed), date created, number of leads, quick stats (sent/opened/clicked)
- "Create New Campaign" button with gradient accent
- Click a campaign → goes to Campaign Detail page
- Header with "SendFlow" branding + "by Jeet Rajyaguru" subtle text

### 2. Campaign Detail Page (`/campaign/:id`)
- **Analytics Tab** — Key metrics cards + charts:
  - Emails Sent, Delivered, Opened, Clicked, Bounced, Unsubscribed
  - Open rate, click rate, bounce rate percentages
  - Timeline chart showing email activity over time
  - Link click tracking table
- **Leads Tab** — Campaign-specific leads table:
  - Lead name, email, status (sent/opened/clicked/bounced)
  - Import leads (CSV upload UI mockup)
  - Search & filter leads
  - Each lead belongs ONLY to this campaign

### 3. Create/Edit Campaign Page (`/campaign/new`)
- Form: Campaign name, subject line, sender name, sender email
- Simple campaign settings

## Design Details
- Dark background `#0A0A0F`, cards `#111118`, borders `#1e1e2e`
- Gradient accent: `from-pink-500 via-purple-500 to-blue-500` for highlights, buttons, active states
- White primary text, gray-400 secondary text
- Sidebar navigation with SendFlow logo, campaign list, and settings
- All data is mock/static — UI only, no backend

## Tech Notes
- React + Tailwind + shadcn/ui components
- React Router for page navigation
- Recharts for analytics charts
- Mock data for all campaigns, leads, and analytics
- To use in VS Code: clone/download the repo from Lovable's GitHub sync feature

