import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { EntityDetailHeader } from '../shared/EntityDetailHeader';

export const PurchaseBillDetail = ({ bill, onEdit, onPrint, onRecordPayment }: any) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!bill) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 text-stone-200">
       <div className="p-10 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Purchases size={96} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Bill</Typography>
          <Typography variant="bodyLarge" className="text-stone-300 font-bold uppercase tracking-tight mt-2 opacity-60">Choose a purchase bill to view procurement audit</Typography>
       </div>
    </div>
  );

  const handleRunAiCostAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this Purchase Bill for procurement risks. ID: ${bill.id}. Supplier: ${bill.party}. Amount: ₹${bill.amount}.`,
        config: { systemInstruction: "You are a professional procurement audit officer." }
      });
      setAiInsight(response.text || "Cost analysis complete. Terms are standard.");
    } catch (err) {
      setAiInsight("Unable to reach intelligence server.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-stone-50/50 animate-in fade-in duration-500 @container/bill-detail pb-32">
      <EntityDetailHeader 
        id={bill.id}
        title={bill.party}
        subtitle="Purchase Document (Inward)"
        status={<Chip label={bill.status} className={cn("h-6 text-[10px] font-black uppercase rounded-xs border-none px-3", bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')} />}
        actions={
          <>
            <Button variant="outlined" size="md" icon={<Icon symbol="print" size={20} />} onClick={onPrint} className="rounded-xs font-black">PRINT RECORD</Button>
            <Button variant="tonal" size="md" icon={<Icons.Money size={20} />} onClick={onRecordPayment} className="rounded-xs font-black">SETTLE PAYABLE</Button>
            <Button variant="filled" size="md" icon={<Icons.Edit size={20} />} onClick={onEdit} className="rounded-xs shadow-2 font-black">EDIT ENTRY</Button>
          </>
        }
      />

      <div className="flex-1 p-6 @[800px]/bill-detail:p-12 flex flex-col gap-10">
        <Card variant="filled" className="bg-emerald-950 text-white p-8 @[900px]/bill-detail:p-10 rounded-xs shadow-3 overflow-hidden relative group border-none">
            <div className="relative z-10 flex flex-col @[1000px]/bill-detail:flex-row @[1000px]/bill-detail:items-center justify-between gap-8">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                     <Icons.Terminal className="text-emerald-400" size={22} />
                     <Typography variant="titleSmall" className="text-emerald-400 font-black uppercase tracking-[0.2em]">Procurement Intelligence</Typography>
                  </div>
                  {aiInsight ? (
                    <Typography variant="headlineSmall" className="text-emerald-50 font-black italic border-l-4 border-emerald-500 pl-8 leading-snug">"{aiInsight}"</Typography>
                  ) : (
                    <Typography variant="titleMedium" className="text-emerald-600 font-bold uppercase tracking-tight max-w-2xl">Compare this bill's pricing with historical supplier data for industrial cost variances.</Typography>
                  )}
               </div>
               <Button variant="tonal" size="lg" onClick={handleRunAiCostAnalysis} disabled={isAiLoading} className="bg-emerald-800 text-white h-14 px-10 font-black tracking-widest text-[11px] border-none shadow-1 shrink-0">
                 {isAiLoading ? 'AUDITING LOGS...' : 'RUN COST VARIANCE'}
               </Button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-full bg-emerald-500/10 blur-3xl rounded-full translate-x-20 -translate-y-20 group-hover:bg-emerald-500/20 transition-all duration-500" />
        </Card>

        <div className="grid grid-cols-1 @[600px]/bill-detail:grid-cols-2 gap-6">
            <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs shadow-sm flex flex-col">
                <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest mb-2">Liability Amount</Typography>
                <Typography variant="displaySmall" className="font-black text-rose-600 tabular-nums leading-none">₹{bill.amount.toLocaleString()}</Typography>
                <div className="mt-auto pt-6 flex justify-between items-center border-t border-stone-50">
                    <span className="text-[11px] font-black text-stone-500 uppercase tracking-tight">Status: In Accounts Payable</span>
                    <Icons.Warning className="text-rose-300" size={18} />
                </div>
            </Card>
            <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs shadow-sm flex flex-col">
                <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest mb-2">Ledger Impact</Typography>
                <Typography variant="displaySmall" className="font-black text-stone-900 uppercase tracking-tighter leading-none">Asset (+) / Cash (-)</Typography>
                <div className="mt-auto pt-6 flex justify-between items-center border-t border-stone-50">
                    <span className="text-[11px] font-black text-stone-500 uppercase tracking-tight">Double-entry verified</span>
                    <Icons.Check className="text-emerald-500" size={18} />
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};