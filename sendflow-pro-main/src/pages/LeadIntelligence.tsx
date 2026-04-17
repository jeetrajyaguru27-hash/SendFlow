import { useEffect, useMemo, useState } from "react";
import { Download, Filter, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

const pipelineStages = ["new", "contacted", "opened", "replied", "converted", "unsubscribed"];

const emptyLeadForm = {
  email: "",
  name: "",
  company: "",
  title: "",
  phone: "",
  website: "",
  linkedin_url: "",
  location: "",
  source: "",
  notes: "",
  timezone: "",
  priority: "normal",
};

const LeadIntelligence = () => {
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("last_contacted");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [assignTargetCampaignId, setAssignTargetCampaignId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualLead, setManualLead] = useState(emptyLeadForm);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});

  const loadCampaigns = async () => {
    if (!token) return;
    const campaignData = await api.getCampaigns(token);
    setCampaigns(campaignData || []);
    if (campaignData?.length) {
      setSelectedCampaignId((current) => current ?? campaignData[0].id);
      setAssignTargetCampaignId((current) => current ?? campaignData[0].id);
    }
  };

  const loadLeads = async (campaignId: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const leadData = await api.getCampaignLeads(token, campaignId);
      setLeads(leadData || []);
      setSelectedLeadId((current) => current ?? leadData?.[0]?.id ?? null);
      setSelectedLeadIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    loadCampaigns();
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!token || !selectedCampaignId) return;
    loadLeads(selectedCampaignId);
  }, [token, selectedCampaignId]);

  const companies = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.company).filter(Boolean))).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const base = leads.filter((lead) => {
      const matchesSearch = !search || [lead.name, lead.email, lead.company, lead.title, lead.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || lead.lifecycle_stage === statusFilter;
      const matchesCompany = companyFilter === "all" || lead.company === companyFilter;
      return matchesSearch && matchesStatus && matchesCompany;
    });

    return base.sort((a, b) => {
      if (sortBy === "company") return String(a.company || "").localeCompare(String(b.company || ""));
      if (sortBy === "status") return String(a.lifecycle_stage || "").localeCompare(String(b.lifecycle_stage || ""));
      const aDate = a.last_contacted_at || a.replied_at || a.read_at || a.sent_at || "";
      const bDate = b.last_contacted_at || b.replied_at || b.read_at || b.sent_at || "";
      return String(bDate).localeCompare(String(aDate));
    });
  }, [companyFilter, leads, search, sortBy, statusFilter]);

  const selectedLead = filteredLeads.find((lead) => lead.id === selectedLeadId) || filteredLeads[0] || null;

  const toggleSelectedLead = (leadId: number) => {
    setSelectedLeadIds((current) =>
      current.includes(leadId) ? current.filter((id) => id !== leadId) : [...current, leadId]
    );
  };

  const selectAllVisible = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
      return;
    }
    setSelectedLeadIds(filteredLeads.map((lead) => lead.id));
  };

  const handleDelete = async () => {
    if (!token || !selectedCampaignId || selectedLeadIds.length === 0) return;
    await api.deleteLeads(token, selectedCampaignId, selectedLeadIds);
    toast({ title: "Leads deleted", description: `${selectedLeadIds.length} lead(s) removed.` });
    await loadLeads(selectedCampaignId);
  };

  const handleAssign = async () => {
    if (!token || !selectedCampaignId || !assignTargetCampaignId || selectedLeadIds.length === 0) return;
    await api.assignLeadsToCampaign(token, selectedCampaignId, {
      lead_ids: selectedLeadIds,
      target_campaign_id: assignTargetCampaignId,
    });
    toast({ title: "Leads assigned", description: "Selected leads were copied to the target campaign." });
  };

  const exportSelected = () => {
    const rows = filteredLeads.filter((lead) => selectedLeadIds.includes(lead.id));
    if (rows.length === 0) return;
    const headers = ["name", "email", "company", "title", "status", "lifecycle_stage", "source", "last_contacted_at"];
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sendflow-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleManualAdd = async () => {
    if (!token || !selectedCampaignId) return;
    await api.createManualLead(token, selectedCampaignId, manualLead);
    setManualLead(emptyLeadForm);
    toast({ title: "Lead added", description: "The lead is now in your campaign." });
    await loadLeads(selectedCampaignId);
  };

  const handleImportPreview = async () => {
    if (!token || !selectedCampaignId || !importFile) return;
    const preview = await api.previewLeadImport(token, selectedCampaignId, importFile);
    setImportPreview(preview);
    setMapping(preview.suggested_mapping || {});
  };

  const handleMappedImport = async () => {
    if (!token || !selectedCampaignId || !importPreview) return;
    await api.importLeadsWithMapping(token, selectedCampaignId, {
      campaign_id: selectedCampaignId,
      rows: importPreview.rows || [],
      mapping,
    });
    toast({ title: "CSV imported", description: "Lead rows were imported with your mapping." });
    setImportFile(null);
    setImportPreview(null);
    await loadLeads(selectedCampaignId);
  };

  const handleStageChange = async (leadId: number, lifecycleStage: string) => {
    if (!token || !selectedCampaignId) return;
    await api.updateLeadStage(token, selectedCampaignId, leadId, lifecycleStage);
    await loadLeads(selectedCampaignId);
  };

  if (!isAuthenticated) {
    return <div className="py-12 text-center text-muted-foreground">Login to view lead intelligence.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Intelligence</h1>
          <p className="mt-1 text-muted-foreground">Filter, sort, bulk-manage, and inspect every lead with thread history and campaign context.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportSelected} disabled={selectedLeadIds.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleDelete} disabled={selectedLeadIds.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Lead Table</CardTitle>
              <CardDescription>Search, filter, sort, then run bulk actions against selected leads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[210px_1fr_160px_180px_170px]">
                <select
                  value={selectedCampaignId ?? ""}
                  onChange={(event) => setSelectedCampaignId(Number(event.target.value))}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Search by lead, company, title, source..."
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="all">All stages</option>
                  {pipelineStages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                <select
                  value={companyFilter}
                  onChange={(event) => setCompanyFilter(event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="all">All companies</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="last_contacted">Last contacted</option>
                  <option value="company">Company</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/10 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  {selectedLeadIds.length} selected
                </div>
                <select
                  value={assignTargetCampaignId ?? ""}
                  onChange={(event) => setAssignTargetCampaignId(Number(event.target.value))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={handleAssign} disabled={selectedLeadIds.length === 0}>
                  Assign to Campaign
                </Button>
                <Button variant="ghost" onClick={selectAllVisible}>
                  {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? "Clear Selection" : "Select Visible"}
                </Button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading leads...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                  <p className="text-base font-semibold text-foreground">No leads to show</p>
                  <p className="mt-2 text-sm text-muted-foreground">Import a CSV or add a single lead manually to start enriching this campaign.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                            onChange={selectAllVisible}
                          />
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Lead</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Company</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Stage</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Last Contacted</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`cursor-pointer border-t border-border transition hover:bg-muted/30 ${
                            selectedLead?.id === lead.id ? "bg-muted/40" : ""
                          }`}
                        >
                          <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.includes(lead.id)}
                              onChange={() => toggleSelectedLead(lead.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{lead.name}</div>
                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                          </td>
                          <td className="px-4 py-3 text-foreground">{lead.company || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs capitalize text-slate-300">
                              {lead.lifecycle_stage || "new"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleString() : "Not yet"}
                          </td>
                          <td className="px-4 py-3 text-foreground">{lead.lead_score || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4" />
                  Add Single Lead
                </CardTitle>
                <CardDescription>Manually add one lead without waiting for a CSV upload.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Full name" value={manualLead.name} onChange={(e) => setManualLead({ ...manualLead, name: e.target.value })} />
                <Input placeholder="Email" value={manualLead.email} onChange={(e) => setManualLead({ ...manualLead, email: e.target.value })} />
                <Input placeholder="Company" value={manualLead.company} onChange={(e) => setManualLead({ ...manualLead, company: e.target.value })} />
                <Input placeholder="Title" value={manualLead.title} onChange={(e) => setManualLead({ ...manualLead, title: e.target.value })} />
                <Textarea placeholder="Notes" value={manualLead.notes} onChange={(e) => setManualLead({ ...manualLead, notes: e.target.value })} />
                <Button onClick={handleManualAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">CSV Import With Mapping</CardTitle>
                <CardDescription>Upload a file, confirm column mapping, then import leads into the selected campaign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                <Button variant="outline" onClick={handleImportPreview} disabled={!importFile}>
                  Preview Mapping
                </Button>
                {importPreview && (
                  <div className="space-y-3 rounded-xl border border-border p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(mapping).map(([field, value]) => (
                        <div key={field} className="space-y-2">
                          <Label className="capitalize">{field.replaceAll("_", " ")}</Label>
                          <select
                            value={value || ""}
                            onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value || null }))}
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                          >
                            <option value="">Not mapped</option>
                            {(importPreview.headers || []).map((header: string) => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            {(importPreview.headers || []).map((header: string) => (
                              <th key={header} className="px-3 py-2 text-left text-muted-foreground">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(importPreview.sample_rows || []).map((row: Record<string, string>, index: number) => (
                            <tr key={index} className="border-t border-border">
                              {(importPreview.headers || []).map((header: string) => (
                                <td key={header} className="px-3 py-2 text-foreground">{row[header]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button onClick={handleMappedImport}>Import Leads</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">{selectedLead?.name || "Lead Details"}</CardTitle>
            <CardDescription>{selectedLead?.email || "Select a lead from the table"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {selectedLead ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="mt-1 text-foreground">{selectedLead.company || "N/A"}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="mt-1 text-foreground">{selectedLead.title || "N/A"}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Last Contacted</p>
                    <p className="mt-1 text-foreground">{selectedLead.last_contacted_at ? new Date(selectedLead.last_contacted_at).toLocaleString() : "Not contacted yet"}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Lead Score</p>
                    <p className="mt-1 text-foreground">{selectedLead.lead_score || 0}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Status Pipeline</p>
                  <div className="flex flex-wrap gap-2">
                    {pipelineStages.map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => handleStageChange(selectedLead.id, stage)}
                        className={`rounded-full px-3 py-2 text-xs capitalize transition ${
                          selectedLead.lifecycle_stage === stage
                            ? "bg-fuchsia-500/20 text-fuchsia-200"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="mt-1 text-foreground">{selectedLead.notes || "No notes on this lead."}</p>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Email Thread History</p>
                  <div className="space-y-2">
                    {(selectedLead.email_history || []).length === 0 ? (
                      <p className="text-muted-foreground">No email activity yet.</p>
                    ) : (
                      selectedLead.email_history.map((entry: any, index: number) => (
                        <div key={`${entry.timestamp}-${index}`} className="rounded-md bg-background/60 p-3">
                          <div className="font-medium text-foreground capitalize">{entry.status}</div>
                          <div className="text-xs text-muted-foreground">{entry.subject || "No subject"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "No timestamp"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                Pick a lead on the left to inspect company context, pipeline status, and recent thread history.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadIntelligence;
