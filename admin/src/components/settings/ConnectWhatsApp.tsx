import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Smartphone, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const COUNTRY_CODE =
  import.meta.env.VITE_WHATSAPP_DEFAULT_COUNTRY_CODE || "91";

type Verification = {
  id: string;
  clientPhone: string;
  status: string;
  wabaPhoneId?: string | null;
  wabaWabaId?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

type WhatsAppAccount = {
  id: string;
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  displayName?: string | null;
  isActive: boolean;
  status: string;
  metaBusinessName?: string | null;
};

type IntegrationResponse = {
  verification: Verification | null;
  accounts: WhatsAppAccount[];
};

type Step = "loading" | "connect" | "otp" | "connected";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function toTenDigitPhone(value: string) {
  const digits = digitsOnly(value);
  if (digits.length === 12 && digits.startsWith(COUNTRY_CODE)) {
    return digits.slice(COUNTRY_CODE.length);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits.slice(-10);
}

export function ConnectWhatsApp({
  defaultPhone = "",
}: {
  defaultPhone?: string;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("loading");
  const [phone, setPhone] = useState(toTenDigitPhone(defaultPhone));
  const [otp, setOtp] = useState("");
  const [integration, setIntegration] = useState<IntegrationResponse | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const activeAccount =
    integration?.accounts.find((account) => account.isActive) ||
    integration?.accounts[0] ||
    null;

  const loadIntegration = useCallback(async () => {
    setStep("loading");
    try {
      const response = await fetch(
        `${API_BASE}/user/account/whatsapp-integration`,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader("user"),
          },
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to load WhatsApp status");
      }

      const data = json.data as IntegrationResponse;
      setIntegration(data);

      const verified = data.verification?.status === "VERIFIED";
      const connectedAccount = data.accounts.some(
        (account) => account.isActive && account.status === "ACTIVE",
      );

      if (verified || connectedAccount) {
        setStep("connected");
        if (data.verification?.clientPhone) {
          setPhone(toTenDigitPhone(data.verification.clientPhone));
        }
        return;
      }

      if (data.verification?.status === "PENDING") {
        setStep("otp");
        setPhone(toTenDigitPhone(data.verification.clientPhone || defaultPhone));
        return;
      }

      setStep("connect");
    } catch (error) {
      setStep("connect");
      toast({
        title: "Could not load WhatsApp status",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  }, [defaultPhone, toast]);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  const sendOtp = async () => {
    const normalizedPhone = toTenDigitPhone(phone);
    if (!/^\d{10}$/.test(normalizedPhone)) {
      toast({
        title: "Invalid phone number",
        description: "Enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setDebugOtp(null);
    try {
      const response = await fetch(
        `${API_BASE}/user/whatsapp/verify-whatsapp-number/submit-whatsapp-number`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader("user"),
          },
          body: JSON.stringify({ phone: normalizedPhone }),
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to send OTP");
      }

      setPhone(normalizedPhone);
      setOtp("");
      setStep("otp");
      if (json.data?.debugOtp) {
        setDebugOtp(json.data.debugOtp);
      }

      toast({
        title: "OTP sent",
        description: `We sent a code to +${COUNTRY_CODE}${normalizedPhone}`,
      });
    } catch (error) {
      toast({
        title: "OTP failed",
        description:
          error instanceof Error ? error.message : "Unable to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      toast({
        title: "Invalid OTP",
        description: "Enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/user/whatsapp/verify-whatsapp-number/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader("user"),
          },
          body: JSON.stringify({ otp: otp.trim() }),
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to verify OTP");
      }

      toast({
        title: "WhatsApp connected",
        description: "Your number is verified and ready to use",
      });
      setOtp("");
      setDebugOtp(null);
      await loadIntegration();
    } catch (error) {
      toast({
        title: "Verification failed",
        description:
          error instanceof Error ? error.message : "Unable to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const disconnect = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/user/whatsapp/connect/disconnect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader("user"),
          },
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to disconnect");
      }

      toast({
        title: "WhatsApp disconnected",
        description: "You can connect a number again anytime",
      });
      setOtp("");
      setDebugOtp(null);
      setStep("connect");
      setIntegration(null);
      await loadIntegration();
    } catch (error) {
      toast({
        title: "Disconnect failed",
        description:
          error instanceof Error ? error.message : "Unable to disconnect",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="card-elevated p-6 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking WhatsApp connection...
      </div>
    );
  }

  if (step === "connected") {
    const displayPhone =
      activeAccount?.phoneNumber ||
      (integration?.verification?.clientPhone
        ? `${COUNTRY_CODE}${integration.verification.clientPhone}`
        : phone);

    return (
      <div className="card-elevated p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            WhatsApp Business
          </h3>
          <p className="text-sm text-muted-foreground">
            Your WhatsApp number is connected to ChatFlow.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Connected</h4>
                <p className="text-sm text-muted-foreground">
                  +{displayPhone}
                </p>
                {activeAccount?.displayName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeAccount.displayName}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Unplug className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          </div>
        </div>

        {(activeAccount?.wabaId ||
          integration?.verification?.wabaWabaId) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="text-muted-foreground">WABA ID</p>
              <p className="font-medium break-all">
                {activeAccount?.wabaId ||
                  integration?.verification?.wabaWabaId}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-muted-foreground">Phone Number ID</p>
              <p className="font-medium break-all">
                {activeAccount?.phoneNumberId ||
                  integration?.verification?.wabaPhoneId}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Connect WhatsApp
        </h3>
        <p className="text-sm text-muted-foreground">
          Verify your business mobile number with OTP to start messaging.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm text-muted-foreground">
          We will send a one-time code on WhatsApp to confirm you own this
          number. After verification, templates, bots, and campaigns unlock for
          your account.
        </div>
      </div>

      {step === "connect" && (
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone">Mobile number</Label>
            <div className="flex gap-2">
              <div className="h-10 px-3 rounded-md border border-input bg-muted flex items-center text-sm text-muted-foreground">
                +{COUNTRY_CODE}
              </div>
              <Input
                id="whatsapp-phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(event) =>
                  setPhone(digitsOnly(event.target.value).slice(0, 10))
                }
              />
            </div>
          </div>
          <Button onClick={sendOtp} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4 max-w-md">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit OTP sent to{" "}
            <span className="font-medium text-foreground">
              +{COUNTRY_CODE}
              {phone}
            </span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="whatsapp-otp">OTP</Label>
            <Input
              id="whatsapp-otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(event) =>
                setOtp(digitsOnly(event.target.value).slice(0, 6))
              }
            />
          </div>
          {debugOtp && (
            <p className="text-xs text-amber-600">
              Debug OTP (local only): {debugOtp}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={verifyOtp} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Connect"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={sendOtp}
            >
              Resend OTP
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => {
                setStep("connect");
                setOtp("");
                setDebugOtp(null);
              }}
            >
              Change number
            </Button>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            OTP expires in 5 minutes. Make sure WhatsApp is active on this
            phone.
          </p>
        </div>
      )}
    </div>
  );
}
