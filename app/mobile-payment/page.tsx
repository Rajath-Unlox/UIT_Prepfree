"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: {
    description: string;
    code?: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

const MobilePaymentContent = () => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const planId = searchParams.get("planId");
        const token = searchParams.get("token");

        if (!planId || !token) {
          const msg = "Missing required payment parameters.";
          setError(msg);
          setLoading(false);
          // Notify app of failure due to missing params
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: "FAILURE", message: msg }));
          }
          return;
        }

        // Temporarily configure our API instance to use the mobile user's token
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Wait
        if (!window.Razorpay) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Fetch Order Details from Backend
        const orderResponse = await api.post("/payments/create-order", { planId });

        if (!orderResponse.data.success) {
          throw new Error("Failed to create order");
        }

        const { order_id, amount, key_id, prefill } = orderResponse.data;

        // Initialize Razorpay Checkout
        const options = {
          key: key_id,
          amount: amount,
          currency: "INR",
          name: "PrepFree",
          description: "Plan Subscription",
          order_id: order_id,
          webview_intent: true,
          prefill: {
            name: prefill.name,
            email: prefill.email,
            contact: prefill.contact,
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI App",
                  instruments: [
                    { method: "upi", apps: ["google_pay", "phonepe", "paytm"] }
                  ]
                }
              },
              sequence: ["block.upi"],
              theme: {
                color: "#184852",
              },
            },
          },
          handler: async function (response: RazorpaySuccessResponse) {
            setLoading(true);
            try {
              // Verify Payment upon success
              const verifyRes = await api.post("/payments/verify-update-order", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                setSuccess(true);
                // Notify app on success
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ status: "SUCCESS" }));
                }
              } else {
                const msg = "Payment verification failed. Please contact support.";
                setError(msg);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ status: "FAILURE", message: msg }));
                }
              }
            } catch (err) {
              console.error("Verification error:", err);
              const msg = "Failed to verify payment with server.";
              setError(msg);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: "FAILURE", message: msg }));
              }
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setError("Payment was cancelled.");
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: "CANCELLED" }));
              }
            },
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on("payment.failed", function (response: RazorpayErrorResponse) {
          console.error(response.error);
          const msg = response.error.description || "Payment failed.";
          setError(msg);
          setLoading(false);
          // Notify app on failure
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: "FAILURE", message: msg }));
          }
        });

        // Open Razorpay automatically
        rzp.open();

      } catch (err: any) {
        console.error("Payment flow error:", err);
        const msg = err.response?.data?.message || err.message || "An error occurred initializing payment.";
        setError(msg);
        setLoading(false);
        // Notify app on error
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: "ERROR", message: msg }));
        }
      }
    };

    if (window.Razorpay) {
      initializePayment();
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
        <Loader2 className="w-12 h-12 text-[#184852] animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Processing Payment...</h2>
        <p className="text-gray-500 mt-2 text-sm">Please do not close this window.</p>
      </div>
    );
  }

  return null;
};

export default function MobilePaymentPage() {
  return (
    <main className="w-full min-h-screen bg-gray-50 relative">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="beforeInteractive"
      />

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 text-[#184852] animate-spin" />
        </div>
      }>
        <MobilePaymentContent />
      </Suspense>
    </main>
  );
}
