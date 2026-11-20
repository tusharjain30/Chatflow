import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Wifi,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/utils/authStorage";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type ServiceStatus = {
  status: "up" | "down";
  latencyMs?: number | null;
  detail?: string | null;
  environment?: string;
  uptimeSeconds?: number;
};

type HealthData = {
  overall: "healthy" | "degraded" | "down";
  checkedAt: string;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    redis: ServiceStatus;
    socket: ServiceStatus;
    queues: ServiceStatus;
  };
};

const overallStyles = {
  healthy: "bg-primary/10 text-primary",
  degraded: "bg-amber-50 text-amber-700",
  down: "bg-red-50 text-red-700",
};

const statusDot = {
  up: "bg-primary",
  down: "bg-red-500",
};

export default function PlatformHealth() {
  const { toast } = useToast();
  const token = getAuthToken();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/super-admin/overview/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to load platform health");
      }
      setData(json.data);
    } catch (error) {
      toast({
        title: "Health check failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    load();
  }, [load]);

  const services = [
    {
      key: "api",
      title: "API Server",
      icon: Server,
      data: data?.services.api,
    },
    {
      key: "database",
      title: "PostgreSQL",
      icon: Database,
      data: data?.services.database,
    },
    {
      key: "redis",
      title: "Redis",
      icon: HardDrive,
      data: data?.services.redis,
    },
    {
      key: "queues",
      title: "BullMQ Queues",
      icon: Activity,
      data: data?.services.queues,
    },
    {
      key: "socket",
      title: "Socket.IO",
      icon: Wifi,
      data: data?.services.socket,
    },
  ] as const;

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">
        <Header
          title="Platform Health"
          subtitle="Live status of API, database, Redis, and realtime services"
        />

        <div className="flex-1 p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    System status
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Last checked{" "}
                    {data?.checkedAt
                      ? new Date(data.checkedAt).toLocaleString()
                      : "—"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {data?.overall ? (
                    <Badge
                      className={cn(
                        "capitalize",
                        overallStyles[data.overall],
                      )}
                    >
                      {data.overall}
                    </Badge>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={load}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={cn(
                        "mr-2 h-4 w-4",
                        loading && "animate-spin",
                      )}
                    />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  {data?.overall === "healthy"
                    ? "All monitored services are responding normally."
                    : data?.overall === "degraded"
                      ? "Some services are unavailable. Queues and realtime may be limited until Redis is up."
                      : loading
                        ? "Running health checks..."
                        : "Unable to confirm platform health."}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <Card
                  key={service.key}
                  className="border-slate-200 shadow-sm"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <service.icon className="h-4 w-4 text-primary" />
                      {service.title}
                    </CardTitle>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        service.data?.status
                          ? statusDot[service.data.status]
                          : "bg-slate-300",
                      )}
                    />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-lg font-semibold capitalize text-slate-900">
                      {loading ? "—" : service.data?.status || "unknown"}
                    </p>
                    {typeof service.data?.latencyMs === "number" ? (
                      <p className="text-xs text-slate-500">
                        Latency: {service.data.latencyMs} ms
                      </p>
                    ) : null}
                    {typeof service.data?.uptimeSeconds === "number" ? (
                      <p className="text-xs text-slate-500">
                        Uptime: {Math.floor(service.data.uptimeSeconds / 60)}{" "}
                        min · {service.data.environment}
                      </p>
                    ) : null}
                    <p className="text-sm text-slate-500">
                      {service.data?.detail || "No details"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
