import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
  ShieldCheck,
  Sparkles,
  Users,
  Mail,
  Phone,
  Calendar,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type TeamRole = "OWNER" | "ADMIN" | "ACCOUNT_MANAGER" | "SUPPORT" | "VIEWER";

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleType: "RESELLER_SUB_ADMIN" | "RESELLER_SUPPORT";
  teamRole: TeamRole;
  roleLabel: string;
  permissions: string[];
  inviteStatus: string;
  isActive: boolean;
  createdAt: string;
};

const roleOptions: Array<{ value: TeamRole; label: string }> = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "ACCOUNT_MANAGER", label: "Account Manager" },
  { value: "SUPPORT", label: "Support" },
  { value: "VIEWER", label: "Viewer" },
];

const labelForPermission = (permission: string) =>
  permission
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function ResellerTeamList() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roleFilter, setRoleFilter] = useState<"ALL" | TeamRole>("ALL");
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    permissions: string[];
  }>({
    visible: false,
    x: 0,
    y: 0,
    permissions: [],
  });

  const loadMembers = async (nextRoleFilter?: "ALL" | TeamRole) => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      const effectiveRole = nextRoleFilter ?? roleFilter;

      if (effectiveRole !== "ALL") {
        params.set("teamRole", effectiveRole);
      }

      const response = await fetch(
        `${API_BASE}/reseller/team?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        },
      );

      const json = await response.json();

      if (response.ok && json.status === 1) {
        setMembers(json.data || []);
      }
    } catch (error) {
      toast({
        title: "Failed to load",
        description: "Unable to fetch team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const updateMember = async (
    memberId: string,
    payload: Partial<{
      teamRole: TeamRole;
      isActive: boolean;
      permissions: string[];
    }>,
  ) => {
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/reseller/team/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          memberId,
          ...payload,
        }),
      });

      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to update member");
      }

      toast({
        title: "Updated",
        description: "Team member updated successfully",
      });

      await loadMembers();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Unable to update member",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId: string) => {
    const result = await Swal.fire({
      title: "Remove Team Member?",
      text: "This member will lose access to the reseller panel.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Remove",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,

      customClass: {
        popup: "rounded-[28px] border border-slate-200 dark:border-slate-800",
        title: "text-slate-900 dark:text-white text-xl font-semibold",
        htmlContainer: "text-slate-500 text-sm",
        confirmButton:
          "rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700",
        cancelButton:
          "rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
      },

      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;

    setSaving(true);

    // LOADING MODAL
    Swal.fire({
      title: "Removing member...",
      text: "Please wait while we remove access",
      allowOutsideClick: false,
      allowEscapeKey: false,

      customClass: {
        popup: "rounded-[28px] border border-slate-200 dark:border-slate-800",
        title: "text-slate-900 dark:text-white text-lg font-semibold",
        htmlContainer: "text-slate-500 text-sm",
      },

      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(`${API_BASE}/reseller/team/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ memberId }),
      });

      if (response.status !== 204) {
        const json = await response.json();

        if (!response.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to remove member");
        }
      }

      // SUCCESS
      await Swal.fire({
        icon: "success",
        title: "Member Removed",
        text: "Team member removed successfully",

        customClass: {
          popup:
            "rounded-[28px] border border-slate-200 dark:border-slate-800 p-2",

          title: "text-slate-900 dark:text-white text-xl font-semibold",

          htmlContainer: "text-slate-500 text-sm mt-2",

          actions: "!flex !flex-row !items-center !justify-center !gap-4 !mt-7",

          confirmButton:
            "min-w-[130px] rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-red-700 focus:ring-4 focus:ring-red-200",

          cancelButton:
            "min-w-[120px] rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100",
        },

        buttonsStyling: false,
      });

      await loadMembers();
    } catch (error) {
      // ERROR
      Swal.fire({
        icon: "error",
        title: "Remove Failed",
        text:
          error instanceof Error ? error.message : "Unable to remove member",

        customClass: {
          popup: "rounded-[28px] border border-slate-200 dark:border-slate-800",
          title: "text-slate-900 dark:text-white text-xl font-semibold",
          htmlContainer: "text-slate-500 text-sm",
          confirmButton:
            "rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700",
        },

        buttonsStyling: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const roleSummary = useMemo(
    () =>
      roleOptions.map((role) => ({
        label: role.label,
        count: members.filter((member) => member.teamRole === role.value)
          .length,
      })),
    [members],
  );

  return (
    <ResellerShell title="Team List" eyebrow="Reseller Access Management">
      <div className="relative min-h-screen overflow-hidden">
        {/* BACKGROUND */}
        <div className="absolute inset-0  dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-md bg-[#16A249]/10 blur-3xl" />

        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-md " />

        <div className="relative z-10 space-y-6">
          {/* HERO */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-md border border-white/20 bg-white/70 p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#16A249]/5 via-transparent to-transparent" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-md border border-[#16A249]/20 bg-[#16A249]/10 px-3 py-1 text-xs font-medium text-[#16A249]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Premium Team Workspace
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Internal Team Members
                  </h1>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Manage reseller access, permissions and internal operations
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={roleFilter}
                  onValueChange={(value: "ALL" | TeamRole) => {
                    setRoleFilter(value);
                    loadMembers(value);
                  }}
                >
                  <SelectTrigger className="h-10 w-[190px] rounded-md border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>

                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  asChild
                  className="h-10 rounded-md bg-gradient-to-r from-[#16A249] to-[#12813a] px-5 text-white transition-all hover:scale-[1.02]"
                >
                  <Link to="/reseller/team">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* STATS */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5"
          >
            {roleSummary.map((item) => (
              <div
                key={item.label}
                className="group relative  overflow-hidden rounded-md border border-white/20 bg-white/80 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:bg-slate-900/80"
              >
                <div className="absolute inset-0" />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {item.count}
                    </h3>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-[#16A249] to-[#12813a] text-white">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                {/* <div className="mt-5 flex items-center text-xs font-medium text-[#16A249]">
                  Team analytics
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </div> */}
              </div>
            ))}
          </motion.div>

          {/* MEMBERS */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-slate-800">
                <div>
                  <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">
                    Internal Team Members
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Manage reseller staff roles & permissions
                  </p>
                </div>

                <div className="hidden h-10 w-10 items-center justify-center rounded-md bg-[#16A249]/10 text-[#16A249] lg:flex">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="w-full overflow-visible">
                  <table className="w-full">
                    {/* HEAD */}
                    <thead className="bg-slate-50 dark:bg-slate-900/70">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="w-[22%] px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Member
                        </th>

                        <th className="w-[20%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Contact
                        </th>

                        <th className="w-[24%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Permissions
                        </th>

                        <th className="w-[14%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Role
                        </th>

                        <th className="w-[10%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Status
                        </th>

                        <th className="w-[10%] px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    {/* BODY */}
                    <tbody>
                      {members.length ? (
                        members.map((member, index) => (
                          <motion.tr
                            style={{ overflow: "visible" }}
                            key={member.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="group border-b border-slate-100 transition-all hover:bg-[#16A249]/[0.02] dark:border-slate-800"
                          >
                            {/* MEMBER */}
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                {/* AVATAR */}
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#16A249] to-[#12813a] text-[13px] font-semibold text-white">
                                  {member.firstName.charAt(0)}
                                  {member.lastName.charAt(0)}
                                </div>

                                {/* INFO */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                                      {member.firstName} {member.lastName}
                                    </p>

                                    <div
                                      className={`h-2 w-2 rounded-md ${
                                        member.isActive
                                          ? "bg-emerald-500"
                                          : "bg-slate-400"
                                      }`}
                                    />
                                  </div>

                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className="rounded-md bg-[#16A249]/10 px-2 py-0.5 text-[10px] font-medium text-[#16A249]">
                                      {member.roleLabel}
                                    </span>

                                    <span className="text-[10px] text-slate-400">
                                      {new Date(
                                        member.createdAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* CONTACT */}
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                                  <Mail className="h-3 w-3 text-slate-400" />

                                  <span className="truncate">
                                    {member.email}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <Phone className="h-3 w-3 text-slate-400" />

                                  {member.phone}
                                </div>
                              </div>
                            </td>

                            {/* PERMISSIONS */}
                            <td className="overflow-visible px-4 py-3">
                              <div className="flex max-w-[220px] flex-wrap gap-1">
                                {member.permissions.length ? (
                                  <>
                                    {member.permissions
                                      .slice(0, 3)
                                      .map((permission) => (
                                        <span
                                          key={permission}
                                          className="
              truncate rounded-md bg-slate-100
              px-1.5 py-1 text-[9px]
              max-w-[90px] font-medium text-slate-600
              dark:bg-slate-800 dark:text-slate-300
              "
                                        >
                                          {labelForPermission(permission)}
                                        </span>
                                      ))}

                                    {/* MORE COUNT */}
                                    {member.permissions.length > 3 && (
                                      <div
                                        className="relative inline-block group"
                                        onMouseEnter={(e) => {
                                          const rect =
                                            e.currentTarget.getBoundingClientRect();

                                          setTooltip({
                                            visible: true,
                                            x: rect.right + 12,
                                            y: rect.top - 10,
                                            permissions:
                                              member.permissions.slice(3),
                                          });
                                        }}
                                        onMouseLeave={() =>
                                          setTooltip((prev) => ({
                                            ...prev,
                                            visible: false,
                                          }))
                                        }
                                      >
                                        {/* COUNT BADGE */}
                                        <span
                                          className="
              inline-flex cursor-pointer items-center
              rounded-md bg-[#16A249]/10
              px-2 py-1 text-[10px]
              font-medium text-[#16A249]
              transition-all hover:bg-[#16A249]/20
              "
                                        >
                                          +{member.permissions.length - 3}
                                        </span>

                                        {/* TOOLTIP */}
                                        {tooltip.visible && (
                                          <div
                                            className="
    fixed z-[99999]
    min-w-[220px] max-w-[260px]
    rounded-2xl border border-slate-200
    bg-white p-3 shadow-2xl
    dark:border-slate-700 dark:bg-slate-900
    "
                                            style={{
                                              left: tooltip.x,
                                              top: tooltip.y,
                                            }}
                                          >
                                            <p
                                              className="
      mb-2 text-[10px] font-semibold uppercase
      tracking-wide text-slate-400
      "
                                            >
                                              More Permissions
                                            </p>

                                            <div className="space-y-1.5">
                                              {tooltip.permissions.map(
                                                (permission) => (
                                                  <div
                                                    key={permission}
                                                    className="
          flex items-center gap-2 rounded-lg
          bg-slate-50 px-2 py-1.5
          text-[10px] font-medium text-slate-700
          dark:bg-slate-800 dark:text-slate-300
          "
                                                  >
                                                    <div className="h-1.5 w-1.5 rounded-full bg-[#16A249]" />

                                                    <span>
                                                      {labelForPermission(
                                                        permission,
                                                      )}
                                                    </span>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    No permissions
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* ROLE */}
                            <td className="px-4 py-3">
                              <Select
                                value={member.teamRole}
                                onValueChange={(value: TeamRole) =>
                                  updateMember(member.id, {
                                    teamRole: value,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 w-[145px] rounded-md border-slate-200 bg-white text-[11px] shadow-none dark:border-slate-700 dark:bg-slate-900">
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                  {roleOptions.map((role) => (
                                    <SelectItem
                                      key={role.value}
                                      value={role.value}
                                      className="text-[11px]"
                                    >
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* STATUS */}
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  updateMember(member.id, {
                                    isActive: !member.isActive,
                                  })
                                }
                                className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-[11px] font-medium transition-all ${
                                  member.isActive
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {member.isActive ? "Pause" : "Activate"}
                              </button>
                            </td>

                            {/* ACTION */}
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => removeMember(member.id)}
                                  className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 text-[11px] font-medium text-red-600 transition-all hover:bg-red-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-14">
                            <div className="flex flex-col items-center justify-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br from-[#16A249] to-[#12813a] text-white">
                                <Users className="h-6 w-6" />
                              </div>

                              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                                {loading
                                  ? "Loading team members..."
                                  : "No team members found"}
                              </h3>

                              <p className="mt-1 text-center text-[12px] text-slate-500">
                                Invite reseller team members to collaborate.
                              </p>

                              {!loading && (
                                <Button
                                  asChild
                                  className="mt-5 h-9 rounded-md bg-gradient-to-r from-[#16A249] to-[#12813a] px-4 text-[12px] text-white"
                                >
                                  <Link to="/reseller/team">
                                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                    Invite Member
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ResellerShell>
  );
}
