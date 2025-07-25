"use client";

import React, { useEffect, useState, useContext, createContext } from "react";

// Context for Together API Key
const TogetherApiKeyContext = createContext<
  | {
      apiKey: string | undefined;
      setApiKey: (key: string | undefined) => void;
    }
  | undefined
>(undefined);

export function TogetherApiKeyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [apiKey, setApiKeyState] = useState<string | undefined>(undefined);

  useEffect(() => {
    setApiKeyState(sessionStorage.getItem("togetherApiKey") || undefined);
  }, []);

  // Sync to sessionStorage and notify listeners
  const setApiKey = (key: string | undefined) => {
    setApiKeyState(key);
    if (key) {
      sessionStorage.setItem("togetherApiKey", key);
    } else {
      sessionStorage.removeItem("togetherApiKey");
    }
  };

  return (
    <TogetherApiKeyContext.Provider value={{ apiKey, setApiKey }}>
      {children}
    </TogetherApiKeyContext.Provider>
  );
}

export function useTogetherApiKey() {
  const context = useContext(TogetherApiKeyContext);
  if (!context) {
    throw new Error(
      "useTogetherApiKey must be used within a TogetherApiKeyProvider"
    );
  }
  return context;
}
