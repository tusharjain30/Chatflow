import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, Loader2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeader } from "@/utils/authStorage";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type TeamOption = {
  id: string;
  companyName: string;
  roleLabel: string;
  memberCount?: number;
  isCurrent: boolean;
};

type ChangeTeamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangeTeamDialog({ open, onOpenChange }: ChangeTeamDialogProps) {
  const { user, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [teams, setTeams] = useState<TeamOption[]>([]);

  useEffect(() => {
    if (!open || !user?.account?.id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const roleLabel =
          user.role?.roleType === "CUSTOMER_OWNER"
            ? "Owner"
            : user.role?.roleType === "CUSTOMER_ADMIN"
              ? "Admin"
              : "Agent";

        let memberCount: number | undefined;
        try {
          const res = await fetch(`${API_BASE}/user/team/stats`, {
            headers: getAuthHeader("user"),
          });
          const json = await res.json();
          if (res.ok && json.status === 1) {
            memberCount = json.data?.totalMembers;
          }
        } catch {
          // stats are optional for the switcher
        }

        if (cancelled) return;

        setTeams([
          {
            id: user.account.id,
            companyName: user.account.companyName || "My Team",
            roleLabel,
            memberCount,
            isCurrent: true,
          },
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const handleSelect = async (team: TeamOption) => {
    if (team.isCurrent) {
      onOpenChange(false);
      return;
    }

    setSwitching(true);
    try {
      // Multi-team membership is prepared here; current model is one account per user.
      await refetchProfile();
      onOpenChange(false);
      navigate("/");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change team</DialogTitle>
          <DialogDescription>
            Switch the workspace you are working in. Team data, chats, and
            settings follow the selected team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading teams...
            </div>
          ) : (
            teams.map((team) => (
              <button
                key={team.id}
                type="button"
                disabled={switching}
                onClick={() => handleSelect(team)}
                className={cn(
                  "w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                  team.isCurrent
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">
                      {team.companyName}
                    </p>
                    {team.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                        <Check className="h-3 w-3" />
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your role: {team.roleLabel}
                    {typeof team.memberCount === "number"
                      ? ` · ${team.memberCount} members`
                      : ""}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              navigate("/team");
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage members
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
