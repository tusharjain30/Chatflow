import { Button } from "@/components/ui/button";

export default function TeamTab() {
  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Team Members
        </h2>

        <Button className="bg-[#16A249] text-white">
          Add Member
        </Button>
      </div>

      <div className="text-sm text-gray-500">
        Manage your team access and permissions
      </div>

    </div>
  );
}