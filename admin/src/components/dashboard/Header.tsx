import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { capitalize } from "@/utils/Capitalize";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  showWelcome?: boolean;
};

export function Header({
  title = "Dashboard",
  subtitle,
  showWelcome = false,
}: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="min-h-16 py-3 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-border">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
          {title}
        </h1>
        {showWelcome ? (
          <p className="text-sm text-muted-foreground">
            Welcome Back, {capitalize(user?.firstName) || "there"}
          </p>
        ) : subtitle ? (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 w-56 rounded-full bg-muted/40 border-transparent focus:border-primary focus:bg-white"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-red-500 text-white text-xs p-0">
            0
          </Badge>
        </Button>
      </div>
    </header>
  );
}
