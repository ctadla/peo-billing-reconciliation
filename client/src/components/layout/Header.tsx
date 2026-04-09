import { useState } from "react";
import { useLocation } from "wouter";
import {
  ChevronDown,
  Search,
  User,
  Building2,
} from "lucide-react";

interface HeaderProps {
  activePage?: "company" | "peo-billing";
}

export function Header({ activePage = "company" }: HeaderProps) {
  const [, navigate] = useLocation();
  const [reportsOpen, setReportsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <div className="bg-[#1c1c1c] text-white px-6 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="font-extrabold">Premium Auditor</span>
            <span className="opacity-70 font-normal text-xs uppercase tracking-widest ml-1">Production</span>
          </div>

          <nav className="flex items-center gap-4 text-white/90">
            <a href="#" className="hover:text-white font-medium">Home</a>
            <button className="flex items-center gap-1 hover:text-white">Plans <ChevronDown className="h-3 w-3" /></button>
            <button className="flex items-center gap-1 hover:text-white">Carriers <ChevronDown className="h-3 w-3" /></button>
            <div className="relative">
              <button
                className="flex items-center gap-1 hover:text-white"
                onClick={() => setReportsOpen(!reportsOpen)}
                onBlur={() => setTimeout(() => setReportsOpen(false), 150)}
                data-testid="nav-reports"
              >
                Reports <ChevronDown className="h-3 w-3" />
              </button>
              {reportsOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white text-slate-800 rounded-md shadow-lg border border-slate-200 py-1 min-w-[200px] z-50">
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate("/peo-billing");
                      setReportsOpen(false);
                    }}
                    data-testid="nav-peo-billing"
                  >
                    <Building2 className="h-4 w-4 text-[#0a8080]" />
                    PEO Billing
                  </button>
                </div>
              )}
            </div>
            <button className="flex items-center gap-1 hover:text-white">Configuration <ChevronDown className="h-3 w-3" /></button>
            <button className="flex items-center gap-1 hover:text-white">TAdA partner <ChevronDown className="h-3 w-3" /></button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/10 rounded overflow-hidden border border-white/20">
            <button className="px-3 py-1.5 flex items-center gap-2 hover:bg-white/20 transition-colors border-r border-white/20">
              Company <ChevronDown className="h-3 w-3" />
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Use company name to search..."
                className="bg-transparent border-none text-white placeholder:text-white/60 px-3 py-1.5 w-64 focus:outline-none focus:ring-0"
              />
              <Search className="absolute right-2 top-1.5 h-4 w-4 text-white/60" />
            </div>
          </div>
          <button className="p-1.5 hover:bg-white/10 rounded-full">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      {activePage === "company" && (
        <div className="bg-white border-b border-border px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                <Building2 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-sans font-bold text-slate-800 flex items-center gap-3">
                Matt Morgan Design Inc.
                <span className="bg-[#D95D4E] text-white text-xs font-sans font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  CA | 2
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#0a8080] font-medium">
              <a href="#" className="hover:underline">go to panda ▸</a>
              <a href="#" className="hover:underline">become payroll admin ▸</a>
            </div>
          </div>

          <nav className="flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="pb-2 text-[#0a8080] border-b-2 border-[#0a8080]">Company</a>
            <a href="#" className="pb-2 hover:text-[#0a8080]">Employees</a>
            <a href="#" className="pb-2 hover:text-[#0a8080]">Employee Benefits</a>
            <a href="#" className="pb-2 hover:text-[#0a8080]">Policies</a>
            <a href="#" className="pb-2 hover:text-[#0a8080]">NPR & BoR</a>
            <a href="#" className="pb-2 hover:text-[#0a8080]">Other</a>
          </nav>
        </div>
      )}
    </div>
  );
}
