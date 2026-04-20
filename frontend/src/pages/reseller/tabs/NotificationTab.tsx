export default function NotificationTab() {
  return (
    <div className="space-y-6">

      <h2 className="text-lg font-semibold text-gray-900">
        Notifications
      </h2>

      <div className="space-y-3 text-sm text-gray-600">
        <label className="flex gap-2">
          <input type="checkbox" />
          Low balance alerts
        </label>

        <label className="flex gap-2">
          <input type="checkbox" />
          Subscription expiry alerts
        </label>
      </div>

    </div>
  );
}