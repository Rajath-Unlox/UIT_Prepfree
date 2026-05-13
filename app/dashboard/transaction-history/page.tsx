"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// --- Types ---
interface RealTransaction {
  id: string;
  planName: string;
  amount: string;
  status: "Success" | "Failed" | "Pending";
  date: string;
  paymentMethod: string;
}

const Page = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<RealTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/payments/transaction-history");
        if (data.success && Array.isArray(data.history)) {
          const mapped: RealTransaction[] = data.history.map((item: any) => ({
            id: item._id,
            // Updated: Backend stores 'wallet_points_purchased'
            planName: `Purchase of ${item.wallet_points_purchased} Credits`, 
            amount: `₹${item.amount_inr.toFixed(2)}`,
            status: item.status === "SUCCESS" ? "Success" : item.status === "FAILED" ? "Failed" : "Pending",
            date: new Date(item.createdAt).toLocaleString('en-IN', { 
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
            }),
            paymentMethod: "Online", // Backend doesn't store method type in provided schema, defaulting to Online
          }));
          setTransactions(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <main className="w-full h-full p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center w-full border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">
            Transaction History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View your real money payments and invoices
          </p>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No transactions found.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="w-full bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    t.status === "Success" 
                      ? "bg-[#fff0ea]" 
                      : t.status === "Failed" 
                      ? "bg-red-100" 
                      : "bg-yellow-100"
                  }`}
                >
                  {t.status === "Success" ? (
                    <CheckCircle2 className="text-[#f2825c]" size={24} />
                  ) : t.status === "Failed" ? (
                    <XCircle className="text-red-600" size={24} />
                  ) : (
                    <CheckCircle2 className="text-yellow-600" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#111827]">
                    {t.planName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{t.date}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {t.paymentMethod}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">ID: {t.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <h1 className="text-lg font-bold text-[#111827]">
                    {t.amount}
                  </h1>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.status === "Success"
                        ? "bg-[#fff0ea] text-[#f2825c]"
                        : t.status === "Failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors group-hover:text-[#f2825c] text-gray-400">
                  <FileText size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Page;