"use client";

import { Download } from "lucide-react";

export default function ExportPdfButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 rounded-lg text-xs font-semibold transition-colors print:hidden"
    >
      <Download className="h-3.5 w-3.5 text-slate-400" />
      <span>Export PDF</span>
    </button>
  );
}