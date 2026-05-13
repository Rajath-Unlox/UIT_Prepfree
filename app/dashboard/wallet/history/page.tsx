"use client";

import React, { useEffect, useState } from "react";
import { Zap, FileText, Mic, Medal } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import credits from "@/public/images/wallet/credits.png";
import Image from "next/image";

// --- Types ---
interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  type: "assessment" | "mock" | "plan" | "misc";
}

const getIcon = (type: string) => {
  switch (type) {
    case "assessment":
      return <FileText className="text-[#f2825c]" size={20} />;
    case "mock":
      return <Mic className="text-[#f2825c]" size={20} />;
    case "plan":
      return <Medal className="text-[#f2825c]" size={20} />;
    default:
      return <Zap className="text-[#f2825c]" size={20} />;
  }
};

const Page = () => {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [totalUsed, setTotalUsed] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Balance and History in parallel
        const [balanceRes] = await Promise.all([
          api.get("/wallet/details"),
          // api.get("/wallet/history"),
        ]);

        // 1. Process Balance
        if (balanceRes.data.success) {
          // Updated: Backend returns 'walletPoints'
          setBalance(balanceRes.data.balance); 
        }

        // 2. Process History
        if (balanceRes.data.success && Array.isArray(balanceRes.data.history)) {
          let calculatedTotalUsed = 0;

          const mappedHistory: Transaction[] = balanceRes.data.history.map((item: any) => {
            // Calculate Total Used (sum of all negative transactions)
            if (item.amount < 0) {
              calculatedTotalUsed += Math.abs(item.amount);
            }

            // Map Backend Types to Frontend Props
            let type: Transaction["type"] = "misc";
            let title = "Transaction";
            let subtitle = item.description || "";

            if (item.type === "PURCHASE" || item.type === "SIGNUP_BONUS") {
              type = "plan";
              title = item.type === "SIGNUP_BONUS" ? "Welcome Bonus" : "Credits Purchase";
              subtitle = `Added ${item.amount} Credits`;
            } else if (item.type === "ASSESSMENT_FEE") {
              type = "assessment";
              title = "Assessment";
              subtitle = item.description || "Used Credit for Assessment";
            } else if (item.type === "INTERVIEW_FEE") {
              type = "mock";
              title = "Mock Interview";
              subtitle = item.description || "Used Credit for Interview";
            }

            return {
              id: item._id,
              title: title,
              subtitle: subtitle,
              date: new Date(item.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              amount: item.amount,
              type: type,
            };
          });

          setHistory(mappedHistory);
          setTotalUsed(calculatedTotalUsed);
        }
      } catch (error) {
        console.error("Failed to load credits data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="w-full h-full p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center w-full pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1e1e1e]">
            Credit Usage History
          </h1>
          <p className="text-sm text-[#1e1e1e] mt-1">
            Track your credit spending and transaction history
          </p>
        </div>

        <div className="bg-[#f2825c] text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm">
          <div className="rounded-full">
            <Image src={credits} alt="" className="w-4 h-4"/>
          </div>
          <span className="text-sm">
            Credit Left: {loading ? "..." : balance}
          </span>
        </div>
      </div>

      {/* Summary Card */}
      <div className="w-full bg-[#fff0ea] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <div className="bg-[#fbbf24] rounded-full p-1">
            <Image src={credits} alt="" className="w-4 h-4"/>
            </div>
          </div>
          <h2 className="text-xl font-medium text-[#1e1e1e]">
            Total Credit Used
          </h2>
        </div>
        <span className="text-2xl font-bold text-[#f2825c]">
          {loading ? "..." : totalUsed}
        </span>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No history found.</div>
        ) : (
          history.map((t) => (
            <div
              key={t.id}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#f3f4f6] rounded-full flex items-center justify-center">
                  {getIcon(t.type)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">
                    {t.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{t.subtitle}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.date}</p>
                </div>
              </div>

              <div className="text-right">
                <h1
                  className={`text-lg font-bold ${
                    t.amount > 0 ? "text-[#22c55e]" : "text-[#111827]"
                  }`}
                >
                  {t.amount > 0 ? `+${t.amount}` : t.amount}
                </h1>
                <p className="text-xs text-gray-400">
                  {t.amount > 0 ? "Credits" : "Credit"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default Page;