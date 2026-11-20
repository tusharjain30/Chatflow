import {
  BarChart3,
  Calendar,
  Eye,
  FilePenLine,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import CreateCampaignModal from "@/components/campaign/CreateCampaignModal";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAuthToken } from "@/utils/authStorage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FiMoreVertical } from "react-icons/fi";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { FiPlus } from "react-icons/fi";
import { FiMinus } from "react-icons/fi";
import { FiPlay } from "react-icons/fi";
import { FiPause } from "react-icons/fi";
import { FiRotateCcw } from "react-icons/fi";
import { FiXCircle } from "react-icons/fi";
import { TbTemplate } from "react-icons/tb";
import { FiTrash2 } from "react-icons/fi";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const PAGE_TABS = ["all", "active", "scheduled", "completed", "draft"] as const;
const DETAIL_TABS = ["overview", "audience", "logs", "jobs"] as const;

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-primary/10", text: "text-primary" },
  scheduled: { bg: "bg-info/10", text: "text-info" },
  completed: { bg: "bg-success/10", text: "text-success" },
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
  paused: { bg: "bg-warning/10", text: "text-warning" },
  failed: { bg: "bg-destructive/10", text: "text-destructive" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground" },
};

const defaultPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };
const defaultJobStats = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  progress: 0,
};
const defaultEditForm = {
  name: "",
  description: "",
  isScheduled: false,
  scheduledAt: "",
  batchSize: "50",
  delayInSeconds: "2",
};

function authHeaders() {
  return { Authorization: `Bearer ${getAuthToken()}` };
}

function normalizeStatus(status: string) {
  const map: Record<string, string> = {
    RUNNING: "active",
    SCHEDULED: "scheduled",
    COMPLETED: "completed",
    DRAFT: "draft",
    PAUSED: "paused",
    FAILED: "failed",
    CANCELLED: "cancelled",
  };

  return map[status] || status.toLowerCase();
}

