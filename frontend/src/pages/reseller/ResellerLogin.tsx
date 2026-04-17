import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChartNoAxesCombined, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function ResellerLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetchProfile } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/reseller/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
          rememberMe,
        }),
      });

      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to login");
      }

      localStorage.setItem("auth_token", json.data.token);
      localStorage.setItem("auth_portal", "reseller");

      await refetchProfile();

      toast({
        title: "Reseller access granted",
        description: "Your partner workspace is ready.",
      });

      navigate("/reseller");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unable to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(15,23,42,0.9),rgba(250,204,21,0.12))] p-8 sm:p-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
              <ChartNoAxesCombined className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-semibold">Reseller Panel</p>
              <p className="text-sm text-slate-300">ChatFlow partner workspace</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-300">
                Revenue Operations
              </p>
              <h1 className="max-w-xl text-4xl font-semibold leading-tight">
                Manage customer accounts, subscriptions, and reseller performance
                from one focused panel.
              </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Customer rollup",
                  value: "Accounts, owners, and status in one view",
                },
                {
                  label: "Revenue insight",
                  value: "Track monthly recurring revenue and commissions",
                },
                {
                  label: "Faster onboarding",
                  value: "Create new client workspaces in minutes",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-sm font-medium text-white">{item.label}</p>
                  <p className="text-sm text-slate-300">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="border-white/10 bg-slate-900/85 text-slate-100 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to reseller panel</CardTitle>
            <CardDescription className="text-slate-400">
              Use your reseller email, username, or phone number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Email, username, or phone</Label>
                <Input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="partner@yourcompany.com"
                  className="border-white/10 bg-slate-950"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="border-white/10 bg-slate-950 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 text-slate-400"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="rounded border-white/20"
                />
                Keep me signed in on this device
              </label>

              <Button
                type="submit"
                className="w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Open reseller panel"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Looking for the customer workspace?{" "}
              <Link to="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
                Go to standard login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
