import { useState, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type FormState = {
  companyName: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    companyName: "",
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const firstErrorRef = useRef<HTMLInputElement | null>(null);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const phoneDigits = form.phone.replace(/\D/g, "");

  const passwordRules = {
    length: (p: string) => p.length >= 8,
    upper: (p: string) => /[A-Z]/.test(p),
    lower: (p: string) => /[a-z]/.test(p),
    number: (p: string) => /\d/.test(p),
    special: (p: string) => /[@$!%*?&]/.test(p),
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const formatted = formatIndianPhone(value);
      setForm((f) => ({ ...f, phone: formatted }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }

    setErrors((err) => ({ ...err, [name]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.userName.trim()) newErrors.userName = "Username is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(form.password)) {
      newErrors.password =
        "Password must contain 8+ characters, uppercase, lowercase, number and special character";
    }
    if (!form.confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";

    const phoneDigits = form.phone.replace(/\D/g, "");

    if (!phoneDigits) {
      newErrors.phone = "Phone is required";
    } else if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      newErrors.phone = "Enter a valid Indian phone number";
    }

    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.termsAccepted) {
      newErrors.termsAccepted = "You must accept terms & conditions";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/user/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone.replace(/\D/g, ""),
        }),
      });

      const json = await res.json();

      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Registration failed");
      }

      toast({
        title: "Account created 🎉",
        description: "Your account has been created successfully",
      });

      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatIndianPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10); // only numbers

    if (digits.length <= 5) return digits;

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const errorText = (field: keyof FormState) =>
    errors[field] ? (
      <p className="text-xs text-red-500 pt-1">{errors[field]}</p>
    ) : null;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg gradient-whatsapp flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">ChatFlow</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Start your 14-day free trial</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <Input
                    name="companyName"
                    placeholder="Company Name"
                    onChange={handleChange}
                  />
                  {errorText("companyName")}
                </div>

                {/* First / Last */}
                <div>
                  <Input
                    name="firstName"
                    placeholder="First Name"
                    onChange={handleChange}
                  />
                  {errorText("firstName")}
                </div>

                <div>
                  <Input
                    name="lastName"
                    placeholder="Last Name"
                    onChange={handleChange}
                  />
                  {errorText("lastName")}
                </div>

                {/* Username */}
                <div>
                  <Input
                    name="userName"
                    placeholder="Username"
                    onChange={handleChange}
                  />
                  {errorText("userName")}
                </div>

                {/* Phone */}
                <div>
                  <Input
                    name="phone"
                    placeholder="98765-43210"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  {errorText("phone")}
                </div>

                {/* Email full width */}
                <div className="md:col-span-2">
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    onChange={handleChange}
                  />
                  {errorText("email")}
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  {errorText("password")}
                  <div className="space-y-1 text-xs mt-2">
                    <Rule valid={passwordRules.length(form.password)}>
                      At least 8 characters
                    </Rule>

                    <Rule valid={passwordRules.upper(form.password)}>
                      One uppercase letter
                    </Rule>

                    <Rule valid={passwordRules.lower(form.password)}>
                      One lowercase letter
                    </Rule>

                    <Rule valid={passwordRules.number(form.password)}>
                      One number
                    </Rule>

                    <Rule valid={passwordRules.special(form.password)}>
                      One special character
                    </Rule>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="relative">
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>

                  {errorText("confirmPassword")}
                </div>
              </div>

              {/* Terms */}
              <div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={form.termsAccepted}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, termsAccepted: Boolean(v) }))
                    }
                  />
                  <span className="text-sm">
                    I agree to Terms & Privacy Policy
                  </span>
                </div>
                {errors.termsAccepted && (
                  <p className="text-xs text-red-500 pt-2">
                    {errors.termsAccepted}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
          <div className="flex flex-col items-center gap-1">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span>14-day trial</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span>No credit card</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Rule({
  valid,
  children,
}: {
  valid: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${valid ? "text-green-500" : "text-gray-400"}`}
    >
      {valid ? "✔" : "•"} {children}
    </div>
  );
}
