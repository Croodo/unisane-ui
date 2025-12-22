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
import { Stepper } from '../../ui/Stepper';

export const InvoiceDetail = ({ invoice, onEdit, onPrint, onRecordPayment }: any) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!invoice) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 text-stone-200">
       <div className="p-10 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Sales size={96} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Document</Typography>
          <Typography variant="bodyLarge" className="text-stone-300 font-bold uppercase tracking-tight mt-2 opacity-60">Pick a record to view full commercial audit</Typography>
       </div>
    </div>
  );

  const isTaxInvoice = invoice.id.startsWith('INV');
  const isQuotation = invoice.id.startsWith('QTN');

  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this Document and provide a 2-sentence summary. 
                  ID: ${invoice.id}. Party: ${invoice.party}. Date: ${invoice.date}. Amount: ₹${invoice.amount}. Status: ${invoice.status}.`,
        config: { systemInstruction: "You are a professional credit risk officer." }
      });
      setAiAnalysis(response.text || "Analysis complete. Document is compliant.");
    } catch (err) {
      setAiAnalysis("Unable to reach intelligence server.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-stone-50/50 animate-in fade-in duration-500 @container/invoice-detail pb-32">
      <EntityDetailHeader 
        id={invoice.id}
        title={invoice.party}
        subtitle={isTaxInvoice ? `Source: ${invoice.source || 'Direct'}` : 'Commercial Registry'}
        status={<Chip label={invoice.status} className={cn("h-6 text-[10px] font-black uppercase rounded-xs border-none px-3", invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')} />}
        actions={
          <>
            <Button variant="outlined" size="md" icon={<Icon symbol="print" size={20} />} onClick={onPrint} className="rounded-xs font-black bg-white">PRINT PDF</Button>
            
            {isTaxInvoice && invoice.status !== 'Paid' && (
                <Button variant="tonal" size="md" icon={<Icons.Money size={20} />} onClick={onRecordPayment} className="rounded-xs font-black">RECORD RECEIPT</Button>
            )}

            <Button variant="filled" size="md" icon={<Icons.Edit size={20} />} onClick={onEdit} className="rounded-xs shadow-2 font-black">EDIT DOC</Button>
          </>
        }
      />

      <div className="flex-1 p-6 @[800px]/invoice-detail:p-12 flex flex-col gap-10">
        
        {/* Transaction Stepper */}
        <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs shadow-sm">
           <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest mb-10 block">Lifecycle Protocol</Typography>
           <Stepper 
              activeStep={isTaxInvoice ? 3 : isQuotation ? 0 : 1}
              steps={[
                  { label: 'Quotation', description: 'Draft Issued' },
                  { label: 'Sales Order', description: 'Confirmed' },
                  { label: 'Challan', description: 'Movement' },
                  { label: 'Invoice', description: 'Tax Document' },
              ]}
           />
        </Card>

        {/* Intelligence Card */}
        <Card variant="filled" className="bg-stone-900 text-white p-8 @[900px]/invoice-detail:p-10 rounded-xs shadow-3 overflow-hidden relative group border-none">
            <div className="relative z-10 flex flex-col @[1000px]/invoice-detail:flex-row @[1000px]/invoice-detail:items-center justify-between gap-8">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                     <Icons.Terminal className="text-primary-container" size={22} />
                     <Typography variant="titleSmall" className="text-primary-container font-black uppercase tracking-[0.2em]">Compliance Intelligence</Typography>
                  </div>
                  {aiAnalysis ? (
                    <Typography variant="headlineSmall" className="text-stone-200 font-black italic border-l-4 border-primary-container pl-8 leading-snug">"{aiAnalysis}"</Typography>
                  ) : (
                    <Typography variant="titleMedium" className="text-stone-500 font-bold uppercase tracking-tight max-w-2xl">Execute automated document validation and credit risk analysis on this voucher.</Typography>
                  )}
               </div>
               <Button variant="tonal" size="lg" onClick={handleRunAiAnalysis} disabled={isAiLoading} className="bg-white/10 text-white border-none h-14 px-10 font-black tracking-widest text-[11px] hover:bg-white/20 shrink-0">
                 {isAiLoading ? 'VALIDATING...' : 'RUN VERIFICATION'}
               </Button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-full bg-primary/10 blur-3xl rounded-full translate-x-20 -translate-y-20 group-hover:bg-primary/20 transition-colors" />
        </Card>

        {/* Paper Mock - Enhanced for Industrial ERP */}
        <Card variant="elevated" className="w-full max-w-4xl mx-auto bg-white shadow-5 border-stone-200 rounded-none p-10 @[800px]/invoice-detail:p-16 flex flex-col gap-12">
            <div className="flex justify-between items-start border-b-4 border-stone-900 pb-10">
                <div className="flex flex-col gap-2">
                    <Typography variant="displaySmall" className="font-black text-stone-900 uppercase tracking-tighter">
                        {isTaxInvoice ? 'TAX INVOICE' : isQuotation ? 'QUOTATION' : 'SALES DOCUMENT'}
                    </Typography>
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-[0.3em]">Ledger Internal Snapshot</Typography>
                </div>
                <div className="text-right flex flex-col gap-1">
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest">Serial No.</Typography>
                    <Typography variant="titleLarge" className="font-black text-stone-800">{invoice.id}</Typography>
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest mt-4">Document Date</Typography>
                    <Typography variant="titleLarge" className="font-black text-stone-800">{invoice.date}</Typography>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-20">
                <div className="flex flex-col gap-4">
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest border-b border-stone-100 pb-2">Business Entity</Typography>
                    <div className="flex flex-col gap-1">
                        <Typography variant="titleLarge" className="font-black text-stone-900 uppercase leading-none">{invoice.party}</Typography>
                        <Typography variant="bodyLarge" className="text-stone-500 font-bold mt-2 uppercase leading-relaxed">
                            Dynasty Business Park, <br/>Andheri East, Mumbai, <br/>Maharashtra 400059
                        </Typography>
                        <span className="text-[10px] font-black text-primary mt-2">GSTIN: 27AAACE1234F1Z5</span>
                    </div>
                </div>
                <div className="flex flex-col gap-4 text-right">
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest border-b border-stone-100 pb-2">Issued At Hub</Typography>
                    <div className="flex flex-col gap-1">
                        <Typography variant="titleLarge" className="font-black text-stone-900 uppercase leading-none">Unisane Bhiwandi</Typography>
                        <Typography variant="bodyLarge" className="text-stone-500 font-bold mt-2 uppercase leading-relaxed">
                            Warehouse Hub WH001, <br/>Kalyan Rd, Bhiwandi, <br/>Thane 421302
                        </Typography>
                    </div>
                </div>
            </div>

            {/* Statutory Tax Breakdown Table */}
            {isTaxInvoice && (
                <div className="flex flex-col gap-3">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Statutory Tax Summary</Typography>
                    <div className="border border-stone-200 overflow-hidden">
                        <div className="grid grid-cols-5 bg-stone-50 border-b border-stone-200 p-3 text-[9px] font-black uppercase text-stone-500">
                            <span className="col-span-2">HSN / Description</span>
                            <span className="text-right">Taxable Val</span>
                            <span className="text-right">CGST / SGST</span>
                            <span className="text-right">Amount</span>
                        </div>
                        <div className="grid grid-cols-5 p-3 text-[10px] font-bold text-stone-700">
                            <span className="col-span-2">6802 - Granite Slab (Grey)</span>
                            <span className="text-right tabular-nums">₹{(invoice.amount * 0.82).toLocaleString()}</span>
                            <span className="text-right tabular-nums">18%</span>
                            <span className="text-right tabular-nums">₹{invoice.amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-10 bg-stone-900 text-white rounded-xs flex flex-col @[600px]/invoice-detail:flex-row justify-between items-center gap-8 shadow-2">
                <div className="flex flex-col">
                    <Typography variant="labelLarge" className="text-stone-500 font-black uppercase tracking-widest">Net Valuation</Typography>
                    <Typography variant="bodyLarge" className="text-emerald-400 font-black uppercase tracking-tighter mt-1">Snapshot Verified</Typography>
                </div>
                <Typography variant="displaySmall" className="font-black tabular-nums text-white">₹{invoice.amount.toLocaleString()}</Typography>
            </div>
        </Card>
      </div>
    </div>
  );
};