"use client";
import React, { useState, useEffect, Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";
import OtpInput from "react-otp-input";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import HeroSlider from "@/components/HeroSlider";
import BU_Prepfree_logo from "@/public/UIT.webp";
import Prepfree_logo from "@/public/images/Prepfree_logo.png";
import Unlox_logo from "@/public/images/unlox_logo.svg";
import UIT_Hero from "@/public/images/Login_Signup_Heros/UIT College.webp"


const ForgotPasswordContent = () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

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

  const handleSendOTP = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${BACKEND_URL}/api/v1/auth/user/forgot-password/email`,
        { email },
      );
      toast.success("OTP sent to your email!");
      setStep("otp");
      setResendTimer(60);
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Failed to send OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setStep("reset");
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      toast.error(
        "Password must contain at least 1 uppercase letter, 1 number, and 1 special character",
      );
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/v1/auth/user/reset-password`, {
        otp,
        newPassword,
      });
      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to reset password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      setResendTimer(60);
      await axios.post(
        `${BACKEND_URL}/api/v1/auth/user/forgot-password/email`,
        { email },
      );
      toast.success("OTP resent to your email!");
    } catch (error) {
      setResendTimer(0);
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <>
      <Toaster position="top-right" containerStyle={{ zIndex: 9999 }} />
      <main className="font-creato bg-[#184852] w-full h-screen flex items-center justify-center text-white overflow-hidden relative">
        {/* Blurred Background Image */}
        {/* <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/images/Login_Signup_Heros/Prepfree_Post_My%20Interview.webp')",
                        filter: "blur(100px)",
                        transform: "scale(2)"
                    }}
                /> */}
        <div className="absolute inset-0 z-0 bg-[#184852]/70" />

        {/* Outer Card Wrapper with Shining Edge */}
        <div className="relative z-10 w-[1000px] max-w-[95vw] h-[600px] max-h-[95vh] p-[2px] rounded-[24px] overflow-hidden shadow-[0px_4px_24px_0px_rgba(24,72,82,0.32)] flex bg-[#184852]">
          {/* Spinning Gradient for Shining Edge */}
          <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-full h-full animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_120deg,#ffffff_180deg,transparent_180deg_300deg,#ffb8bf_360deg)]" />
          </div>

          {/* Actual Card Content */}
          <div className="relative z-10 w-full h-full flex rounded-[22px] overflow-hidden bg-gradient-to-t from-[#184852] via-[#f2825c] to-[#184852]">
            {/* Left Section */}
            <div className="w-1/2 flex flex-col items-center justify-center bg-white text-[#17383d] h-full p-8 relative">
              {step === "email" && (
                <div className="w-full h-full flex flex-col gap-8">
                  <div className="flex flex-row items-center gap-6">
                    <Image
                      src={BU_Prepfree_logo}
                      alt=""
                      className="w-12 mb-4"
                    />
                    <Image
                      src={Prepfree_logo}
                      alt=""
                      className=" h-6 w-auto mb-4"
                    />
                    <Image
                      src={Unlox_logo}
                      alt=""
                      className="h-6 w-auto mb-4"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-medium mt-4">
                      Forgot Password?
                    </h1>
                    <p className="text-xs text-gray-600">
                      Enter your email address and we'll send you an OTP to
                      reset your password.
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-6 ">
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-xs">Email*</label>
                      <input
                        type="email"
                        placeholder="ex. email@domain.com"
                        className="bg-[#f7fbfa] border border-[#cfe3e0] py-2 px-2 rounded-sm text-[#17383d] text-xs outline-none focus:border-[#f2825c]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full bg-[#f2825c] text-white font-medium py-3 text-xs flex items-center justify-center rounded-sm mt-4 hover:bg-[#184852] transition"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <p className="text-sm text-center font-medium mt-4">
                    Remember your password?{" "}
                    <Link href="/login" className="text-[#184852]">
                      Login
                    </Link>
                  </p>
                </div>
              )}

              {step === "otp" && (
                <div className="w-full h-full flex flex-col gap-8">
                  <div className="flex flex-row items-center gap-6">
                    <Image
                      src={BU_Prepfree_logo}
                      alt=""
                      className="w-12 mb-4"
                    />
                    <Image
                      src={Prepfree_logo}
                      alt=""
                      className=" h-6 w-auto mb-4"
                    />
                    <Image
                      src={Unlox_logo}
                      alt=""
                      className="h-6 w-auto mb-4"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-medium mt-4">Verify OTP</h1>
                    <p className="text-xs text-gray-600">
                      We've sent a 6-digit verification code to{" "}
                      <span className="text-[#184852] font-medium">
                        {email}
                      </span>
                    </p>
                  </div>

                  <div className="w-full flex flex-col items-center justify-center">
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      numInputs={6}
                      renderInput={(props) => (
                        <input
                          {...props}
                          className="border mr-2 text-2xl rounded-sm flex items-center justify-center !w-10 h-14"
                        />
                      )}
                    />
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    className="w-full bg-[#f2825c] text-white font-medium py-3 text-xs flex items-center justify-center rounded-sm mt-6 hover:bg-[#184852] transition"
                  >
                    Verify OTP
                  </button>

                  <p className="text-center mt-4 text-xs text-gray-500">
                    {resendTimer > 0 ? (
                      <span className="text-gray-400">
                        Resend OTP in{" "}
                        <span className="text-[#184852] font-bold">
                          {resendTimer}s
                        </span>
                      </span>
                    ) : (
                      <p
                        className="text-sm text-center font-medium mt-4 cursor-pointer"
                        onClick={handleResendOTP}
                      >
                        Didn't receive code?{" "}
                        <b className="text-[#184852]">Resend</b>
                      </p>
                    )}

                    <button
                      onClick={() => setStep("email")}
                      className="text-[#184852] text-xs mt-2 hover:underline"
                    >
                      ← Change email
                    </button>
                  </p>
                </div>
              )}

              {step === "reset" && (
                <div className="w-full h-full flex flex-col gap-8">
                  <Image src={BU_Prepfree_logo} alt="" className="mt-4" />

                  <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-medium mt-4">Reset Password</h1>
                    <p className="text-xs text-gray-600">
                      Create a new password for your account.
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-6 ">
                    <div className="flex flex-col gap-1 relative">
                      <label className="font-medium text-xs">
                        New Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="bg-[#f7fbfa] border border-[#cfe3e0] py-2 px-2 text-xs rounded-sm text-[#17383d] w-full pr-10 outline-none focus:border-[#f2825c]"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 relative">
                      <label className="font-medium text-xs">
                        Confirm Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="bg-[#f7fbfa] border border-[#cfe3e0] py-2 px-2 text-xs rounded-sm text-[#17383d] w-full pr-10 outline-none focus:border-[#f2825c]"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 mt-2">
                    Password must be at least 8 characters with 1 uppercase
                    letter, 1 number, and 1 special character.
                  </p>

                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full bg-[#f2825c] text-white font-medium py-3 text-xs flex items-center justify-center rounded-sm mt-4 hover:bg-[#184852] transition"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
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

              <Image src={UIT_Hero} alt="" className="w-full h-full object-cover object-center" />

            </div>
          </div>
        </div>
      </main>
    </>
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
      <ForgotPasswordContent />
    </Suspense>
  );
};

export default Page;
