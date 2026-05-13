"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Image from "next/image";
import BU_Prepfree_logo from "@/public/UIT.webp";
import Prepfree_logo from "@/public/images/Prepfree_logo.png";
import Unlox_logo from "@/public/images/unlox_logo.svg";
import HeroSlider from "@/components/HeroSlider";
import UIT_Hero from "@/public/images/Login_Signup_Heros/UIT College.webp";

const Page = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  const getSubdomain = () => {
    if (typeof window === "undefined") return "";
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    if (parts.length >= 2) return parts[0];
    return parts[0];
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const currentSubdomain = getSubdomain();
      const payload = {
        ...formData,
        subdomain: currentSubdomain,
      };

      const res = await api.post(`/auth/login`, payload);
      const data = res.data;

      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        api.defaults.headers.common["Authorization"] =
          `Bearer ${data.accessToken}`;

        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      const data = error.response?.data;

      let message = data?.message || error.message || "Login failed!";

      if (
        data?.errors &&
        Array.isArray(data.errors) &&
        data.errors.length > 0
      ) {
        message = data.errors[0].message;
      }

      // HANDLE UNVERIFIED REDIRECT
      if (data?.error_code === "EMAIL_NOT_VERIFIED") {
        toast.error("Email not verified! Redirecting...");
        // Redirect to sign-up page with verify mode
        setTimeout(() => {
          router.push(
            `/sign-up?view=verify&email=${encodeURIComponent(data.email)}`,
          );
        }, 1500);
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
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

      <Toaster position="top-right" />

      {/* Outer Card Wrapper with Shining Edge */}
      <div className="relative z-10 w-[1000px] max-w-[95vw] h-[600px] max-h-[95vh] p-[2px] rounded-[24px] overflow-hidden shadow-[0px_4px_24px_0px_rgba(24,72,82,0.32)] flex bg-[#184852]">
        {/* Spinning Gradient for Shining Edge */}
        <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-full h-full animate-[spin_7s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_120deg,#ffffff_180deg,transparent_180deg_300deg,#ffb8bf_360deg)]" />
        </div>

        {/* Actual Card Content */}
        <div className="relative z-10 w-full h-full flex rounded-[22px] overflow-hidden bg-gradient-to-t from-[#184852] via-[#f2825c] to-[#184852]">
          {/* Left Section */}
          <div className="w-1/2 flex flex-col items-center justify-center bg-white text-[#17383d] h-full p-8 relative">
            <div className="w-full h-full flex flex-col gap-8">
              <div className="flex flex-row items-center gap-6">
                <Image src={BU_Prepfree_logo} alt="" className="w-12 mb-4" />
                <Image
                  src={Prepfree_logo}
                  alt=""
                  className=" h-6 w-auto mb-4"
                />
                <Image src={Unlox_logo} alt="" className="h-6 w-auto mb-4" />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-medium mt-4">Welcome back!</h1>
                <p className="text-xs">
                  Enter Email address and password to log in.
                </p>
              </div>

              <div className="w-full flex flex-col gap-6 ">
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

                <div className="flex flex-col gap-1 relative">
                  <label className="font-medium text-xs">Password*</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter Password"
                      className="bg-[#f7fbfa] border border-[#cfe3e0] py-2 px-2 text-xs rounded-sm text-[#17383d] w-full pr-10 outline-none focus:border-[#f2825c]"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-[#184852] text-xs font-medium hover:underline cursor-pointer"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#f2825c] text-white font-medium py-3 text-sm flex items-center justify-center rounded-sm mt-2 hover:bg-[#184852] transition"
              >
                {loading ? "Logging In..." : "Log In"}
              </button>

              {/* <p className="text-xs text-center font-medium">
                Don’t have an account?{" "}
                <Link href="/sign-up" className="text-[#184852] ">
                  Sign Up
                </Link>
              </p> */}
            </div>
          </div>

          {/* Right Section */}
          <div className="w-1/2 h-full flex flex-col relative items-start overflow-hidden">
            {/* <h1 className="text-lg font-medium w-full z-10">
            “Every career begins with one step.
            <br />
            Start yours with clarity, confidence, and the right tools.”
          </h1> */}

            <Image src={UIT_Hero} alt="" className="w-full h-full object-cover object-center" />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
