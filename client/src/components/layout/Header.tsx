import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronDown, 
  Search, 
  User, 
  Building2, 
  FileText, 
  Settings, 
  HelpCircle 
} from "lucide-react";

export function Header() {
  return (
    <div className="flex flex-col w-full">
      {/* Top Bar - Teal Background */}
      <div className="bg-[#3A7D73] text-white px-6 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="text-2xl">🦛</span> hippo
            <span className="opacity-70 font-normal text-xs uppercase tracking-widest ml-1">Production</span>
          </div>
          
          <nav className="flex items-center gap-4 text-white/90">
            <a href="#" className="hover:text-white font-medium">Home</a>
            <button className="flex items-center gap-1 hover:text-white">Plans <ChevronDown className="h-3 w-3" /></button>
            <button className="flex items-center gap-1 hover:text-white">Carriers <ChevronDown className="h-3 w-3" /></button>
            <button className="flex items-center gap-1 hover:text-white">Reports <ChevronDown className="h-3 w-3" /></button>
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

      {/* Company Context Bar */}
      <div className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-3">
              Matt Morgan Design Inc.
              <span className="bg-[#D95D4E] text-white text-xs font-sans font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                CA | 2
              </span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-[#3A7D73] font-medium">
            <a href="#" className="hover:underline">go to panda ▸</a>
            <a href="#" className="hover:underline">become payroll admin ▸</a>
          </div>
        </div>

        <nav className="flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="pb-2 text-[#3A7D73] border-b-2 border-[#3A7D73]">Company</a>
          <a href="#" className="pb-2 hover:text-[#3A7D73]">Employees</a>
          <a href="#" className="pb-2 hover:text-[#3A7D73]">Employee Benefits</a>
          <a href="#" className="pb-2 hover:text-[#3A7D73]">Policies</a>
          <a href="#" className="pb-2 hover:text-[#3A7D73]">NPR & BoR</a>
          <a href="#" className="pb-2 hover:text-[#3A7D73]">Other</a>
        </nav>
      </div>
    </div>
  );
}
