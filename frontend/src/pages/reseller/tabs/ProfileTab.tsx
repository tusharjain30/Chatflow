import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfileTab() {
  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Business Profile
          </h2>
          <p className="text-sm text-gray-500">
            Update your company details and personal info
          </p>
        </div>

        {/* SAVE BUTTON */}
        <Button className="bg-[#16A249] text-white hover:bg-[#12813a] rounded-xl px-5">
          Save Changes
        </Button>

      </div>

      {/* PROFILE CARD */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">

        {/* AVATAR SECTION */}
        <div className="flex items-center gap-4">

          <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#16A249] text-white font-semibold text-lg">
            TJ
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">
              Profile photo
            </p>
            <p className="text-xs text-gray-500">
              Upload your company logo or avatar
            </p>
          </div>

          <Button
            variant="outline"
            className="ml-auto border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Upload
          </Button>

        </div>

        {/* FORM */}
        <div className="grid gap-5 md:grid-cols-2">

          {[
            { key: "companyName", label: "Company Name" },
            { key: "firstName", label: "First Name" },
            { key: "lastName", label: "Last Name" },
            { key: "phone", label: "Phone Number" },
          ].map((field) => (
            
            <div key={field.key} className="space-y-2">

              <Label className="text-sm text-gray-700">
                {field.label}
              </Label>

              <Input
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="bg-gray-50 border focus:border-[#16A249]"
              />

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}