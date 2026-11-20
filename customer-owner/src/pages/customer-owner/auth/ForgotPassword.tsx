import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Step = "email" | "reset";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json();

      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to send reset code");
      }

      setEmail(trimmed);
      setDebugOtp(json.data?.debugOtp || null);
      setStep("reset");
      toast({
        title: "Check your email",
        description:
          json.data?.emailSent === false && json.data?.debugOtp
            ? "Email delivery failed locally — use the debug OTP shown below."
            : "If an account exists for that email, a reset code has been sent.",
      });
    } catch (err: unknown) {
      toast({
        title: "Request failed",
        description:
          err instanceof Error ? err.message : "Unable to send reset code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!/^\d{4,6}$/.test(otp.trim())) {
      nextErrors.otp = "Enter the 4–6 digit code from your email";
    }
    if (newPassword.length < 8) {
      nextErrors.newPassword = "Password must be at least 8 characters";
    }
    if (newPassword !== confirmNewPassword) {
      nextErrors.confirmNewPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          newPassword,
          confirmNewPassword,
        }),
      });
      const json = await res.json();

      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to reset password");
      }

      toast({
        title: "Password updated",
        description: "You can sign in with your new password.",
      });
      navigate("/login");
    } catch (err: unknown) {
      toast({
        title: "Reset failed",
        description:
          err instanceof Error ? err.message : "Unable to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg gradient-whatsapp flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">ChatFlow</span>
        </Link>

        <Card className="card-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === "email" ? "Forgot password" : "Reset password"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your account email and we’ll send a reset code."
                : `Enter the code sent to ${email} and choose a new password.`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 pt-1">{errors.email}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="reset-otp">Reset code</Label>
                  <Input
                    id="reset-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      clearError("otp");
                    }}
                  />
                  {errors.otp && (
                    <p className="text-xs text-red-500 pt-1">{errors.otp}</p>
                  )}
                  {debugOtp && (
                    <p className="text-xs text-amber-600 pt-1">
                      Debug OTP (local only): {debugOtp}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        clearError("newPassword");
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-red-500 pt-1">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        clearError("confirmNewPassword");
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  {errors.confirmNewPassword && (
                    <p className="text-xs text-red-500 pt-1">
                      {errors.confirmNewPassword}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update password"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setDebugOtp(null);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setErrors({});
                  }}
                >
                  Use a different email
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
