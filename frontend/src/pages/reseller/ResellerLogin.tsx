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
    <div className="min-h-screen bg-gray-50 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-6xl grid gap-8 lg:grid-cols-2">
        {/* LEFT SECTION */}
        <section className="rounded-3xl bg-white p-8 shadow-sm border">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16A249] text-white shadow">
              <ChartNoAxesCombined className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                Reseller Panel
              </p>
              <p className="text-sm text-gray-500">
                ChatFlow partner workspace
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-[#16A249] font-semibold">
                Revenue Operations
              </p>

              <h1 className="text-3xl font-semibold text-gray-900 leading-snug">
                Manage customer accounts, subscriptions, and reseller
                performance from one focused panel.
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
                <div
                  key={item.label}
                  className="rounded-2xl border bg-gray-50 p-4 hover:shadow-sm transition"
                >
                  <p className="mb-1 text-sm font-semibold text-gray-800">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LOGIN CARD */}
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Sign in to reseller panel
            </CardTitle>
            <CardDescription className="text-gray-500">
              Use your reseller email, username, or phone number.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* IDENTIFIER */}
              <div className="space-y-2">
                <Label className="text-gray-700">
                  Email / Username / Phone
                </Label>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="partner@yourcompany.com"
                  className="bg-gray-50 border focus:border-[#16A249] focus:ring-[#16A249]"
                />
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <Label className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-50 border pr-12 focus:border-[#16A249] focus:ring-[#16A249]"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 text-gray-500"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER */}
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Keep me signed in
              </label>

              {/* BUTTON */}
              <Button
                type="submit"
                className="w-full bg-[#16A249] hover:bg-[#12813a] text-white rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Open reseller panel"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Looking for the customer workspace?{" "}
              <Link
                to="/login"
                className="font-medium text-[#16A249] hover:underline"
              >
                Go to standard login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
