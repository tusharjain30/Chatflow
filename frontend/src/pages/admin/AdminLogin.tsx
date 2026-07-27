import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

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

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetchProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/super-admin/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });

      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to login");
      }

      localStorage.setItem("auth_token", json.data.token);
      localStorage.setItem("auth_portal", "admin");

      await refetchProfile();

      toast({
        title: "Super admin access granted",
        description: "The control center is ready.",
      });

      navigate("/admin");
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
    <div className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-6xl grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border bg-slate-950 p-8 text-slate-50 shadow-sm">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-white shadow">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-semibold">Super Admin Panel</p>
              <p className="text-sm text-slate-300">Platform governance workspace</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-rose-300 font-semibold">
                Reseller Operations
              </p>
              <h1 className="text-3xl font-semibold leading-snug">
                Create resellers, adjust commission, and control partner access
                from one focused command center.
              </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Partner onboarding",
                  value: "Create and launch reseller accounts in minutes",
                },
                {
                  label: "Commission control",
                  value: "Tune payouts without touching the database",
                },
                {
                  label: "Portfolio visibility",
                  value: "Track customer coverage and reseller health",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <p className="mb-1 text-sm font-semibold text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-300">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Sign in to super admin panel
            </CardTitle>
            <CardDescription className="text-gray-500">
              Use your admin email and password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-gray-700">Admin email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@chatflow-demo.com"
                  className="bg-gray-50 border focus:border-rose-500 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-50 border pr-12 focus:border-rose-500 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 text-gray-500"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Keep me signed in
              </label>

              <Button
                type="submit"
                className="w-full rounded-xl bg-rose-500 text-white hover:bg-rose-600"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Open super admin panel"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Looking for reseller tools?{" "}
              <Link
                to="/reseller/login"
                className="font-medium text-rose-500 hover:underline"
              >
                Open reseller login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
