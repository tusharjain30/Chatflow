import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ResellerShell } from "@/components/reseller/ResellerShell";
import { getAuthToken } from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const formatMoney = (amount?: number | null, currency = "INR") =>
  `${currency} ${Number(amount || 0).toLocaleString("en-IN")}`;

export default function ResellerAuditLogs() {
  const { toast } = useToast();
  // ================= PLAN =================
  const [planData, setPlanData] = useState<any>(null);
  const [planSearch, setPlanSearch] = useState("");
  const [planPage, setPlanPage] = useState(1);

  // ================= BILLING =================
  const [billingData, setBillingData] = useState<any>(null);
  const [billingSearch, setBillingSearch] = useState("");
  const [billingPage, setBillingPage] = useState(1);

  // ================= USER =================
  const [userData, setUserData] = useState<any>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");
  const [debouncedPlanSearch, setDebouncedPlanSearch] = useState(planSearch);
  const [debouncedBillingSearch, setDebouncedBillingSearch] =
    useState(billingSearch);
  const [debouncedUserSearch, setDebouncedUserSearch] = useState(userSearch);

  const limit = 6;

  const [activeTab, setActiveTab] = useState<"plan" | "billing" | "user">(
    "plan",
  );

  // ================= FETCH =================
  const fetchPlans = async () => {
    try {
      setPlanLoading(true);
      setPlanError("");

      const res = await fetch(
        `${API_BASE}/reseller/audit/plans?page=${planPage}&limit=${limit}&search=${debouncedPlanSearch}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );

      const json = await res.json();
      if (json.status === 1) {
        setPlanData(json.data);
      } else {
        setPlanData({ list: [], pagination: {} });
        setPlanError(json.message || "Failed to load plans");

        toast({
          title: "Error loading plans",
          description: json.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("PLAN FETCH ERROR:", err);

      setPlanError("Something went wrong");
      setPlanData({ list: [], pagination: {} });

      toast({
        title: "Network error",
        description: "Unable to fetch plans",
        variant: "destructive",
      });
    } finally {
      setPlanLoading(false);
    }
  };

  const fetchBilling = async () => {
    try {
      setBillingLoading(true);
      setBillingError("");

      const res = await fetch(
        `${API_BASE}/reseller/audit/billing?page=${billingPage}&limit=${limit}&search=${debouncedBillingSearch}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );

      const json = await res.json();

      if (json.status === 1) {
        setBillingData(json.data);
      } else {
        setBillingData({ list: [], pagination: {} });
        setBillingError(json.message || "Failed to load billing data");
        toast({
          title: "Error loading billing",
          description: json.message || "Failed to fetch billing data",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("BILLING FETCH ERROR:", err);
      setBillingError("Something went wrong");
      setBillingData({ list: [], pagination: {} });
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUserLoading(true);
      setUserError("");

      const res = await fetch(
        `${API_BASE}/reseller/audit/users?page=${userPage}&limit=${limit}&search=${debouncedUserSearch}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );

      const json = await res.json();

      if (json.status === 1) {
        setUserData(json.data);
      } else {
        setUserData({ list: [], pagination: {} });
        setUserError(json.message || "Failed to load users");
        toast({
          title: "Error loading users",
          description: json.message || "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("USER FETCH ERROR:", err);
      setUserError("Something went wrong");
      setUserData({ list: [], pagination: {} });
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [planPage, debouncedPlanSearch]);

  useEffect(() => {
    fetchBilling();
  }, [billingPage, debouncedBillingSearch]);

  useEffect(() => {
    fetchUsers();
  }, [userPage, debouncedUserSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlanSearch(planSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [planSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBillingSearch(billingSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [billingSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [userSearch]);

  return (
    <ResellerShell title="Audit Logs" eyebrow="Operations Trail">
      {/* ================= TABS ================= */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "plan", label: "Plan History" },
          { key: "billing", label: "Billing History" },
          { key: "user", label: "User Activity" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition
            ${
              activeTab === tab.key
                ? "bg-[#16A249] text-white shadow"
                : "bg-white border text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= TABLE CARD ================= */}
      <div className="rounded-2xl border bg-white shadow-md flex flex-col min-h-[500px]">
        {/* HEADER */}
        <div className="p-4 border-b font-semibold">
          {activeTab === "plan"
            ? "Plan History"
            : activeTab === "billing"
              ? "Billing History"
              : "User Activity"}
        </div>

        {/* SEARCH */}
        <div className="p-4">
          <input
            value={
              activeTab === "plan"
                ? planSearch
                : activeTab === "billing"
                  ? billingSearch
                  : userSearch
            }
            onChange={(e) => {
              if (activeTab === "plan") {
                setPlanPage(1);
                setPlanSearch(e.target.value);
              } else if (activeTab === "billing") {
                setBillingPage(1);
                setBillingSearch(e.target.value);
              } else {
                setUserPage(1);
                setUserSearch(e.target.value);
              }
            }}
            className="w-full py-2 border rounded-lg text-sm px-3"
            placeholder={`Search ${activeTab}...`}
          />
        </div>

        {/* ================= TABLE ================= */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            {/* HEAD */}
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left w-[40%]">Activity</th>
                <th className="px-4 py-3 text-left w-[20%]">Company</th>

                {activeTab === "user" && (
                  <>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                  </>
                )}

                {activeTab !== "user" && (
                  <th className="px-4 py-3 text-left">Amount</th>
                )}

                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {(activeTab === "plan"
                ? planData?.list
                : activeTab === "billing"
                  ? billingData?.list
                  : userData?.list
              )?.length ? (
                (activeTab === "plan"
                  ? planData.list
                  : activeTab === "billing"
                    ? billingData.list
                    : userData.list
                ).map((row: any) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-gray-50 transition even:bg-gray-50/40"
                  >
                    {/* ACTIVITY */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold
                        ${
                          activeTab === "plan"
                            ? "bg-blue-100 text-blue-600"
                            : activeTab === "billing"
                              ? "bg-green-100 text-green-600"
                              : "bg-purple-100 text-purple-600"
                        }`}
                        >
                          {activeTab === "billing" ? "₹" : row.title?.[0]}
                        </div>

                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {row.title}
                          </span>
                          <span className="text-xs text-gray-500 line-clamp-1">
                            {row.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* COMPANY */}
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                      {row.companyName || "General"}
                    </td>

                    {/* USER EXTRA */}
                    {activeTab === "user" && (
                      <>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {row.email}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                            {row.roleType}
                          </span>
                        </td>
                      </>
                    )}

                    {/* AMOUNT */}
                    {activeTab !== "user" && (
                      <td className="px-4 py-3 font-semibold text-green-600 whitespace-nowrap">
                        {formatMoney(row.amount, row.currency)}
                      </td>
                    )}

                    {/* DATE */}
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-14">
                    <div className="mx-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-6">
                      {/* ICON */}
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 17v-2a4 4 0 014-4h4M9 17H5m4 0h4m6-6V7a2 2 0 00-2-2h-2"
                          />
                        </svg>
                      </div>

                      {/* TITLE */}
                      <p className="text-sm font-semibold text-gray-900">
                        No activity found
                      </p>

                      {/* DESCRIPTION */}
                      <p className="mt-1 text-xs text-gray-500 text-center max-w-xs">
                        Try adjusting your search or filters to find what you're
                        looking for.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <Pagination
          page={
            activeTab === "plan"
              ? planPage
              : activeTab === "billing"
                ? billingPage
                : userPage
          }
          setPage={
            activeTab === "plan"
              ? setPlanPage
              : activeTab === "billing"
                ? setBillingPage
                : setUserPage
          }
          total={
            activeTab === "plan"
              ? planData?.pagination?.totalPages
              : activeTab === "billing"
                ? billingData?.pagination?.totalPages
                : userData?.pagination?.totalPages
          }
        />
      </div>
    </ResellerShell>
  );
}

// ================= PAGINATION =================
function Pagination({ page, setPage, total }: any) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-2xl">
      {/* LEFT INFO */}
      <p className="text-xs text-gray-500">
        Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
        <span className="font-semibold text-gray-900">{total || 1}</span>
      </p>

      {/* CONTROLS */}
      <div className="flex items-center gap-2">
        {/* PREV */}
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition 
            ${
              page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
        >
          ← Prev
        </button>

        {/* CURRENT PAGE */}
        <div className="px-3 py-1.5 text-sm rounded-lg bg-[#16A249] text-white font-semibold shadow-sm">
          {page}
        </div>

        {/* NEXT */}
        <button
          disabled={page === total}
          onClick={() => setPage(page + 1)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition 
            ${
              page === total
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
