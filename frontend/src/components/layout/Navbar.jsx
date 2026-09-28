import React from 'react';
import { 
  Building2, 
  Bell, 
  ChevronDown, 
  ShieldCheck, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';

export default function Navbar({ onOpenDeviationsList, deviationsCount = 0 }) {
  const navItems = [
    { name: 'QMS', active: false },
    { name: 'Dashboard', active: false },
    { name: 'Deviations', active: true, count: deviationsCount },
    { name: 'CAPAs', active: false },
    { name: 'Change Control', active: false },
    { name: 'Audits', active: false },
    { name: 'Documents', active: false },
    { name: 'Reports', active: false },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M12 2L2 22h20L12 2z" strokeLinejoin="round"/>
                  <path d="M12 9v5m0 3h.01" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  AIVOA
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
                  AI for a Safer Tomorrow
                </span>
              </div>
            </div>
          </div>

          {/* Center: Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={item.name === 'Deviations' && onOpenDeviationsList ? onOpenDeviationsList : undefined}
                className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  item.active
                    ? 'text-blue-700 bg-blue-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <span>{item.name}</span>
                  {item.count > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.count}
                    </span>
                  )}
                </span>
                {item.active && (
                  <span className="absolute bottom-[-13px] left-3 right-3 h-[2.5px] bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Right: Company selector, Notifications & User profile */}
          <div className="flex items-center space-x-4">
            
            {/* Company Selector */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[180px]">Vasudha Pharma Chem Limited</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* Notification Bell */}
            <div className="relative p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold ring-2 ring-slate-100">
                MH
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
