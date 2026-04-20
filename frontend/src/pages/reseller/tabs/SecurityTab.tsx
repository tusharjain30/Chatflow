import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SecurityTab() {
  return (
    <div className="space-y-6">

      <h2 className="text-lg font-semibold text-gray-900">
        Security
      </h2>

      <div className="space-y-2">
        <Label>Change Password</Label>
        <Input type="password" placeholder="New password" />
      </div>

    </div>
  );
}