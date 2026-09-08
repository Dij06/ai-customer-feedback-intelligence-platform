"use client";

import { Download } from "lucide-react";

export default function ExportPdfButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 print:hidden"
    >
      <Download className="h-4 w-4" />
      <span>Export PDF Report</span>
    </button>
  );
}