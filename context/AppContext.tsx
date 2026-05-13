"use client";

import { createContext, useContext, useState } from "react";
import api from "@/lib/api";

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

  const showError = (msg: string) => setGlobalError(msg);
  const clearError = () => setGlobalError("");

  return (
    <AppContext.Provider
      value={{
        loading,
        globalError,
        startLoading,
        stopLoading,
        showError,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
