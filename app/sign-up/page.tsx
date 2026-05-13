"use client";
import React, { useState, useEffect, Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";
import OtpInput from "react-otp-input";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import BU_Prepfree_logo from "@/public/UIT.webp";
import Prepfree_logo from "@/public/images/Prepfree_logo.png";
import Unlox_logo from "@/public/images/unlox_logo.svg";
import HeroSlider from "@/components/HeroSlider";

const SignUpContent = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("signup"); // "signup" | "verify"
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Timer State
  const [resendTimer, setResendTimer] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    country_code: "+91",
    password: "",
  });

  // Handle Redirect from Login (for unverified users)
  useEffect(() => {
    const view = searchParams.get("view");
    const emailParam = searchParams.get("email");

    if (view === "verify" && emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
      setStep("verify");
      toast("Please verify your email to continue.");
    }
  }, [searchParams]);

  // Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${BACKEND_URL}/api/v1/auth/register`,
        formData,
      );
      toast.success("Account created! Verification code sent to email.");
      setStep("verify");
      setResendTimer(60); // Start timer immediately after signup
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      // Default to top-level message
      let message = data?.message || error.message || "Signup failed!";

      // Check if specific validation errors exist in the response
      if (
        data?.errors &&
        Array.isArray(data.errors) &&
        data.errors.length > 0
      ) {
        // Use the message from the first validation error
        message = data.errors[0].message;
      }

      if (
        status === 400 &&
        (message === "Email already in use" ||
          message === "Email already exists")
      ) {
        toast.error("Account already exists. Please Login.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND_URL}/api/v1/auth/verify/email`, {
        email: formData.email,
        otp: otp.trim(),
      });
      const data = res.data;
      if (data.accessToken) {
        localStorage.setItem("data", JSON.stringify(data));
        localStorage.setItem("token", data.accessToken);
        toast.success("Email verified! Logging you in...");
        router.push("/dashboard/profile");
      } else {
        toast.success("Verified! Please login.");
        router.push("/login");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Verification failed! Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return; // Prevent clicking if timer is active

    try {
      if (!formData.email) {
        toast.error("Email is missing!");
        return;
      }

      // Start cooldown immediately to prevent double-clicks
      setResendTimer(60);

      await axios.post(`${BACKEND_URL}/api/v1/auth/resend-otp`, {
        email: formData.email,
      });
      toast.success("Verification code resent!");
    } catch (error) {
      setResendTimer(0); // Reset timer on failure so they can try again
      toast.error("Failed to resend code. Please try again later.");
    }
  };

  return (
    <main className="font-creato bg-[#184852] w-full h-screen flex items-center justify-center text-white overflow-hidden relative">
      {/* Blurred Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: "linear-gradient(135deg, #184852, #f2825c, #f7fbfa)",
          filter: "blur(90px)",
          transform: "scale(1.6)",
        }}
      />

      <Toaster position="top-right" />
      {/* Outer Card Wrapper with Shining Edge */}
      <div className="relative z-10 w-[1000px] max-w-[95vw] h-[600px] max-h-[95vh] p-[2px] rounded-[24px] overflow-hidden shadow-[0px_4px_24px_0px_rgba(24,72,82,0.32)] flex bg-[#184852]">
        {/* Spinning Gradient for Shining Edge */}
        <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-full h-full animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_120deg,#ffffff_180deg,transparent_180deg_300deg,#ffb8bf_360deg)]" />
        </div>

        {/* Actual Card Content */}
        <div className="relative z-10 w-full h-full flex rounded-[22px] overflow-hidden bg-gradient-to-t from-[#184852] via-[#f2825c] to-[#184852]">
          <div className="w-1/2 flex flex-col items-center justify-center bg-white text-[#17383d] h-full p-8 relative">
            {step === "signup" && (
              <div className="w-full h-full flex flex-col gap-4">
                <div className="flex flex-row items-center gap-6">
                  <Image src={BU_Prepfree_logo} alt="" className="w-12" />
                  <Image src={Prepfree_logo} alt="" className=" h-6 w-auto" />
                  <Image src={Unlox_logo} alt="" className="h-6 w-auto" />
                </div>

                <div className="flex flex-col gap-2">
                  <h1 className="text-xl font-medium mt-2">Sign Up</h1>
                  <p className="text-xs">
                    Empower your experience, sign up for a free account today
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-xs">Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter Your Name"
                      className="bg-[#f7fbfa] border border-[#cfe3e0] py-2 px-2 rounded-sm text-[#17383d] text-xs outline-none focus:border-[#f2825c]"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-xs">Email*</label>
                    <input
                      type="text"
                      name="email"
                      placeholder="ex. email@domain.com"
                      className="bg-[#f7fbfa] border border-[#cfe3e0] py-2 px-2 rounded-sm text-[#17383d] text-xs outline-none focus:border-[#f2825c]"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-xs">Phone Number*</label>
                    <div className="flex items-center bg-white rounded-sm overflow-hidden">
                      <select
                        name="country_code"
                        className="bg-[#f7fbfa] text-[#17383d] text-xs py-2 px-2 outline-none border-r border-[#cfe3e0]"
                        value={formData.country_code}
                        onChange={handleChange}
                      >
                        <option value="+91">+91</option>
                      </select>
                      <input
                        type="text"
                        name="phone_number"
                        placeholder="Enter Phone Number"
                        className="bg-[#f7fbfa] flex-1 py-2 px-2 text-[#17383d] outline-none text-xs focus:bg-white"
                        value={formData.phone_number}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 relative">
                    <label className="font-medium text-sm">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter Password"
                        className="bg-[#f7fbfa] border border-[#cfe3e0] py-2 px-2 rounded-sm text-[#17383d] w-full pr-10 outline-none focus:border-[#f2825c]"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px]">
                  By registering for an account, you are consenting to our{" "}
                  <a className="text-[#184852] underline">Terms of Service</a>{" "}
                  and confirming that you have reviewed and accepted the{" "}
                  <span className="text-[#184852]">
                    Global Privacy Statement
                  </span>
                  .
                </p>

                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full bg-[#f2825c] text-xs text-white font-medium py-3 flex items-center justify-center rounded-xl mt-2 hover:bg-[#184852] transition"
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </button>

                <p className="text-xs text-center">
                  Already have an account?{" "}
                  <a href="/login" className="text-[#184852] underline">
                    Login
                  </a>
                </p>
              </div>
            )}

            {step === "verify" && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl font-medium text-center mt-2">
                    Verify Email
                  </h1>
                  <p className="text-xs text-center text-gray-600">
                    We've sent a 6-digit verification code to <br />
                    <span className="text-[#184852] font-medium">
                      {formData.email}
                    </span>
                  </p>
                </div>
                <div className="w-full flex items-center justify-center mt-2">
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    renderInput={(props) => (
                      <input
                        {...props}
                        className="border mr-2 text-3xl rounded-sm flex items-center justify-center w-10 h-14"
                      />
                    )}
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full bg-[#f2825c] py-4 flex items-center text-white justify-center rounded-full mt-6 hover:bg-[#184852] transition"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>

                {/* RESEND LOGIC */}
                <p className="text-center mt-4 text-xs text-gray-500">
                  {resendTimer > 0 ? (
                    <span className="text-gray-400">
                      Resend code in{" "}
                      <span className="text-[#184852] font-bold">
                        {resendTimer}s
                      </span>
                    </span>
                  ) : (
                    <span
                      className="cursor-pointer hover:text-[#17383d] hover:underline transition-all"
                      onClick={handleResendOTP}
                    >
                      Didn't receive code?{" "}
                      <b className="text-[#184852]">Resend</b>
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="w-1/2 h-full flex flex-col relative items-start overflow-hidden">
            {/* <h1 className="text-lg font-medium w-full z-10">
            "Every career begins with one step.
            <br />
            Start yours with clarity, confidence, and the right tools."
          </h1> */}

            <div className="w-full h-full">
              <HeroSlider />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const Page = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center text-white bg-[#184852]">
          Loading...
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
};

export default Page;
