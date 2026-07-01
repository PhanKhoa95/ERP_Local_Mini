import React, { createContext, useContext, useState, useEffect } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export type DatePreset = "all" | "today" | "this-month" | "last-30-days" | "last-90-days" | "this-year" | "custom";

interface GlobalDateFilterContextType {
  startDate: string;
  endDate: string;
  activePreset: DatePreset;
  setCustomRange: (start: string, end: string) => void;
  selectPreset: (preset: DatePreset) => void;
}

const GlobalDateFilterContext = createContext<GlobalDateFilterContextType | undefined>(undefined);

export const GlobalDateFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePreset, setActivePreset] = useState<DatePreset>(() => {
    return (localStorage.getItem("erp-global-date-preset") as DatePreset) || "this-month";
  });
  
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const calculateDates = (preset: DatePreset) => {
    const today = new Date();
    switch (preset) {
      case "today":
        setStartDate(format(today, "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "this-month":
        setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
      case "last-30-days":
        setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "last-90-days":
        setStartDate(format(subDays(today, 90), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "this-year":
        setStartDate(format(startOfYear(today), "yyyy-MM-dd"));
        setEndDate(format(endOfYear(today), "yyyy-MM-dd"));
        break;
      case "all":
      default:
        setStartDate("");
        setEndDate("");
        break;
    }
  };

  useEffect(() => {
    if (activePreset !== "custom") {
      calculateDates(activePreset);
    } else {
      const storedStart = localStorage.getItem("erp-global-date-start") || "";
      const storedEnd = localStorage.getItem("erp-global-date-end") || "";
      setStartDate(storedStart);
      setEndDate(storedEnd);
    }
  }, [activePreset]);

  const selectPreset = (preset: DatePreset) => {
    setActivePreset(preset);
    localStorage.setItem("erp-global-date-preset", preset);
  };

  const setCustomRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setActivePreset("custom");
    localStorage.setItem("erp-global-date-preset", "custom");
    localStorage.setItem("erp-global-date-start", start);
    localStorage.setItem("erp-global-date-end", end);
  };

  return (
    <GlobalDateFilterContext.Provider value={{ startDate, endDate, activePreset, selectPreset, setCustomRange }}>
      {children}
    </GlobalDateFilterContext.Provider>
  );
};

export const useGlobalDateFilter = () => {
  const context = useContext(GlobalDateFilterContext);
  if (!context) {
    throw new Error("useGlobalDateFilter must be used within a GlobalDateFilterProvider");
  }
  return context;
};