function fmt(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function inputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function campaignDateMeta(campaign: any) {
  const status = normalizeStatus(campaign.status);
  if (status === "scheduled" && campaign.scheduledAt)
    return { label: "Scheduled", value: campaign.scheduledAt };
  if (status === "completed" && campaign.completedAt)
    return { label: "Completed", value: campaign.completedAt };
  if ((status === "active" || status === "paused") && campaign.startedAt)
    return { label: "Started", value: campaign.startedAt };
  return { label: "Created", value: campaign.createdAt };
}

const statusBadgeStyles: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  active: {
    bg: "from-green-100 to-emerald-200",
    text: "text-green-800",
    border: "border-green-200",
  },
  scheduled: {
    bg: "from-blue-100 to-blue-200",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  completed: {
    bg: "from-purple-100 to-purple-200",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  draft: {
    bg: "from-gray-100 to-gray-200",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  paused: {
    bg: "from-yellow-100 to-yellow-200",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  failed: {
    bg: "from-red-100 to-red-200",
    text: "text-red-800",
    border: "border-red-200",
  },
  cancelled: {
    bg: "from-gray-200 to-gray-300",
    text: "text-gray-700",
    border: "border-gray-300",
  },
};

export default function Broadcasts() {
  const { toast } = useToast();

  const [openCreate, setOpenCreate] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pagination, setPagination] = useState(defaultPagination);
  const [campaignPage, setCampaignPage] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof PAGE_TABS)[number]>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [detailTab, setDetailTab] =
    useState<(typeof DETAIL_TABS)[number]>("overview");
  const [campaignDetail, setCampaignDetail] = useState<any>(null);
  const [detailAudience, setDetailAudience] = useState<any[]>([]);
  const [detailAudiencePagination, setDetailAudiencePagination] =
    useState(defaultPagination);
  const [detailAudiencePage, setDetailAudiencePage] = useState(1);
  const [detailLogs, setDetailLogs] = useState<any[]>([]);
  const [detailLogsPagination, setDetailLogsPagination] =
    useState(defaultPagination);
  const [detailLogsPage, setDetailLogsPage] = useState(1);
  const [detailJobs, setDetailJobs] = useState<any[]>([]);
  const [detailJobsPagination, setDetailJobsPagination] =
    useState(defaultPagination);
  const [detailJobsPage, setDetailJobsPage] = useState(1);
  const [jobStats, setJobStats] = useState(defaultJobStats);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const [audienceModalOpen, setAudienceModalOpen] = useState(false);
  const [audienceMode, setAudienceMode] = useState<"add" | "remove">("add");
  const [audienceCampaign, setAudienceCampaign] = useState<any>(null);
  const [audienceSearch, setAudienceSearch] = useState("");
  const [debouncedAudienceSearch, setDebouncedAudienceSearch] = useState("");
  const [contactOptions, setContactOptions] = useState<any[]>([]);
  const [contactPagination, setContactPagination] = useState(defaultPagination);
  const [contactPage, setContactPage] = useState(1);
  const [groupOptions, setGroupOptions] = useState<any[]>([]);
  const [groupPagination, setGroupPagination] = useState(defaultPagination);
  const [groupPage, setGroupPage] = useState(1);
  const [removableAudience, setRemovableAudience] = useState<any[]>([]);
  const [removableAudiencePagination, setRemovableAudiencePagination] =
    useState(defaultPagination);
  const [removableAudiencePage, setRemovableAudiencePage] = useState(1);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loadingAudienceOptions, setLoadingAudienceOptions] = useState(false);
  const [submittingAudience, setSubmittingAudience] = useState(false);

  const isAllSelected =
    campaigns.length > 0 &&
    campaigns.every((c) => selectedCampaignIds.includes(c.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCampaignIds([]);
    } else {
      setSelectedCampaignIds(campaigns.map((c) => c.id));
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get(`${API_BASE}/user/campaign/stats`, {
        headers: authHeaders(),
      });
      if (res.data?.status === 1) setStats(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCampaigns = async (
    tab: (typeof PAGE_TABS)[number],
    searchValue: string,
    page = 1,
  ) => {
    try {
      setLoadingCampaigns(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        tab,
      });
      if (searchValue.trim()) params.append("search", searchValue.trim());
      const res = await axios.get(
        `${API_BASE}/user/campaign/list?${params.toString()}`,
        { headers: authHeaders() },
      );
      if (res.data?.status === 1) {
        const next = res.data.data.campaigns || [];
        setCampaigns(next);
        setPagination(res.data.data.pagination || defaultPagination);
        setSelectedCampaignIds((current) =>
          current.filter((id) => next.some((item: any) => item.id === id)),
        );
      }
    } catch (error) {
      console.error(error);
      setCampaigns([]);
      setPagination(defaultPagination);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchCampaignDetail = async (campaignId: string) => {
    try {
      setLoadingDetail(true);
      const res = await axios.get(
        `${API_BASE}/user/campaign/detail/${campaignId}`,
        { headers: authHeaders() },
      );
      if (res.data?.status === 1) setCampaignDetail(res.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchCampaignAudience = async (
    campaignId: string,
    searchValue = "",
    page = 1,
  ) => {
    try {
      setLoadingAudience(true);
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (searchValue.trim()) params.append("search", searchValue.trim());
      const res = await axios.get(
        `${API_BASE}/user/campaign/${campaignId}/audience?${params.toString()}`,
        { headers: authHeaders() },
      );
      if (res.data?.status === 1) {
        setDetailAudience(res.data.data.audience || []);
        setDetailAudiencePagination(
          res.data.data.pagination || defaultPagination,
        );
      }
    } catch (error) {
      setDetailAudience([]);
      setDetailAudiencePagination(defaultPagination);
      toast({
        title: "Error",
        description: "Failed to load campaign audience",
        variant: "destructive",
      });
    } finally {
      setLoadingAudience(false);
    }
  };

  const fetchCampaignLogs = async (campaignId: string, page = 1) => {
    try {
      setLoadingLogs(true);
      const res = await axios.get(
        `${API_BASE}/user/campaign/${campaignId}/logs?page=${page}&limit=10`,
        { headers: authHeaders() },
      );
      if (res.data?.status === 1) {
        setDetailLogs(res.data.data.logs || []);
        setDetailLogsPagination(res.data.data.pagination || defaultPagination);
      }
    } catch (error) {
      setDetailLogs([]);
      setDetailLogsPagination(defaultPagination);
      toast({
        title: "Error",
        description: "Failed to load campaign logs",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchCampaignJobs = async (campaignId: string, page = 1) => {
    try {
      setLoadingJobs(true);
      const res = await axios.get(
        `${API_BASE}/user/campaign/${campaignId}/jobs?page=${page}&limit=10`,
        { headers: authHeaders() },
      );
      if (res.data?.status === 1) {
        setDetailJobs(res.data.data.jobs || []);
        setJobStats(res.data.data.stats || defaultJobStats);
        setDetailJobsPagination(res.data.data.pagination || defaultPagination);
      }
    } catch (error) {
      setDetailJobs([]);
      setJobStats(defaultJobStats);
      setDetailJobsPagination(defaultPagination);
      toast({
        title: "Error",
        description: "Failed to load campaign jobs",
        variant: "destructive",
      });
    } finally {
      setLoadingJobs(false);
    }
  };
  const fetchAudienceOptions = async (
    searchValue = "",
    contactsPage = 1,
    groupsPage = 1,
  ) => {
    try {
      setLoadingAudienceOptions(true);
      const contactParams = new URLSearchParams({
        page: String(contactsPage),
        limit: "10",
      });
      const groupParams = new URLSearchParams({
        page: String(groupsPage),
        limit: "10",
      });
      if (searchValue.trim()) {
        contactParams.append("search", searchValue.trim());
        groupParams.append("search", searchValue.trim());
      }
      const [contactsRes, groupsRes] = await Promise.all([
        axios.get(
          `${API_BASE}/user/contacts/contact/read?${contactParams.toString()}`,
          { headers: authHeaders() },
        ),
        axios.get(
          `${API_BASE}/user/contacts/groups/read?${groupParams.toString()}`,
          { headers: authHeaders() },
        ),
      ]);
      if (contactsRes.data?.status === 1) {
        setContactOptions(contactsRes.data.data.contacts || []);
        setContactPagination(contactsRes.data.data.meta || defaultPagination);
      }
      if (groupsRes.data?.status === 1) {
        setGroupOptions(groupsRes.data.data.items || []);
        setGroupPagination(groupsRes.data.data.pagination || defaultPagination);
      }
    } catch (error) {
      setContactOptions([]);
      setGroupOptions([]);
      setContactPagination(defaultPagination);
      setGroupPagination(defaultPagination);
      toast({
        title: "Error",
        description: "Failed to load contacts and groups",
        variant: "destructive",
      });
    } finally {
      setLoadingAudienceOptions(false);
    }
  };

  const fetchRemovableAudience = async (
    campaignId: string,
    searchValue = "",
    page = 1,
  ) => {
    try {
      setLoadingAudienceOptions(true);
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (searchValue.trim()) params.append("search", searchValue.trim());
      const res = await axios.get(
        `${API_BASE}/user/campaign/${campaignId}/audience?${params.toString()}`,
        { headers: authHeaders() },
      );
      if (res.data?.status === 1) {
        setRemovableAudience(res.data.data.audience || []);
        setRemovableAudiencePagination(
          res.data.data.pagination || defaultPagination,
        );
      }
    } catch (error) {
      setRemovableAudience([]);
      setRemovableAudiencePagination(defaultPagination);
      toast({
        title: "Error",
        description: "Failed to load campaign audience",
        variant: "destructive",
      });
    } finally {
      setLoadingAudienceOptions(false);
    }
  };

  const refreshView = async (campaignId?: string | null) => {
    await Promise.all([
      fetchStats(),
      fetchCampaigns(activeTab, debouncedSearch, campaignPage),
    ]);
    if (campaignId) {
      await fetchCampaignDetail(campaignId);
      if (detailTab === "audience")
        await fetchCampaignAudience(campaignId, "", detailAudiencePage);
      if (detailTab === "logs")
        await fetchCampaignLogs(campaignId, detailLogsPage);
      if (detailTab === "jobs")
        await fetchCampaignJobs(campaignId, detailJobsPage);
    }
  };

  const toggleSelected = (campaignId: string, checked: boolean) => {
    setSelectedCampaignIds((current) =>
      checked
        ? [...new Set([...current, campaignId])]
        : current.filter((id) => id !== campaignId),
    );
  };

  const openDetails = async (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setDetailTab("overview");
    setDetailOpen(true);
    await fetchCampaignDetail(campaignId);
  };

  const openEditModal = async (campaign: any) => {
    if (campaign.status !== "DRAFT") return;

    try {
      const res = await axios.get(
        `${API_BASE}/user/campaign/detail/${campaign.id}`,
        { headers: authHeaders() },
      );
      const detail = res.data?.status === 1 ? res.data.data : campaign;

      setEditCampaignId(campaign.id);
      setEditForm({
        name: detail.name || "",
        description: detail.description || "",
        isScheduled: Boolean(detail.isScheduled),
        scheduledAt: inputDate(detail.scheduledAt),
        batchSize: String(detail.batchSize || 50),
        delayInSeconds: String(detail.delayInSeconds || 2),
      });
      setEditOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load draft campaign",
        variant: "destructive",
      });
    }
  };

  const saveEdit = async () => {
    if (!editCampaignId || !editForm.name.trim()) return;
    if (editForm.isScheduled && !editForm.scheduledAt) {
      toast({
        title: "Validation Error",
        description: "Scheduled time is required",
        variant: "destructive",
      });
      return;
    }
    try {
      setSavingEdit(true);
      await axios.put(
        `${API_BASE}/user/campaign/${editCampaignId}/update`,
        {
          name: editForm.name.trim(),
          description: editForm.description,
          isScheduled: editForm.isScheduled,
          scheduledAt: editForm.isScheduled
            ? new Date(editForm.scheduledAt).toISOString()
            : undefined,
          batchSize: Number(editForm.batchSize),
          delayInSeconds: Number(editForm.delayInSeconds),
        },
        { headers: authHeaders() },
      );
      toast({
        title: "Campaign updated",
        description: "Draft campaign updated successfully",
      });
      setEditOpen(false);
      await refreshView(editCampaignId);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to update campaign",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const openAudienceManager = async (campaign: any, mode: "add" | "remove") => {
    if (campaign.status !== "DRAFT") return;
    setAudienceCampaign(campaign);
    setAudienceMode(mode);
    setAudienceSearch("");
    setDebouncedAudienceSearch("");
    setSelectedContactIds([]);
    setSelectedGroupIds([]);
    setAudienceModalOpen(true);
    if (mode === "add") await fetchAudienceOptions();
    if (mode === "remove") await fetchRemovableAudience(campaign.id);
  };

  const submitAudience = async () => {
    if (
      !audienceCampaign ||
      (!selectedContactIds.length && !selectedGroupIds.length)
    ) {
      toast({
        title: "Validation Error",
        description: "Select at least one contact or group",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmittingAudience(true);
      const url =
        audienceMode === "add"
          ? `${API_BASE}/user/campaign/audience/bulk`
          : `${API_BASE}/user/campaign/audience/bulk-remove`;
      await axios.post(
        url,
        {
          campaignId: audienceCampaign.id,
          contactIds: selectedContactIds,
          groupIds: selectedGroupIds,
        },
        { headers: authHeaders() },
      );
      toast({
        title: audienceMode === "add" ? "Audience added" : "Audience removed",
      });
      setAudienceModalOpen(false);
      await refreshView(audienceCampaign.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to update audience",
        variant: "destructive",
      });
    } finally {
      setSubmittingAudience(false);
    }
  };

  const runAction = async (campaign: any, action: string) => {
    const confirmText: Record<string, string> = {
      start: `Start ${campaign.name}?`,
      pause: `Pause ${campaign.name}?`,
      resume: `Resume ${campaign.name}?`,
      cancel: `Cancel ${campaign.name}?`,
      retry: `Retry failed records for ${campaign.name}?`,
      delete: `Delete ${campaign.name}?`,
    };

    // SweetAlert Confirm
    if (confirmText[action]) {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: confirmText[action],
        icon: action === "delete" ? "warning" : "question",
        showCancelButton: true,
        confirmButtonColor: action === "delete" ? "#ef4444" : "#22c55e",
        cancelButtonColor: "#6b7280",
        confirmButtonText:
          action === "delete" ? "Yes, delete" : "Yes, continue",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        customClass: {
          popup: "rounded-2xl p-6",
          confirmButton: "rounded-lg px-4 py-2",
          cancelButton: "rounded-lg px-4 py-2",
        },
      });

      if (!result.isConfirmed) return;
    }

    try {
      setActionLoadingKey(`${campaign.id}:${action}`);

      // Loading Modal
      Swal.fire({
        title: `${action} in progress...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        customClass: {
          popup: "rounded-2xl",
        },
      });

      // 🔧 API Calls
      if (action === "start")
        await axios.post(
          `${API_BASE}/user/campaign/start`,
          { campaignId: campaign.id },
          { headers: authHeaders() },
        );

      if (action === "pause")
        await axios.post(
          `${API_BASE}/user/campaign/pause`,
          { campaignId: campaign.id },
          { headers: authHeaders() },
        );

      if (action === "resume")
        await axios.post(
          `${API_BASE}/user/campaign/resume`,
          { campaignId: campaign.id },
          { headers: authHeaders() },
        );

      if (action === "cancel")
        await axios.post(
          `${API_BASE}/user/campaign/cancel`,
          { campaignId: campaign.id },
          { headers: authHeaders() },
        );

      if (action === "retry")
        await axios.post(
          `${API_BASE}/user/campaign/retry`,
          { campaignId: campaign.id },
          { headers: authHeaders() },
        );

      if (action === "delete")
        await axios.delete(`${API_BASE}/user/campaign/${campaign.id}/delete`, {
          headers: authHeaders(),
        });

      Swal.close(); // close loading modal

      // SUCCESS TOAST (shadcn)
      toast({
        title: "Success",
        description: `${action.toUpperCase()} completed successfully`,
      });

      // cleanup
      if (action === "delete" && selectedCampaignId === campaign.id) {
        setDetailOpen(false);
        setSelectedCampaignId(null);
        setCampaignDetail(null);
      }

      await refreshView(
        selectedCampaignId === campaign.id ? campaign.id : null,
      );
    } catch (error: any) {
      Swal.close();

      // ERROR TOAST
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || `Failed to ${action} campaign`,
        variant: "destructive",
      });
    } finally {
      setActionLoadingKey("");
    }
  };

  const bulkDelete = async () => {
    if (!selectedCampaignIds.length) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete ${selectedCampaignIds.length} selected campaigns?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: "#fff",
    });

    if (!result.isConfirmed) return;

    try {
      setBulkDeleting(true);

      // Loading state inside alert
      Swal.fire({
        title: "Deleting...",
        text: "Please wait while we delete campaigns",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${API_BASE}/user/campaign/bulk-delete`,
        { campaignIds: selectedCampaignIds },
        { headers: authHeaders() },
      );

      const skipped = res.data?.data?.skipped || [];

      // Success Alert
      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: skipped.length
          ? `${res.data.data.deleted} deleted, ${skipped.length} skipped`
          : "Selected campaigns deleted successfully",
        confirmButtonColor: "#22c55e",
      });

      setSelectedCampaignIds([]);
      await refreshView(selectedCampaignId);
    } catch (error: any) {
      // Error Alert
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to delete campaigns",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      400,
    );
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedAudienceSearch(audienceSearch.trim()),
      400,
    );
    return () => window.clearTimeout(id);
  }, [audienceSearch]);

  useEffect(() => {
    setCampaignPage(1);
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    fetchCampaigns(activeTab, debouncedSearch, campaignPage);
  }, [activeTab, debouncedSearch, campaignPage]);

  useEffect(() => {
    setDetailAudiencePage(1);
    setDetailLogsPage(1);
    setDetailJobsPage(1);
  }, [detailTab, selectedCampaignId]);

  useEffect(() => {
    if (!detailOpen || !selectedCampaignId) return;
    if (detailTab === "audience")
      fetchCampaignAudience(selectedCampaignId, "", detailAudiencePage);
    if (detailTab === "logs")
      fetchCampaignLogs(selectedCampaignId, detailLogsPage);
    if (detailTab === "jobs")
      fetchCampaignJobs(selectedCampaignId, detailJobsPage);
  }, [
    detailOpen,
    detailTab,
    selectedCampaignId,
    detailAudiencePage,
    detailLogsPage,
    detailJobsPage,
  ]);

  useEffect(() => {
    setContactPage(1);
    setGroupPage(1);
    setRemovableAudiencePage(1);
  }, [debouncedAudienceSearch, audienceMode, audienceCampaign?.id]);

  useEffect(() => {
    if (!audienceModalOpen || !audienceCampaign) return;
    if (audienceMode === "add")
      fetchAudienceOptions(debouncedAudienceSearch, contactPage, groupPage);
    if (audienceMode === "remove")
      fetchRemovableAudience(
        audienceCampaign.id,
        debouncedAudienceSearch,
        removableAudiencePage,
      );
  }, [
    audienceModalOpen,
    audienceCampaign,
    audienceMode,
    debouncedAudienceSearch,
    contactPage,
    groupPage,
    removableAudiencePage,
  ]);
  const actionButton = (
    campaign: any,
    action: string,
    label: string,
    icon: React.ReactNode,
    variant: any = "outline",
  ) => {
    const loading = actionLoadingKey === `${campaign.id}:${action}`;
    return (
      <Button
        size="sm"
        variant={variant}
        disabled={loading}
        onClick={() => runAction(campaign, action)}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
        <span className="ml-1.5">{label}</span>
      </Button>
    );
  };

  const renderPaginationControls = (
    pager: typeof defaultPagination,
    currentPage: number,
    onPageChange: (page: number) => void,
    loading = false,
  ) => {
    if (!pager.totalPages || pager.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
        <span>
          Page {currentPage} of {pager.totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || currentPage >= pager.totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const renderCampaigns = () => {
    if (loadingCampaigns) {
      return (
        <div className="border rounded-2xl p-6 bg-white text-sm text-muted-foreground">
          Loading campaigns...
        </div>
      );
    }

    if (!campaigns.length) {
      return (
        <div className="border rounded-2xl p-6 bg-white text-sm text-muted-foreground">
          {debouncedSearch
            ? "No campaigns matched your search in this tab."
            : "No campaigns available in this tab yet."}
        </div>
      );
    }

    const statColors = [
      "from-blue-50 to-blue-100",
      "from-green-50 to-green-100",
      "from-purple-50 to-purple-100",
      "from-pink-50 to-pink-100",
    ];

    return campaigns.map((campaign) => {
      const status = normalizeStatus(campaign.status);
      const dateMeta = campaignDateMeta(campaign);
      const selected = selectedCampaignIds.includes(campaign.id);

      return (
        <div
          key={campaign.id}
          className={cn(
            "group relative rounded-xl p-3 space-y-2",
            "bg-gradient-to-br from-white via-green-50/40 to-emerald-100/30",
            "border-2 border-green-100/50",
            "transition-all duration-300",
            "hover:shadow-sm hover:-translate-y-1",
            "group-hover:ring-2 group-hover:ring-green-200/50",
            selected && "ring-2 ring-green-400/40",
          )}
        >
          {/* HEADER */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) =>
                  toggleSelected(campaign.id, checked === true)
                }
                className="mt-1"
              />

              {/* ICON */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-100 to-green-200 shadow-sm transition group-hover:scale-105">
                <Send className="h-4 w-4 text-green-700" />
              </div>

              {/* TITLE */}
              <div className="min-w-0 space-y-1">
                {/* Campaign Name */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {campaign.name}
                  </p>
                </div>

                {/* Template */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <span className="opacity-70">
                    <TbTemplate size={14} />
                  </span>
                  <span className="truncate">
                    {campaign.template?.name || "No template attached"}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="opacity-70">🕒</span>
                  <span className="font-medium text-foreground/80">
                    {dateMeta.label}:
                  </span>
                  <span>{fmt(dateMeta.value)}</span>
                </div>
              </div>
            </div>

            {/* STATUS BADGE */}
            <Badge
              className={cn(
                "text-[10px] px-3 py-1 rounded-full font-medium shadow-sm border capitalize",
                "bg-gradient-to-r",
                statusBadgeStyles[status]?.bg,
                statusBadgeStyles[status]?.text,
                statusBadgeStyles[status]?.border,
              )}
            >
              {status}
            </Badge>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Contacts", value: campaign.totalContacts },
              { label: "Sent", value: campaign.sentCount },
              { label: "Delivered", value: campaign.deliveredCount },
              { label: "Read", value: campaign.readCount },
            ].map((item, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl p-3 text-center transition",
                  "bg-gradient-to-br",
                  statColors[i],
                  "border border-white/60 hover:shadow-md hover:scale-[1.02]",
                )}
              >
                <p className="text-[11px] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* PROGRESS */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">
                {campaign.sentCount}/{campaign.totalContacts}
              </span>
            </div>

            <div className="relative">
              <Progress
                value={campaign.progress || 0}
                className="h-2 bg-gray-200"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/40 via-blue-400/30 to-purple-400/30 pointer-events-none" />
            </div>
          </div>

          {/* ACTION MENU */}
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-green-100/70 transition-all duration-200 hover:scale-105"
                >
                  <FiMoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl p-2 shadow-2xl border border-green-100 bg-white/95 backdrop-blur-xl animate-in fade-in zoom-in-95"
              >
                {/* VIEW */}
                <DropdownMenuItem
                  onClick={() => openDetails(campaign.id)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-green-50 transition"
                >
                  <span className="p-1.5 rounded-lg bg-green-100 text-green-700">
                    <FiEye className="h-4 w-4" />
                  </span>
                  <span>View Details</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                {/* DRAFT ACTIONS */}
                {campaign.status === "DRAFT" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => openEditModal(campaign)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-blue-50 transition"
                    >
                      <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                        <FiEdit className="h-4 w-4" />
                      </span>
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => openAudienceManager(campaign, "add")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-purple-50 transition"
                    >
                      <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                        <FiPlus className="h-4 w-4" />
                      </span>
                      Add Audience
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => openAudienceManager(campaign, "remove")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-pink-50 transition"
                    >
                      <span className="p-1.5 rounded-lg bg-pink-100 text-pink-700">
                        <FiMinus className="h-4 w-4" />
                      </span>
                      Remove Audience
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-2" />
                  </>
                )}

                {/* START */}
                {["DRAFT", "SCHEDULED"].includes(campaign.status) && (
                  <DropdownMenuItem
                    onClick={() => runAction(campaign, "start")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-green-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-green-100 text-green-700">
                      <FiPlay className="h-4 w-4" />
                    </span>
                    Start Campaign
                  </DropdownMenuItem>
                )}

                {/* PAUSE */}
                {!["DRAFT", "COMPLETED", "PAUSED", "CANCELLED"].includes(
                  campaign.status,
                ) && (
                  <DropdownMenuItem
                    onClick={() => runAction(campaign, "pause")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-yellow-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-yellow-100 text-yellow-700">
                      <FiPause className="h-4 w-4" />
                    </span>
                    Pause Campaign
                  </DropdownMenuItem>
                )}

                {/* RESUME */}
                {campaign.status === "PAUSED" && (
                  <DropdownMenuItem
                    onClick={() => runAction(campaign, "resume")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-blue-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <FiRotateCcw className="h-4 w-4" />
                    </span>
                    Resume Campaign
                  </DropdownMenuItem>
                )}

                {/* RETRY */}
                {campaign.failedCount > 0 &&
                  campaign.status !== "CANCELLED" && (
                    <DropdownMenuItem
                      onClick={() => runAction(campaign, "retry")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-indigo-50 transition"
                    >
                      <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                        <FiRotateCcw className="h-4 w-4" />
                      </span>
                      Retry Failed
                    </DropdownMenuItem>
                  )}

                {/* CANCEL */}
                {!["COMPLETED", "CANCELLED"].includes(campaign.status) && (
                  <DropdownMenuItem
                    onClick={() => runAction(campaign, "cancel")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-orange-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                      <FiXCircle className="h-4 w-4" />
                    </span>
                    Cancel Campaign
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-2" />

                {/* DELETE */}
                {campaign.status !== "RUNNING" && (
                  <DropdownMenuItem
                    onClick={() => runAction(campaign, "delete")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-red-50 transition text-red-600"
                  >
                    <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
                      <FiTrash2 className="h-4 w-4" />
                    </span>
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Broadcasts
                </h1>
                <p className="text-muted-foreground">
                  Create and manage your broadcast campaigns from one place
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCampaignIds.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={bulkDelete}
                    disabled={bulkDeleting}
                    className="shadow-sm animate-in fade-in"
                  >
                    {bulkDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Selected ({selectedCampaignIds.length})
                  </Button>
                )}
                <Button
                  className="gradient-whatsapp text-primary-foreground gap-2"
                  onClick={() => setOpenCreate(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create Broadcast
                </Button>
              </div>
              <CreateCampaignModal
                open={openCreate}
                setOpen={setOpenCreate}
                onSuccess={() => {
                  fetchCampaigns(activeTab, debouncedSearch);
                  fetchStats();
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* CARD 1 */}
              <div className="group relative rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Analytics
                  </span>
                </div>

                <p className="text-sm font-medium text-muted-foreground">
                  Total Sent
                </p>
                <p className="text-3xl font-bold text-blue-700 mt-1">
                  {loadingStats ? "..." : (stats?.messages?.sent ?? 0)}
                </p>
              </div>

              {/* CARD 2 */}
              <div className="group relative rounded-2xl p-5 bg-gradient-to-br from-green-50 to-emerald-100/60 border border-green-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-500/10 text-green-600 group-hover:scale-110 transition">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">
                    {stats?.messages?.sent > 0
                      ? (
                          (stats.messages.delivered / stats.messages.sent) *
                          100
                        ).toFixed(1)
                      : 0}
                    % rate
                  </span>
                </div>

                <p className="text-sm font-medium text-muted-foreground">
                  Delivered
                </p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  {loadingStats ? "..." : (stats?.messages?.delivered ?? 0)}
                </p>
              </div>

              {/* CARD 3 */}
              <div className="group relative rounded-2xl p-5 bg-gradient-to-br from-purple-50 to-purple-100/60 border border-purple-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Upcoming
                  </span>
                </div>

                <p className="text-sm font-medium text-muted-foreground">
                  Scheduled
                </p>
                <p className="text-3xl font-bold text-purple-700 mt-1">
                  {loadingStats ? "..." : (stats?.campaigns?.scheduled ?? 0)}
                </p>
              </div>

              {/* CARD 4 */}
              <div className="group relative rounded-2xl p-5 bg-gradient-to-br from-orange-50 to-orange-100/60 border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 group-hover:scale-110 transition">
                    <Play className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-orange-600 font-medium">
                    Live
                  </span>
                </div>

                <p className="text-sm font-medium text-muted-foreground">
                  Active Now
                </p>
                <p className="text-3xl font-bold text-orange-700 mt-1">
                  {loadingStats ? "..." : (stats?.campaigns?.active ?? 0)}
                </p>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as (typeof PAGE_TABS)[number])
              }
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="draft">Drafts</TabsTrigger>
                </TabsList>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    className="pl-10 w-64 bg-muted/50"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {/* LEFT */}
                <div className="flex items-center gap-4">
                  {/* SELECT ALL */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => toggleSelectAll()}
                    />
                    <span className="text-xs">Select All</span>
                  </div>
                  <span className="capitalize">
                    {activeTab === "all"
                      ? "All campaigns"
                      : `${activeTab} campaigns`}
                  </span>
                </div>

                {/* RIGHT */}
                <span>
                  {pagination.total} results
                  {selectedCampaignIds.length
                    ? ` • ${selectedCampaignIds.length} selected`
                    : ""}
                </span>
              </div>
              {PAGE_TABS.map((tabValue) => (
                <TabsContent
                  key={tabValue}
                  value={tabValue}
                  className="space-y-4"
                >
                  {renderCampaigns()}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="w-[96vw] sm:max-w-3xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {campaignDetail?.name || "Campaign details"}
            </SheetTitle>
            <SheetDescription>
              {campaignDetail?.template?.name ||
                "Detailed campaign information, audience, logs, and jobs"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {loadingDetail ? (
              <div className="text-sm text-muted-foreground">
                Loading campaign details...
              </div>
            ) : campaignDetail ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      className={cn(
                        "mt-2 capitalize",
                        statusStyles[normalizeStatus(campaignDetail.status)]
                          ?.bg,
                        statusStyles[normalizeStatus(campaignDetail.status)]
                          ?.text,
                      )}
                    >
                      {normalizeStatus(campaignDetail.status)}
                    </Badge>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="text-lg font-semibold mt-2">
                      {campaignDetail.progress}%
                    </p>
                  </div>
                </div>

                <Tabs
                  value={detailTab}
                  onValueChange={(value) =>
                    setDetailTab(value as (typeof DETAIL_TABS)[number])
                  }
                  className="space-y-4"
                >
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="audience">Audience</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="jobs">Jobs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                          Template
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {campaignDetail.template?.name || "-"}
                        </p>
                      </div>
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                          Audience Count
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {campaignDetail.audienceCount ??
                            campaignDetail.totalContacts}
                        </p>
                      </div>
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                          Scheduled At
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {fmt(campaignDetail.scheduledAt)}
                        </p>
                      </div>
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                          Completed At
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {fmt(campaignDetail.completedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                        {campaignDetail.description || "No description added"}
                      </p>
                    </div>
                    <div className="rounded-xl border p-4 space-y-3">
                      <p className="text-sm font-medium">Delivery Summary</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Sent</p>
                          <p className="font-semibold">
                            {campaignDetail.sentCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Delivered</p>
                          <p className="font-semibold">
                            {campaignDetail.deliveredCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Read</p>
                          <p className="font-semibold">
                            {campaignDetail.readCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Failed</p>
                          <p className="font-semibold">
                            {campaignDetail.failedCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="audience" className="space-y-3">
                    {loadingAudience ? (
                      <div className="text-sm text-muted-foreground">
                        Loading audience...
                      </div>
                    ) : !detailAudience.length ? (
                      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                        No audience records found.
                      </div>
                    ) : (
                      detailAudience.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-xl border p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {entry.name || entry.phone}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.phone}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {entry.status.toLowerCase()}
                            </Badge>
                          </div>
                          {entry.groups?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {entry.groups.map((group: any) => (
                                <Badge key={group.id} variant="outline">
                                  {group.name}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            Sent: {fmt(entry.sentAt)} | Delivered:{" "}
                            {fmt(entry.deliveredAt)} | Read: {fmt(entry.readAt)}
                          </p>
                          {entry.errorMessage ? (
                            <p className="text-xs text-destructive">
                              {entry.errorMessage}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="logs" className="space-y-3">
                    {loadingLogs ? (
                      <div className="text-sm text-muted-foreground">
                        Loading logs...
                      </div>
                    ) : !detailLogs.length ? (
                      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                        No campaign logs found.
                      </div>
                    ) : (
                      detailLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-xl border p-4 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {log.message || "No log message"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {fmt(log.createdAt)}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {log.type.toLowerCase()}
                          </Badge>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="jobs" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold mt-1">{jobStats.total}</p>
                      </div>
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="font-semibold mt-1">{jobStats.pending}</p>
                      </div>
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">
                          Processing
                        </p>
                        <p className="font-semibold mt-1">
                          {jobStats.processing}
                        </p>
                      </div>
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">
                          Completed
                        </p>
                        <p className="font-semibold mt-1">
                          {jobStats.completed}
                        </p>
                      </div>
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">Failed</p>
                        <p className="font-semibold mt-1">{jobStats.failed}</p>
                      </div>
                    </div>
                    <Progress value={jobStats.progress} className="h-2" />
                    {loadingJobs ? (
                      <div className="text-sm text-muted-foreground">
                        Loading jobs...
                      </div>
                    ) : !detailJobs.length ? (
                      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                        No jobs found for this campaign.
                      </div>
                    ) : (
                      detailJobs.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-xl border p-4 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              Batch #{job.batchNumber}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Records: {job.totalRecords} | Started:{" "}
                              {fmt(job.startedAt)} | Completed:{" "}
                              {fmt(job.completedAt)}
                            </p>
                            {job.errorMessage ? (
                              <p className="text-xs text-destructive mt-2">
                                {job.errorMessage}
                              </p>
                            ) : null}
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {job.status.toLowerCase()}
                          </Badge>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a campaign to view details.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Draft Campaign</DialogTitle>
            <DialogDescription>
              Update the draft campaign settings and scheduling.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Campaign Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                placeholder="Campaign name"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
                placeholder="Campaign description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Batch Size</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={editForm.batchSize}
                  onChange={(e) =>
                    setEditForm((current) => ({
                      ...current,
                      batchSize: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Delay (seconds)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={editForm.delayInSeconds}
                  onChange={(e) =>
                    setEditForm((current) => ({
                      ...current,
                      delayInSeconds: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <Checkbox
                checked={editForm.isScheduled}
                onCheckedChange={(checked) =>
                  setEditForm((current) => ({
                    ...current,
                    isScheduled: checked === true,
                    scheduledAt: checked === true ? current.scheduledAt : "",
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium">Schedule this campaign</p>
                <p className="text-xs text-muted-foreground">
                  Enable if you want this draft to move to scheduled.
                </p>
              </div>
            </div>
            {editForm.isScheduled ? (
              <div className="space-y-1">
                <Label>Scheduled At</Label>
                <Input
                  type="datetime-local"
                  value={editForm.scheduledAt}
                  onChange={(e) =>
                    setEditForm((current) => ({
                      ...current,
                      scheduledAt: e.target.value,
                    }))
                  }
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={audienceModalOpen} onOpenChange={setAudienceModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {audienceMode === "add" ? "Add Audience" : "Remove Audience"}
            </DialogTitle>
            <DialogDescription>
              {audienceCampaign?.name ||
                "Select contacts or groups for this draft campaign."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={audienceSearch}
                onChange={(e) => setAudienceSearch(e.target.value)}
                placeholder={
                  audienceMode === "add"
                    ? "Search contacts or groups..."
                    : "Search campaign audience..."
                }
                className="pl-10"
              />
            </div>

            {loadingAudienceOptions ? (
              <div className="text-sm text-muted-foreground">
                Loading options...
              </div>
            ) : audienceMode === "add" ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Contacts</p>
                    <Badge variant="outline">
                      {selectedContactIds.length} selected
                    </Badge>
                  </div>
                  {!contactOptions.length ? (
                    <p className="text-sm text-muted-foreground">
                      No contacts found.
                    </p>
                  ) : (
                    contactOptions.map((contact) => {
                      const checked = selectedContactIds.includes(contact.id);
                      const label =
                        `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
                        contact.phone;
                      return (
                        <label
                          key={contact.id}
                          className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              setSelectedContactIds((current) =>
                                value === true
                                  ? [...new Set([...current, contact.id])]
                                  : current.filter((id) => id !== contact.id),
                              )
                            }
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {label}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.phone}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Groups</p>
                    <Badge variant="outline">
                      {selectedGroupIds.length} selected
                    </Badge>
                  </div>
                  {!groupOptions.length ? (
                    <p className="text-sm text-muted-foreground">
                      No groups found.
                    </p>
                  ) : (
                    groupOptions.map((group) => {
                      const checked = selectedGroupIds.includes(group.id);
                      return (
                        <label
                          key={group.id}
                          className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              setSelectedGroupIds((current) =>
                                value === true
                                  ? [...new Set([...current, group.id])]
                                  : current.filter((id) => id !== group.id),
                              )
                            }
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {group.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {group.contactsCount ?? 0} contacts
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Campaign Audience</p>
                  <Badge variant="outline">
                    {selectedContactIds.length} selected
                  </Badge>
                </div>
                {!removableAudience.length ? (
                  <p className="text-sm text-muted-foreground">
                    No audience found for this campaign.
                  </p>
                ) : (
                  removableAudience.map((entry) => {
                    const checked = selectedContactIds.includes(
                      entry.contactId,
                    );
                    return (
                      <label
                        key={entry.id}
                        className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setSelectedContactIds((current) =>
                              value === true
                                ? [...new Set([...current, entry.contactId])]
                                : current.filter(
                                    (id) => id !== entry.contactId,
                                  ),
                            )
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {entry.name || entry.phone}
                            </p>
                            <Badge variant="outline" className="capitalize">
                              {entry.status.toLowerCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.phone}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAudienceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitAudience} disabled={submittingAudience}>
              {submittingAudience ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {audienceMode === "add" ? "Add Audience" : "Remove Audience"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
