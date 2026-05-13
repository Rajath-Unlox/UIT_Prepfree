"use client";

import React, { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import api from "@/lib/api";
import toast from "react-hot-toast";
import accre1 from "@/public/images/wallet/accre1.png";
import accre2 from "@/public/images/wallet/accre2.png";
import accre3 from "@/public/images/wallet/accre3.png";
import accre4 from "@/public/images/wallet/accre4.png";
import accre5 from "@/public/images/wallet/accre5.png";
import accre6 from "@/public/images/wallet/accre6.png";
import stars from "@/public/images/wallet/stars.png";
import Image from "next/image";
import Marquee from "react-fast-marquee";

const accre = [accre1, accre2, accre3, accre4, accre5, accre6];

// --- Types ---
interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: any;
  name: string;
  description: string;
  price: string;
  priceAmount: number;
  credits: number;
  features: PlanFeature[];
  isPopular?: boolean;
  buttonLabel: string;
}

// FAQs
const faqs = [
  {
    question: "What is Credit? And How it Works",
    answer:
      "Credits are the currency used to perform activities on the platform. 2 Credits are required for one Assessment, and 5 Credits are required for one Mock Interview. Credits can never expire and can be used anytime.",
  },
  {
    question: "What is Credit?",
    answer: "Detailed explanation about what credit is...",
  },
  {
    question: "Do my credits expire?",
    answer:
      "No, your purchased credits have lifetime validity and never expire.",
  },
  {
    question: "Can I upgrade my plan?",
    answer:
      "Yes, you can purchase additional credits or a higher tier plan at any time.",
  },
];

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/wallet/plans");
        if (res.data.success) {
          const transformed = res.data.plans.map((p: any) => ({
            id: p._id,
            name: p.name,
            description: p.description,
            price: `${p.amount}.00 INR`,
            priceAmount: p.amount,
            credits: p.points,
            isPopular: p.isPopular,
            buttonLabel: `Choose ${p.name}`,

            features: [
              {
                text: `${p.mockTestsCount} Mock Tests (Approximate)`,
                included: true,
              },
              {
                text: `${p.assessmentsCount} Assessments (Approximate)`,
                included: true,
              },
              { text: `Test Analysis`, included: p.hasTestAnalysis },
              {
                text: `${p.pointDeductionPerAssessment} Credits Deduction Per Assessment`,
                included: true,
              },
              {
                text: `${p.pointDeductionPerInterview} Credits Deduction Per Mock Interview`,
                included: true,
              },
              { text: "No Expiry", included: true },
            ],
          }));

          setPlans(transformed);
        } else {
          toast.error("Failed to load plans");
        }
      } catch (err) {
        console.error(err);
        toast.error("Unable to fetch plans");
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Payment Handler
  const handlePurchase = async (planId: string) => {
    setProcessingPlan(planId);
    try {
      setLoading(true);

      // Create order using only planId
      const { data } = await api.post("/payments/create-order", { planId });

      if (!data.success) {
        setLoading(false);
        return toast.error("Order creation failed");
      }

      const { amount, currency, order_id, key_id, prefill, plan } = data;

      const options = {
        key: key_id,
        amount: amount * 100, // Convert INR to paise for Razorpay
        currency,
        name: "Career Platform",
        description: `${plan.points} Credits Purchase`,
        order_id,
        handler: async (response: any) => {
          try {
            const verify = await api.post("/payments/verify-update-order", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planId, 
            });

            if (verify.data.success) {
              toast.success("Payment Success! Credits Added");
              window.dispatchEvent(new Event("wallet-updated"));
            } else {
              toast.error("Payment failed to verify");
            }
          } catch (err) {
            console.error(err);
            toast.error("Payment verification error");
          }
        },
        prefill, 
        theme: { color: "#f2825c" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

      razorpay.on("payment.failed", (response: any) => {
        console.error("Payment Failed:", response.error);
        toast.error("Payment Failed");
      });
    } catch (err) {
      console.error(err);
      toast.error("Payment error");
    } finally {
      setLoading(false);
      setProcessingPlan(null);
    }
  };

  return (
    <main className="w-full h-full flex flex-col gap-10 overflow-y-auto">
      {/* Header Section */}
      <div className="flex justify-between items-end pb-4">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2 w-full flex items-end justify-between">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"
                />
              ))}
              <span className="bg-[#fff0ea] text-[#f2825c] text-sm px-3 py-1 rounded-full font-medium flex items-center justify-center">
                Trusted by 100+ Colleges
              </span>
            </div>
            <Link
              href="/dashboard/wallet/history"
              className="text-[#f2825c] font-bold underline text-lg underline-offset-4 mb-2"
            >
              View Transaction History
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-[#1e1e1e]">
            Unlock unlimited career growth
            <br />
            with lifetime access
          </h1>
        </div>
      </div>

      {/* Plans Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 items-end gap-6">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`group relative flex flex-col justify-between rounded-xl border transition-all duration-300 ease-in-out cursor-pointer
              ${
                plan.isPopular
                  ? "border-[#f2825c] h-[102%] z-10 bg-[#f2825c] hover:shadow-xl hover:-translate-y-2 hover:z-20"
                  : "border-gray-200 hover:border-[#f2825c] hover:shadow-xl hover:-translate-y-2 hover:z-20 bg-white"
              }`}
          >
            {plan.isPopular && (
              <div className="bg-[#f2825c] text-white text-center py-2 rounded-t-[10px] text-sm font-medium flex items-center justify-center gap-2">
                <span className="text-white">
                  <Image src={stars} alt="" className="h-4 w-auto" />
                </span>{" "}
                Most Popular
              </div>
            )}

            <div
              className={`p-6 flex flex-col h-full ${
                !plan.isPopular ? "pt-8" : "rounded-xl overflow-hidden bg-white"
              }`}
            >
              <div>
                <h2 className="text-xl font-medium text-[#1e1e1e] group-hover:text-[#f2825c] transition-colors">
                  {plan.name}
                </h2>
                <p className="text-md text-[#1e1e1e]/80 mt-2 leading-relaxed">
                  {plan.description}
                </p>

                <div className="my-6">
                  <h1 className="text-3xl font-bold text-[#f2825c]">
                    {plan.price}
                  </h1>
                  <p className="text-sm font-semibold text-[#1e1e1e]/60 mt-1">
                    Credit Points: {plan.credits}
                  </p>
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          plan.isPopular ? "bg-[#f2825c]" : "bg-[#fff0ea]"
                        }`}
                      >
                        <Check
                          size={10}
                          className={
                            plan.isPopular ? "text-white" : "text-[#1e1e1e]"
                          }
                        />
                      </div>
                      <span className="text-sm text-[#343434] font-medium">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={processingPlan === plan.id}
                  className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                    plan.isPopular
                      ? "bg-[#184852] text-white hover:bg-[#184852]/85"
                      : "border border-[#f7fbfa] text-[#f2825c] bg-[#f7fbfa] hover:bg-[#f7fbfa]/70"
                  } ${
                    processingPlan === plan.id
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {processingPlan === plan.id
                    ? "Processing..."
                    : plan.buttonLabel}
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Trusted By Section */}
      <section className="flex flex-col items-center gap-8 py-4">
        <h2 className="text-xl font-bold text-[#111827]">
          Trusted By 100+ Colleges
        </h2>
        <div className="w-[70%] overflow-hidden">
          <Marquee>
            <div className="flex justify-center">
              {accre.map((item, idx) => (
                <Image
                  key={idx}
                  src={item}
                  alt=""
                  className="w-auto h-16 ml-10"
                />
              ))}
            </div>
          </Marquee>
        </div>
      </section>

      {/* QnA for Credit Section */}
      <section className="w-full pb-10">
        <h2 className="text-2xl font-bold text-center text-[#1e1e1e] mb-8">
          How Credits Work?
        </h2>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <Collapsible
              key={index}
              open={openFaqIndex === index}
              onOpenChange={() =>
                setOpenFaqIndex(openFaqIndex === index ? null : index)
              }
              className={`border border-gray-200 rounded-xl p-5 bg-white overflow-hidden transition-all duration-300 ${
                openFaqIndex === index ? "shadow-md" : "shadow-sm"
              }`}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="text-lg font-medium text-[#170F49]">
                  {faq.question}
                </span>
                <div
                  className={`rounded-full p-1 transition-transform duration-200 ${
                    openFaqIndex === index
                      ? "bg-[#f2825c] text-white rotate-180"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <ChevronDown size={20} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 text-md text-gray-600 leading-relaxed animate-slide-down">
                {faq.answer}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Page;