import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useParams, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  Plus,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Globe,
  Shield,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function sanitizeDomain(raw) {
  return raw.trim().toLowerCase();
}

function validateDomain(value) {
  if (!value) return "Domain is required.";
  if (/^https?:\/\//i.test(value)) return "Remove the https:// prefix.";
  if (value.includes("/")) return "Domain must not contain a path.";
  if (/:\d+/.test(value)) return "Domain must not contain a port.";
  if (!/^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/.test(value))
    return "Invalid domain format.";
  return null;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handle}
      title={`Copy ${label}`}
      className="ml-1 p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

function SslBadge({ status }) {
  const map = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-slate-100 text-slate-600 border-slate-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
        map[status] ?? map.pending
      )}
    >
      {status ?? "pending"}
    </span>
  );
}

function OwnershipBadge({ verified, source }) {
  const isVerified = verified || source === "managed";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
        isVerified
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
      )}
    >
      {isVerified ? "Verified" : "Pending"}
    </span>
  );
}

// ─────────────────────────────────────────────
// DNS Instructions screen (shown after add-external or via "Show DNS records")
// ─────────────────────────────────────────────
function DnsInstructionsScreen({ domain, dnsRecords, note, onClose }) {
  const isApex = dnsRecords?.some((r) => r.type === "A");

  const buildCopyMessage = () => {
    const lines = dnsRecords
      .map((r, i) => `${i + 1}) Type: ${r.type} Name: ${r.name} Value: ${r.value}`)
      .join("\n");
    return (
      `To activate your domain ${domain} on Keeto, open the DNS settings at the company where you bought the domain and add these records:\n` +
      lines +
      `\nIt can take a few minutes up to a few hours to take effect. Message us once it is done.`
    );
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(buildCopyMessage()).then(() =>
      toast.success("Message copied to clipboard")
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Add these DNS records at your domain registrar to verify ownership of{" "}
        <span className="font-semibold text-slate-800">{domain}</span>.
      </p>

      {isApex && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            If the root domain currently hosts a website, it will be replaced by
            the restaurant page.
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Name</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Value</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(dnsRecords ?? []).map((r, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono font-bold text-blue-700">{r.type}</td>
                <td className="px-3 py-2 font-mono break-all">{r.name}</td>
                <td className="px-3 py-2 font-mono break-all">{r.value}</td>
                <td className="px-3 py-2">
                  <CopyButton text={r.value} label="value" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {note && (
        <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-3">
          {note}
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={copyMessage}
      >
        <Copy size={14} />
        Copy message for the restaurant
      </Button>

      <div className="flex justify-end pt-1">
        <Button onClick={onClose} size="sm">
          Done
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Add Domain dialog
// ─────────────────────────────────────────────
function AddDomainDialog({ restaurantId, open, onOpenChange, onDnsInstructions }) {
  const [domainInput, setDomainInput] = useState("");
  const [source, setSource] = useState("external");
  const [fieldError, setFieldError] = useState("");
  const [apiError, setApiError] = useState("");

  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `/api/superadmin/restaurants/${restaurantId}/domains`,
        payload
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-domains", restaurantId] });
      onOpenChange(false);
      resetForm();

      if (variables.source === "external") {
        const responseData = data?.data ?? data;
        onDnsInstructions({
          domain: variables.domain,
          dnsRecords: responseData?.dnsRecords ?? [],
          note: responseData?.note ?? null,
        });
      } else {
        toast.success("Managed domain added successfully.");
      }
    },
    onError: (error) => {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || "An error occurred.";
      if (status === 409) {
        setApiError("This domain is already in use.");
      } else if (status === 400) {
        setApiError(msg);
      } else {
        setApiError(msg);
      }
    },
  });

  const resetForm = () => {
    setDomainInput("");
    setSource("external");
    setFieldError("");
    setApiError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError("");
    const cleaned = sanitizeDomain(domainInput);
    const err = validateDomain(cleaned);
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError("");
    addMutation.mutate({ domain: cleaned, source });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Domain</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="domain-input">Domain</Label>
            <Input
              id="domain-input"
              placeholder="order.pizzaking.com"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value);
                setFieldError("");
                setApiError("");
              }}
              disabled={addMutation.isPending}
            />
            {fieldError && (
              <p className="text-xs text-red-600">{fieldError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Source</Label>
            <div className="flex gap-3">
              {["external", "managed"].map((s) => (
                <label
                  key={s}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors",
                    source === s
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="source"
                    value={s}
                    checked={source === s}
                    onChange={() => setSource(s)}
                    disabled={addMutation.isPending}
                  />
                  {s === "external" ? "External" : "Managed"}
                </label>
              ))}
            </div>
            {source === "managed" && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                The domain's nameservers must already point to our server.
              </p>
            )}
          </div>

          {apiError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {apiError}
            </p>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending && (
                <Loader2 size={14} className="animate-spin mr-1" />
              )}
              Add Domain
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Row action buttons
// ─────────────────────────────────────────────
function DomainRowActions({
  row,
  restaurantId,
  onShowDns,
  onRowRefresh,
}) {
  const queryClient = useQueryClient();
  const [loadingAction, setLoadingAction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmOrderLink, setConfirmOrderLink] = useState(false);
  const [rowMessage, setRowMessage] = useState(null);

  const { verified, ssl_status, source, id: domainId } = row;
  const isExternal = source === "external";
  const isVerified = verified || source === "managed";
  const sslActive = ssl_status === "active";

  const runAction = useCallback(
    async (actionKey, fn) => {
      setLoadingAction(actionKey);
      setRowMessage(null);
      try {
        const result = await fn();
        return result;
      } finally {
        setLoadingAction(null);
      }
    },
    []
  );

  const handleVerify = async () => {
    await runAction("verify", async () => {
      try {
        const { data } = await api.post(`/api/superadmin/domains/${domainId}/verify`);
        const payload = data?.data ?? data;
        if (payload?.verified) {
          toast.success("Domain verified successfully!");
          onRowRefresh();
        } else {
          setRowMessage({
            type: "info",
            text: "DNS has not updated yet, try again in a few minutes.",
          });
        }
        if (payload?.pointsToServer === false) {
          setRowMessage({
            type: "warning",
            text: "Ownership verified, but the domain does not point to our server yet. Check the CNAME or A record.",
          });
        }
      } catch (err) {
        const resData = err?.response?.data;
        if (err?.response?.status === 400 && resData?.verified === false) {
          setRowMessage({
            type: "info",
            text: "DNS has not updated yet, try again in a few minutes.",
          });
        } else {
          const msg = resData?.message || "Verification failed.";
          setRowMessage({ type: "error", text: msg });
          toast.error(msg);
        }
      }
    });
  };

  const handleProvision = async () => {
    await runAction("provision", async () => {
      try {
        const { data } = await api.post(`/api/superadmin/domains/${domainId}/provision`);
        toast.success(data?.message || "Provisioning started successfully!");
        onRowRefresh();
        // Check after refresh if ssl failed
        setTimeout(() => {
          if (row.ssl_status === "failed" && row.last_error) {
            setRowMessage({ type: "error", text: row.last_error });
          }
        }, 500);
      } catch (e) {
        const msg = e?.response?.data?.message || "Provisioning failed.";
        setRowMessage({ type: "error", text: msg });
        toast.error(msg);
      }
    });
  };

  const handleSetOrderLink = async () => {
    setConfirmOrderLink(false);
    await runAction("order-link", async () => {
      try {
        await api.post(`/api/superadmin/domains/${domainId}/set-order-link`);
        toast.success("Order link updated.");
        onRowRefresh();
      } catch (e) {
        const msg = e?.response?.data?.message || "Failed to set order link.";
        toast.error(msg);
      }
    });
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await runAction("delete", async () => {
      try {
        await api.delete(`/api/superadmin/domains/${domainId}`);
        toast.success("Domain deleted.");
        queryClient.invalidateQueries({ queryKey: ["restaurant-domains", restaurantId] });
      } catch (e) {
        const msg = e?.response?.data?.message || "Delete failed.";
        toast.error(msg);
      }
    });
  };

  const busy = loadingAction !== null;

  // Determine which actions to show based on row state
  const showShowDns = isExternal && !isVerified;
  const showVerify = isExternal && !isVerified;
  // Provision button: available when verified, or whenever SSL needs provisioning / retry
  const showProvision = isVerified && (ssl_status === "pending" || ssl_status === "failed" || !ssl_status);
  const showSetOrderLink = isVerified && sslActive;
  const showDelete = true;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1.5 items-center">
        {showShowDns && (
          <button
            onClick={() => onShowDns(row)}
            disabled={busy}
            className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 transition-colors"
          >
            Show DNS records
          </button>
        )}

        {showVerify && (
          <button
            onClick={handleVerify}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-50 transition-colors"
          >
            {loadingAction === "verify" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Shield size={12} />
            )}
            Verify
          </button>
        )}

        {showProvision && (
          <button
            onClick={handleProvision}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 disabled:opacity-50 transition-colors"
          >
            {loadingAction === "provision" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Provision
          </button>
        )}

        {showSetOrderLink && (
          <>
            <button
              onClick={() => setConfirmOrderLink(true)}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "order-link" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Globe size={12} />
              )}
              Set as order link
            </button>
            {confirmOrderLink && (
              <div className="mt-1 text-xs bg-amber-50 border border-amber-200 rounded-md px-3 py-2 space-y-1.5">
                <p className="text-amber-800 font-medium">
                  This will change the restaurant's public link. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSetOrderLink}
                    className="px-2.5 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 text-xs"
                  >
                    Yes, set it
                  </button>
                  <button
                    onClick={() => setConfirmOrderLink(false)}
                    className="px-2.5 py-1 rounded bg-white border text-slate-600 hover:bg-slate-50 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {showDelete && (
          <>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "delete" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              Delete
            </button>
            {confirmDelete && (
              <div className="mt-1 text-xs bg-red-50 border border-red-200 rounded-md px-3 py-2 space-y-1.5">
                <p className="text-red-800 font-medium">
                  The domain will stop working. Delete?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="px-2.5 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 rounded bg-white border text-slate-600 hover:bg-slate-50 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {rowMessage && (
        <div
          className={cn(
            "mt-1 flex items-start gap-1.5 text-xs rounded px-2 py-1.5",
            rowMessage.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : rowMessage.type === "warning"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          )}
        >
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          {rowMessage.text}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main RestaurantDomains component
// ─────────────────────────────────────────────
export default function RestaurantDomains({ restaurantId: propRestaurantId }) {
  const { id: paramRestaurantId } = useParams();
  const navigate = useNavigate();
  const restaurantId = propRestaurantId || paramRestaurantId;
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  // DNS instructions overlay state
  const [dnsOverlay, setDnsOverlay] = useState(null); // { domain, dnsRecords, note }
  const [dnsDialogOpen, setDnsDialogOpen] = useState(false);

  const {
    data: domains = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["restaurant-domains", restaurantId],
    queryFn: async () => {
      const res = await api.get(
        `/api/superadmin/restaurants/${restaurantId}/domains`
      );
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!restaurantId,
  });

  // ── Polling while any row has ssl_status = "pending" ──────────────────────
  const pollingRef = useRef(null);
  const pollingStartRef = useRef(null);
  const MAX_POLL_MS = 60_000;
  const POLL_INTERVAL = 5_000;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // already running
    pollingStartRef.current = Date.now();
    pollingRef.current = setInterval(() => {
      if (Date.now() - pollingStartRef.current >= MAX_POLL_MS) {
        stopPolling();
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["restaurant-domains", restaurantId] });
    }, POLL_INTERVAL);
  }, [queryClient, restaurantId, stopPolling]);

  useEffect(() => {
    const hasPending = domains.some((d) => d.ssl_status === "pending");
    if (hasPending) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [domains, startPolling, stopPolling]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDnsInstructions = (info) => {
    setDnsOverlay(info);
    setDnsDialogOpen(true);
  };

  const handleShowDnsFromRow = (row) => {
    // Re-fetch to get dnsRecords stored on the server — if the row
    // already has them, use them; otherwise show what we have.
    setDnsOverlay({
      domain: row.domain,
      dnsRecords: row.dnsRecords ?? [],
      note: row.note ?? null,
    });
    setDnsDialogOpen(true);
  };

  const handleRowRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant-domains", restaurantId] });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50/60">
          <div className="flex items-center gap-3">
            {paramRestaurantId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/restaurants")}
                className="gap-1.5"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Globe size={18} className="text-slate-500" />
                Domains
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Custom domains pointing to this restaurant
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={15} />
            Add Domain
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" />
            Loading domains…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
            <AlertTriangle size={28} className="text-red-400" />
            <p className="text-sm">Failed to load domains.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw size={14} className="mr-1" /> Retry
            </Button>
          </div>
        ) : domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
            <Globe size={32} className="opacity-30" />
            <p className="text-sm">No custom domains yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Domain</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Ownership</th>
                  <th className="px-4 py-3 text-left">SSL</th>
                  <th className="px-4 py-3 text-left">Last Error</th>
                  <th className="px-4 py-3 text-left">Added</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-slate-50/50 transition-colors align-top"
                  >
                    {/* Domain */}
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        {row.last_error && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle
                                size={14}
                                className="text-amber-500 shrink-0"
                              />
                            </TooltipTrigger>
                            <TooltipContent>{row.last_error}</TooltipContent>
                          </Tooltip>
                        )}
                        <a
                          href={`https://${row.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {row.domain}
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                          row.is_apex
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        )}
                      >
                        {row.is_apex ? "Root domain" : "Subdomain"}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                          row.source === "managed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {row.source === "managed" ? "Managed" : "External"}
                      </span>
                    </td>

                    {/* Ownership */}
                    <td className="px-4 py-3">
                      <OwnershipBadge verified={row.verified} source={row.source} />
                    </td>

                    {/* SSL */}
                    <td className="px-4 py-3">
                      <SslBadge status={row.ssl_status} />
                    </td>

                    {/* Last Error */}
                    <td className="px-4 py-3 max-w-[160px]">
                      {row.last_error ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-red-600 truncate block cursor-default max-w-full">
                              {row.last_error}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {row.last_error}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Added */}
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <DomainRowActions
                        row={row}
                        restaurantId={restaurantId}
                        onShowDns={handleShowDnsFromRow}
                        onRowRefresh={handleRowRefresh}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Domain Dialog */}
      <AddDomainDialog
        restaurantId={restaurantId}
        open={addOpen}
        onOpenChange={setAddOpen}
        onDnsInstructions={handleDnsInstructions}
      />

      {/* DNS Instructions Dialog */}
      <Dialog open={dnsDialogOpen} onOpenChange={setDnsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>DNS Records</DialogTitle>
          </DialogHeader>
          {dnsOverlay && (
            <DnsInstructionsScreen
              domain={dnsOverlay.domain}
              dnsRecords={dnsOverlay.dnsRecords}
              note={dnsOverlay.note}
              onClose={() => setDnsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}

