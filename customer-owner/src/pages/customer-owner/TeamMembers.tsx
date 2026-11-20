import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/shared/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Shield,
  Users,
  UserCheck,
  Clock,
  Loader2,
  UserCog,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type MemberRole = "owner" | "admin" | "agent";
type MemberStatus = "active" | "invited" | "inactive";
type ApiRoleType = "CUSTOMER_OWNER" | "CUSTOMER_ADMIN" | "CUSTOMER_AGENT";

interface TeamRow {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  roleType: ApiRoleType;
  status: MemberStatus;
  lastActive: string;
  assignedChats: number;
  resolvedToday: number;
  joinedAt: string;
  kind: "member" | "invite";
  inviteId?: string;
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  agents: number;
  pendingInvites: number;
}

const roleStyles: Record<MemberRole, string> = {
  owner:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  agent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const statusStyles: Record<MemberStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  invited:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const rolePermissions: Record<MemberRole, string[]> = {
  owner: ["Full access", "Billing", "Team management", "All features"],
  admin: ["Team management", "Settings", "Analytics", "All chats"],
  agent: ["Assigned chats", "Contacts", "Broadcasts"],
};

function mapRoleType(roleType?: string | null): MemberRole {
  if (roleType === "CUSTOMER_OWNER") return "owner";
  if (roleType === "CUSTOMER_ADMIN") return "admin";
  return "agent";
}

function toApiRole(role: "admin" | "agent"): "CUSTOMER_ADMIN" | "CUSTOMER_AGENT" {
  return role === "admin" ? "CUSTOMER_ADMIN" : "CUSTOMER_AGENT";
}

function formatLastActive(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Online now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamMembers() {
  const { toast } = useToast();
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    activeMembers: 0,
    agents: 0,
    pendingInvites: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamRow | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "agent">("agent");
  const [editActive, setEditActive] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "agent">("agent");

  const openChangeMember = (member: TeamRow) => {
    if (member.kind !== "member" || member.role === "owner") return;
    setSelectedMember(member);
    setEditRole(member.role === "admin" ? "admin" : "agent");
    setEditActive(member.status === "active");
    setIsChangeModalOpen(true);
  };

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...getAuthHeader("user"),
    }),
    [],
  );

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes, statsRes] = await Promise.all([
        fetch(
          `${API_BASE}/user/team/list-members?page=1&limit=50`,
          { headers: authHeaders },
        ),
        fetch(`${API_BASE}/user/team/list-invites`, {
          headers: authHeaders,
        }),
        fetch(`${API_BASE}/user/team/stats`, {
          headers: authHeaders,
        }),
      ]);

      const [membersJson, invitesJson, statsJson] = await Promise.all([
        membersRes.json(),
        invitesRes.json(),
        statsRes.json(),
      ]);

      if (!membersRes.ok || membersJson.status !== 1) {
        throw new Error(membersJson.message || "Failed to load members");
      }
      if (!invitesRes.ok || invitesJson.status !== 1) {
        throw new Error(invitesJson.message || "Failed to load invites");
      }
      if (!statsRes.ok || statsJson.status !== 1) {
        throw new Error(statsJson.message || "Failed to load stats");
      }

      const memberRows: TeamRow[] = (membersJson.data.members || []).map(
        (member: any) => ({
          id: member.id,
          name: member.name || member.email,
          email: member.email,
          role: mapRoleType(member.role),
          roleType: (member.role || "CUSTOMER_AGENT") as ApiRoleType,
          status: member.status === "ACTIVE" ? "active" : "inactive",
          lastActive: formatLastActive(member.lastActive),
          assignedChats: member.assignedChats || 0,
          resolvedToday: member.resolvedToday || 0,
          joinedAt: member.createdAt
            ? new Date(member.createdAt).toISOString().slice(0, 10)
            : "",
          kind: "member" as const,
        }),
      );

      const inviteRows: TeamRow[] = (invitesJson.data.invites || []).map(
        (invite: any) => ({
          id: `invite-${invite.id}`,
          inviteId: invite.id,
          name: invite.email.split("@")[0],
          email: invite.email,
          role: mapRoleType(invite.roleType),
          roleType: invite.roleType as ApiRoleType,
          status: "invited" as const,
          lastActive: "Never",
          assignedChats: 0,
          resolvedToday: 0,
          joinedAt: invite.createdAt
            ? new Date(invite.createdAt).toISOString().slice(0, 10)
            : "",
          kind: "invite" as const,
        }),
      );

      setRows([...memberRows, ...inviteRows]);
      setStats(statsJson.data);
    } catch (error) {
      toast({
        title: "Unable to load team",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const filteredRows = rows.filter(
    (row) =>
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/user/team/invite`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          email,
          roleType: toApiRole(inviteRole),
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to send invite");
      }

      toast({
        title: json.data?.emailSent === false ? "Invite created" : "Invitation sent",
        description:
          json.data?.emailSent === false
            ? `${email} was invited, but email delivery failed. You can resend.`
            : `An invitation email has been sent to ${email}.`,
      });

      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("agent");
      await loadTeam();
    } catch (error) {
      toast({
        title: "Invite failed",
        description:
          error instanceof Error ? error.message : "Unable to send invite",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeMember = async () => {
    if (!selectedMember || selectedMember.kind !== "member") return;
    if (selectedMember.role === "owner") return;

    const roleChanged =
      editRole !== (selectedMember.role === "admin" ? "admin" : "agent");
    const statusChanged =
      editActive !== (selectedMember.status === "active");

    if (!roleChanged && !statusChanged) {
      setIsChangeModalOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/user/team/update-member`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          userId: selectedMember.id,
          ...(roleChanged ? { roleType: toApiRole(editRole) } : {}),
          ...(statusChanged ? { isActive: editActive } : {}),
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to update member");
      }

      toast({
        title: "Member updated",
        description: `${selectedMember.name}'s access has been updated.`,
      });
      setIsChangeModalOpen(false);
      setSelectedMember(null);
      await loadTeam();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Unable to update member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: TeamRow) => {
    if (member.kind !== "member" || member.role === "owner") return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/user/team/member/${member.id}/toggle-status`,
        {
          method: "PATCH",
          headers: authHeaders,
        },
      );
      const json = await response.json();
      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to update status");
      }

      toast({
        title: json.data?.isActive ? "Member activated" : "Member deactivated",
        description: `${member.name} is now ${
          json.data?.isActive ? "active" : "inactive"
        }.`,
      });
      await loadTeam();
    } catch (error) {
      toast({
        title: "Status update failed",
        description:
          error instanceof Error ? error.message : "Unable to update status",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      if (selectedMember.kind === "invite" && selectedMember.inviteId) {
        const response = await fetch(`${API_BASE}/user/team/cancel-invite`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ inviteId: selectedMember.inviteId }),
        });
        const json = await response.json();
        if (!response.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to cancel invite");
        }
        toast({
          title: "Invite cancelled",
          description: `Invitation for ${selectedMember.email} was cancelled.`,
        });
      } else {
        const response = await fetch(
          `${API_BASE}/user/team/member/${selectedMember.id}`,
          {
            method: "DELETE",
            headers: authHeaders,
          },
        );
        const text = await response.text();
        const json = text ? JSON.parse(text) : { status: response.ok ? 1 : 0 };
        if (!response.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to remove member");
        }
        toast({
          title: "Member removed",
          description: `${selectedMember.name} has been removed from the team.`,
          variant: "destructive",
        });
      }

      setIsDeleteModalOpen(false);
      setSelectedMember(null);
      await loadTeam();
    } catch (error) {
      toast({
        title: "Remove failed",
        description:
          error instanceof Error ? error.message : "Unable to remove",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvite = async (row: TeamRow) => {
    if (!row.inviteId) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/user/team/resend-invite`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ inviteId: row.inviteId }),
      });
      const json = await response.json();
      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to resend invite");
      }

      toast({
        title: json.data?.emailSent === false ? "Invite updated" : "Invitation resent",
        description:
          json.data?.emailSent === false
            ? `Invite refreshed for ${row.email}, but email delivery failed.`
            : `A new invitation email has been sent to ${row.email}.`,
      });
      await loadTeam();
    } catch (error) {
      toast({
        title: "Resend failed",
        description:
          error instanceof Error ? error.message : "Unable to resend invite",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full w-full">
      <main className="flex-1 overflow-auto">
        <Header
          title="Team Members"
          subtitle="Manage your team and their permissions"
        />
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Team Members
              </h1>
              <p className="text-sm text-muted-foreground">
                Invite people, change roles, and control access
              </p>
            </div>
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMembers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeMembers}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.agents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Invites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingInvites}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="bg-card rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-10 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading team...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Chats</TableHead>
                    <TableHead>Resolved Today</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-10"
                      >
                        No team members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>
                                {initials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${roleStyles[member.role]} cursor-pointer`}
                            onClick={() => {
                              setSelectedMember(member);
                              setIsRoleModalOpen(true);
                            }}
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusStyles[member.status]}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.assignedChats}</TableCell>
                        <TableCell>{member.resolvedToday}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.lastActive}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.kind === "member" &&
                                member.role !== "owner" && (
                                  <DropdownMenuItem
                                    onClick={() => openChangeMember(member)}
                                  >
                                    <UserCog className="h-4 w-4 mr-2" />
                                    Change Member
                                  </DropdownMenuItem>
                                )}
                              {member.kind === "member" &&
                                member.role !== "owner" && (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(member)}
                                  >
                                    {member.status === "active" ? (
                                      <>
                                        <Ban className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                              {member.status === "invited" &&
                                member.inviteId && (
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvite(member)}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Resend Invite
                                  </DropdownMenuItem>
                                )}
                              {member.role !== "owner" && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {member.kind === "invite"
                                    ? "Cancel Invite"
                                    : "Remove"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <Modal
            open={isInviteModalOpen}
            onOpenChange={setIsInviteModalOpen}
            title="Invite Team Member"
          >
            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v: "admin" | "agent") => setInviteRole(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Permissions:</p>
                  <ul className="text-sm text-muted-foreground">
                    {rolePermissions[inviteRole].map((perm, i) => (
                      <li key={i}>• {perm}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsInviteModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            open={isChangeModalOpen}
            onOpenChange={setIsChangeModalOpen}
            title="Change Team Member"
            description="Update this member’s role and access status."
          >
            {selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      {initials(selectedMember.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedMember.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedMember.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editRole}
                    onValueChange={(v: "admin" | "agent") => setEditRole(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="p-3 bg-muted/70 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Permissions
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-0.5">
                      {rolePermissions[editRole].map((perm) => (
                        <li key={perm}>• {perm}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Active access</p>
                    <p className="text-xs text-muted-foreground">
                      Inactive members cannot sign in to this team
                    </p>
                  </div>
                  <Switch
                    checked={editActive}
                    onCheckedChange={setEditActive}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsChangeModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleChangeMember} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          <Modal
            open={isRoleModalOpen}
            onOpenChange={setIsRoleModalOpen}
            title="Role Permissions"
          >
            {selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={roleStyles[selectedMember.role]}>
                    {selectedMember.role}
                  </Badge>
                  <span className="font-medium">{selectedMember.name}</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Permissions:</p>
                  <ul className="space-y-1">
                    {rolePermissions[selectedMember.role].map((perm, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-center gap-2"
                      >
                        <Shield className="h-3 w-3" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsRoleModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </Modal>

          <Modal
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            title={
              selectedMember?.kind === "invite"
                ? "Cancel Invitation"
                : "Remove Team Member"
            }
          >
            <div className="space-y-4">
              <p>
                Are you sure you want to{" "}
                {selectedMember?.kind === "invite" ? "cancel invite for" : "remove"}{" "}
                <strong>{selectedMember?.name}</strong>
                {selectedMember?.kind === "invite" ? "?" : " from the team?"}
              </p>
              {selectedMember?.kind !== "invite" && (
                <p className="text-sm text-muted-foreground">
                  They will lose access to all conversations and data.
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={submitting}
                >
                  {submitting
                    ? "Working..."
                    : selectedMember?.kind === "invite"
                      ? "Cancel Invite"
                      : "Remove Member"}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </main>
    </div>
  );
}
