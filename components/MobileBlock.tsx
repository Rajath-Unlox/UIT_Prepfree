"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Monitor, TabletSmartphone } from "lucide-react";
import Image from "next/image";
import BU_Prepfree_logo from "@/public/images/BU_Prepfree_logo.svg";

export default function MobileBlock() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!mounted) return null;
  if (pathname === "/mobile-payment") return null;
  if (!isMobile) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "linear-gradient(to bottom, #184852, #184852)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "var(--font-geist-sans), sans-serif",
      }}
    >
      {/* White card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          width: "100%",
          maxWidth: "320px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        {/* Logo */}
        <Image
          src={BU_Prepfree_logo}
          alt="Prepfree"
          style={{ width: "190px", height: "auto" }}
        />

        {/* Divider */}
        <div
          style={{
            width: "40px",
            height: "3px",
            backgroundColor: "#184852",
            borderRadius: "2px",
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "14px",
            backgroundColor: "#f7fbfa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TabletSmartphone size={32} color="#184852" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1
          style={{
            color: "#17383d",
            fontSize: "1.15rem",
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Quick heads up!
        </h1>

        {/* Body */}
        <p
          style={{
            color: "#58757a",
            fontSize: "0.85rem",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Prepfree Web Portal is optimized for larger screens. Kindly use the Prepfree app for the best experience.
        </p>

        {/* Download App Section */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #E5E7EB",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Experience more on our app
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <a
              href="https://play.google.com/store/apps/details?id=com.unlox.prepfree"
              target="_blank"
              rel="noopener noreferrer"
              style={{ transition: "transform 0.2s" }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play"
                style={{ height: "32px", width: "auto" }}
              />
            </a>
            <a
              href="https://apps.apple.com/app/unlox-prepfree"
              target="_blank"
              rel="noopener noreferrer"
              style={{ transition: "transform 0.2s" }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="Download on the App Store"
                style={{ height: "32px", width: "auto" }}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
