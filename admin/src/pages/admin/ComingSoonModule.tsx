import { Construction } from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Header } from "@/components/dashboard/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ComingSoonModuleProps = {
  title: string;
  subtitle: string;
};

export default function ComingSoonModule({
  title,
  subtitle,
}: ComingSoonModuleProps) {
  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">
        <Header title={title} subtitle={subtitle} />
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-3xl">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Construction className="h-6 w-6" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>
                  This module is part of the Super Admin Console structure and
                  is ready for implementation.
                </p>
                <p>
                  Navigation, layout, and branding are live. Backend workflows
                  for this section will be connected next.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
