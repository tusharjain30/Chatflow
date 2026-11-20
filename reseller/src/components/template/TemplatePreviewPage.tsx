import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ArrowLeft } from "lucide-react";

export default function TemplatePreviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const template = state?.template;

  if (!template) return <div className="p-6">No template found</div>;

  const statusStyles: any = {
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Header />

        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>

              <h1 className="text-xl font-semibold">{template.name}</h1>

              <p className="text-sm text-muted-foreground">
                WhatsApp Template Preview
              </p>
            </div>

            <Badge
              className={`px-3 py-1 text-[10px] border ${
                statusStyles[template.status.toUpperCase()] ||
                "bg-gray-100 text-gray-600"
              }`}
            >
              {template.status.toUpperCase()}
            </Badge>
          </div>

          {/* Preview + Info Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 📱 WhatsApp Preview */}
            <div className="bg-[#e5ddd5] rounded-3xl p-6 flex justify-center shadow-inner">
              <div className="w-full max-w-[420px]">
                <div className="bg-white rounded-2xl p-4 shadow-md text-sm leading-relaxed break-words whitespace-pre-wrap transition">
                  {/* Header */}
                  {template.headerText && (
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      {template.headerText}
                    </p>
                  )}

                  {/* Body */}
                  <p className="text-[13px]">{template.content}</p>

                  {/* Footer */}
                  {template.footerText && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {template.footerText}
                    </p>
                  )}

                  {/* Buttons */}
                  {template.buttons?.length > 0 && (
                    <div className="mt-4 border-t pt-2 space-y-1">
                      {template.buttons.map((btn: any, i: number) => (
                        <div
                          key={i}
                          className="text-center text-primary font-medium py-2 rounded-md hover:bg-muted cursor-pointer transition"
                        >
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Time */}
                  <p className="text-[10px] text-right text-muted-foreground mt-2">
                    12:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* 📊 Template Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border p-4 bg-white shadow-sm">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={`px-3 py-1 text-[10px] border ${
                      statusStyles[template.status.toUpperCase()] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {template.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="rounded-xl border p-4 bg-white shadow-sm">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{template.category}</p>
                </div>

                <div className="rounded-xl border p-4 bg-white shadow-sm">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="capitalize font-medium">{template.type}</p>
                </div>

                <div className="rounded-xl border p-4 bg-white shadow-sm">
                  <p className="text-xs text-muted-foreground">Usage</p>
                  <p className="font-medium">{template.usageCount}</p>
                </div>
              </div>

              {/* Extra Card */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-sm font-medium">Template Insights</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This template is ready for broadcasting and follows WhatsApp
                  format.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
