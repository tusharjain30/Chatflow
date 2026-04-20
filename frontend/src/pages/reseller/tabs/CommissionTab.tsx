import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CommissionTab() {
  return (
    <div className="space-y-6">

      <h2 className="text-lg font-semibold text-gray-900">
        Commission Settings
      </h2>

      <div className="space-y-2">
        <Label>Default Commission (%)</Label>
        <Input placeholder="Enter %" className="bg-gray-50 border focus:border-[#16A249]" />
      </div>

      <div className="rounded-xl border bg-green-50 p-4 text-sm text-gray-700">
        This defines how much you earn from each customer subscription.
      </div>

    </div>
  );
}