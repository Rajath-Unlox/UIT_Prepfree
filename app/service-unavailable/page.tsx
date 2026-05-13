"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const Page = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="bg-white shadow-md rounded-2xl p-8 max-w-md">
        <AlertTriangle className="w-16 h-16 text-[#184852] mx-auto mb-4" />
        <h1 className="text-3xl font-semibold mb-2">Service Unavailable</h1>
        <p className="text-gray-600 mb-6">
          Sorry, this service is not available right now. We're working to get
          everything back online soon.
        </p>

        <Link
          href="/"
          className="inline-block bg-[#184852] text-white px-6 py-3 rounded-xl"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default Page;
