import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { capitalize } from "@/utils/Capitalize";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 px-6 flex items-center justify-between sticky top-0 z-20 
    backdrop-blur-xl bg-white/70 dark:bg-zinc-900/60 border-b border-border shadow-sm">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-6">
        
        {/* Title + Welcome */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#19AA4E]">
            Dashboard
          </h1>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            
            {/* Avatar */}
            {/* <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
            flex items-center justify-center text-white text-xs font-semibold shadow-sm ring-2 ring-white">
              {user?.firstName?.charAt(0)?.toUpperCase()}
            </div> */}

            <span>
              Welcome back,
              <span className="ml-1 font-medium text-foreground">
                {capitalize(user?.firstName)}
              </span>
            </span>

            <span className="animate-wave">👋</span>
          </div>
        </div>

        {/* LIVE STATUS */}
        {/* <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full 
        bg-gradient-to-r from-emerald-100 to-green-200 text-green-800 text-xs font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          Live
        </div> */}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">

        {/* SEARCH */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition" />

          <Input
            placeholder="Search..."
            className="pl-10 w-64 rounded-full bg-muted/40 border border-transparent 
            focus:border-primary focus:bg-white dark:focus:bg-zinc-900
            transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </div>

        {/* NOTIFICATIONS */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-muted/50 transition"
        >
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />

          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center 
            bg-red-500 text-white text-xs p-0 shadow-md animate-bounce"
          >
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
}