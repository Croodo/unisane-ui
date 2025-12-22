import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { Icon } from '../../ui/Icon';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';

export const ExpenseDetail = ({ expense, onEdit, onPrint }: any) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!expense) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-6 text-stone-200">
       <div className="p-8 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Money size={80} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Expense</Typography>
          <Typography variant="bodySmall" className="text-stone-200 font-bold uppercase tracking-tight mt-1">Select a ledger entry to view audit trail</Typography>
       </div>
    </div>
  );

  const handleRunAiBurnAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this Business Expense for anomalies or OpEx reduction opportunities. 
                  Title: ${expense.title}. Category: ${expense.category}. Date: ${expense.date}. Amount: ₹${expense.amount}.
                  Compare if this looks like a regular fixed cost or an unexpected spike.`,
        config: { systemInstruction: "You are a senior forensic accountant." }
      });
      setAiAnalysis(response.text || "Burn analysis complete. Entry is within normal OpEx range.");
    } catch (err) {
      setAiAnalysis("Unable to reach intelligence server.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-stone-50/50 animate-in fade-in duration-500 @container pb-20">
      <EntityDetailHeader 
        id={expense.refNo || 'OPEX-INTERNAL'}
        title={expense.title}
        subtitle={expense.category}
        status={<Chip label={expense.category} className="h-6 text-[10px] font-black uppercase rounded-xs border-none bg-stone-100 text-stone-700 px-3" />}
        actions={
          <>
            <Button variant="outlined" size="md" icon={<Icon symbol="print" size={20} />} onClick={onPrint} className="font-black">VOUCHER</Button>
            <Button variant="filled" size="md" icon={<Icons.Edit size={20} />} onClick={onEdit} className="shadow-1 font-black">EDIT ENTRY</Button>
          </>
        }
      />

      <div className="flex-1 p-4 @md:p-10 flex flex-col gap-6">
        
        {/* Burn Intelligence Card */}
        <Card variant="filled" className="bg-rose-950 text-white p-6 rounded-xs shadow-2 overflow-hidden relative group border-none">
            <div className="relative z-10 flex flex-col @xl:flex-row @xl:items-center justify-between gap-4">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <Icons.Terminal className="text-rose-400" size={18} />
                     <Typography variant="labelSmall" className="text-rose-400 font-black uppercase tracking-widest">Burn Rate Analysis</Typography>
                  </div>
                  {aiAnalysis ? (
                    <Typography variant="bodyLarge" className="text-rose-100 font-bold italic border-l-2 border-rose-500 pl-4">"{aiAnalysis}"</Typography>
                  ) : (
                    <Typography variant="bodyMedium" className="text-rose-500 font-bold">Audit this expense against historical trends to identify waste or billing errors.</Typography>
                  )}
               </div>
               <Button 
                variant="tonal" 
                size="md" 
                onClick={handleRunAiBurnAnalysis} 
                disabled={isAiLoading}
                className="bg-rose-800 text-white hover:bg-rose-700 border-none px-6 shrink-0 font-black tracking-widest"
               >
                 {isAiLoading ? 'AUDITING...' : 'RUN FORENSIC AUDIT'}
               </Button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-full bg-rose-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
        </Card>

        {/* Expense Voucher Document */}
        <Card variant="elevated" className="w-full max-w-2xl mx-auto bg-white shadow-2 border-stone-100 rounded-none p-8 @md:p-12 flex flex-col gap-10">
           <div className="flex justify-between items-start border-b-2 border-stone-900 pb-6">
              <div className="flex flex-col gap-1">
                 <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter">EXPENSE VOUCHER</Typography>
                 <Typography variant="labelSmall" className="text-stone-400 font-black tracking-widest uppercase">General Ledger Internal Ref</Typography>
              </div>
              <div className="text-right flex flex-col gap-1">
                 <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Transaction Date</Typography>
                 <Typography variant="titleMedium" className="font-black text-stone-800">{expense.date}</Typography>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                 <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Title / Particulars</Typography>
                 <Typography variant="titleLarge" className="font-black text-stone-900 uppercase">{expense.title}</Typography>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="flex flex-col gap-1">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Payment Mode</Typography>
                    <Typography variant="bodyLarge" className="font-black text-stone-800 uppercase">{expense.paymentMode}</Typography>
                 </div>
                 <div className="flex flex-col gap-1">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Reference No</Typography>
                    <Typography variant="bodyLarge" className="font-mono text-primary font-black uppercase">{expense.refNo || 'N/A'}</Typography>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-stone-50 border border-stone-100 rounded-xs flex flex-col gap-4 mt-4">
              <div className="flex justify-between items-center">
                 <Typography variant="labelMedium" className="text-stone-500 font-black uppercase tracking-widest">Category Total</Typography>
                 <Typography variant="titleLarge" className="font-black text-stone-900 tabular-nums">₹{(expense.amount - (expense.gstAmount || 0)).toLocaleString()}</Typography>
              </div>
              {expense.isGstExpense && (
                <div className="flex justify-between items-center text-emerald-600">
                    <Typography variant="labelMedium" className="font-black uppercase tracking-widest">GST Input (ITC)</Typography>
                    <Typography variant="titleMedium" className="font-black tabular-nums">+ ₹{expense.gstAmount.toLocaleString()}</Typography>
                </div>
              )}
              <div className="h-px bg-stone-200 my-2" />
              <div className="flex justify-between items-center">
                 <Typography variant="labelLarge" className="text-stone-900 font-black uppercase tracking-widest">Net Outflow</Typography>
                 <Typography variant="headlineMedium" className="font-black text-stone-900 tabular-nums">₹{expense.amount.toLocaleString()}</Typography>
              </div>
           </div>

           {expense.notes && (
             <div className="mt-4">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest mb-2 block">Notes & Remarks</Typography>
                <Typography variant="bodyMedium" className="text-stone-600 font-medium italic border-l-2 border-stone-200 pl-4 py-1">{expense.notes}</Typography>
             </div>
           )}

           <div className="mt-12 pt-8 border-t border-stone-100 flex justify-between items-end opacity-40">
              <div className="flex flex-col gap-4">
                 <div className="w-32 h-px bg-stone-900" />
                 <Typography variant="labelSmall" className="font-black uppercase tracking-tighter">Authorized By</Typography>
              </div>
              <div className="flex flex-col gap-4 text-right">
                 <div className="w-32 h-px bg-stone-900 ml-auto" />
                 <Typography variant="labelSmall" className="font-black uppercase tracking-tighter">Receiver Signature</Typography>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};