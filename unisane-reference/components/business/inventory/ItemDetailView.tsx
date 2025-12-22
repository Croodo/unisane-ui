import React, { useState, useLayoutEffect } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/Tabs';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';
import { Icon } from '../../ui/Icon';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';
import { LabelPrintWizard } from './LabelPrintWizard';

export const ItemDetailView = ({ item, warehouses, onAdjust, onTransfer, onEdit }: any) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isLabelWizardOpen, setIsLabelWizardOpen] = useState(false);

  useLayoutEffect(() => {
    const scrollViewport = document.getElementById('detail-scroll-viewport');
    if (scrollViewport) scrollViewport.scrollTop = 0;
    setAiInsight(null);
  }, [item?.id]);

  if (!item) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 text-stone-200">
       <div className="p-10 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Inventory size={96} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Item</Typography>
          <Typography variant="bodyLarge" className="text-stone-300 font-bold uppercase tracking-tight mt-2 opacity-60">Pick an item from the master list to view audit</Typography>
       </div>
    </div>
  );

  const totalStock = Object.values(item.warehouseStock).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number;
  const isLowStock = totalStock < (item.minStock || 0);

  const handleGenerateAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this inventory item and provide 2 bullet points for business strategy. 
                  Item: ${item.name}. Stock: ${totalStock}. Min: ${item.minStock}. Category: ${item.category}.`,
        config: { systemInstruction: "You are a professional inventory analyst." }
      });
      setAiInsight(response.text || "Status: Optimal.");
    } catch (error) {
      setAiInsight("Intelligence service offline.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-full bg-white animate-in fade-in duration-500 relative @container/item-detail">
      <EntityDetailHeader 
        id={item.id}
        title={item.name}
        subtitle={item.category}
        avatar={<img src={item.imageUrl} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" alt={item.name} />}
        actions={
          <>
            <Button variant="outlined" size="md" icon={<Icons.Adjust size={20} />} onClick={onAdjust} className="font-black">ADJUST</Button>
            <Button variant="filled" size="md" icon={<Icons.Edit size={20} />} onClick={onEdit} className="shadow-2 font-black">EDIT REGISTRY</Button>
          </>
        }
        tabs={
          <TabsList className="bg-transparent border-none p-0 h-auto gap-10 justify-start">
            <TabsTrigger value="summary" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">OVERVIEW</TabsTrigger>
            <TabsTrigger value="stock" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">DISTRIBUTION</TabsTrigger>
            {(item.trackBatch || item.trackSerial) && (
                <TabsTrigger value="trace" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">TRACEABILITY</TabsTrigger>
            )}
            <TabsTrigger value="history" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">AUDIT TRAIL</TabsTrigger>
          </TabsList>
        }
      />

      <div className="p-6 @[800px]/item-detail:p-10 flex flex-col gap-10 pb-32 flex-1">
          <TabsContent value="summary" className="mt-0 space-y-12">
              <div className="grid grid-cols-1 @[600px]/item-detail:grid-cols-2 @[900px]/item-detail:grid-cols-3 gap-6">
                <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs flex flex-col hover:border-primary/40 transition-colors shadow-sm">
                   <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest mb-2">Net Balance</Typography>
                   <Typography variant="displaySmall" className={cn("font-black tracking-tighter leading-none", isLowStock ? "text-error" : "text-stone-900")}>
                      {totalStock} <span className="text-sm uppercase text-stone-400 font-black ml-1">{item.unit}</span>
                   </Typography>
                   <div className="mt-6 flex flex-col gap-2">
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                         <div className={cn("h-full transition-all duration-1000", isLowStock ? "bg-error" : "bg-primary")} style={{ width: `${Math.min(100, (totalStock/item.minStock)*100)}%` }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-stone-500 uppercase tracking-tight">Safety Threshold: {item.minStock}</span>
                        {isLowStock && <span className="text-[10px] font-black text-error animate-pulse uppercase">Critical</span>}
                      </div>
                   </div>
                </Card>

                <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs flex flex-col hover:border-primary/40 transition-colors shadow-sm">
                   <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest mb-2">Asset Valuation</Typography>
                   <Typography variant="displaySmall" className="font-black text-stone-900 tracking-tighter leading-none">
                      ₹{(totalStock * item.purchasePrice).toLocaleString()}
                   </Typography>
                   <div className="mt-auto pt-6 flex justify-between items-center border-t border-stone-50">
                      <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[10px] tracking-tight">Last Purchase</Typography>
                      <Typography variant="titleSmall" className="font-black text-stone-700">₹{item.purchasePrice}</Typography>
                   </div>
                </Card>

                <Card variant="filled" className="bg-stone-900 text-white p-8 rounded-xs flex flex-col group overflow-hidden relative border-none shadow-3">
                   <div className="relative z-10 h-full flex flex-col">
                      <Typography variant="labelLarge" className="text-stone-500 font-black uppercase tracking-widest mb-4">Registry Logic</Typography>
                      <div className="flex flex-col gap-4 mt-auto">
                          <div className="flex items-end gap-1.5 h-10 opacity-60 group-hover:opacity-100 transition-opacity">
                              {[1,3,2,1,5,1,2,3,1,4,1,2,1,3].map((w, i) => <div key={i} className="bg-white h-full" style={{ width: w }} />)}
                          </div>
                          <Typography variant="bodyLarge" className="font-mono tracking-[6px] text-primary-container font-black uppercase text-center">{item.barcode}</Typography>
                      </div>
                   </div>
                   <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer" onClick={() => setIsLabelWizardOpen(true)}>
                      <Icon symbol="print" size={32} className="text-white mb-2" />
                      <Typography variant="labelLarge" className="font-black uppercase tracking-widest text-white">GENERATE LABELS</Typography>
                   </div>
                </Card>
              </div>

              <Card variant="filled" className="bg-stone-50 border border-stone-200 p-8 @[900px]/item-detail:p-12 flex flex-col @[1000px]/item-detail:flex-row @[1000px]/item-detail:items-center justify-between gap-8 overflow-hidden relative group">
                  <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-3 mb-4">
                          <Icons.Terminal className="text-primary" size={20} />
                          <Typography variant="titleSmall" className="text-primary font-black uppercase tracking-[0.2em]">Operational Intelligence</Typography>
                      </div>
                      {aiInsight ? (
                          <div className="border-l-4 border-primary pl-8 py-2">
                             <Typography variant="headlineSmall" className="text-stone-800 font-black italic leading-snug">
                                {aiInsight}
                             </Typography>
                          </div>
                      ) : (
                          <Typography variant="titleMedium" className="text-stone-500 font-bold uppercase tracking-tight max-w-2xl">
                             Activate system analysis to identify stock churn rates and procurement bottlenecks.
                          </Typography>
                      )}
                  </div>
                  <Button 
                    variant="filled" 
                    size="md" 
                    onClick={handleGenerateAiInsight} 
                    disabled={isAiLoading} 
                    className="font-black shrink-0 px-10 shadow-2"
                  >
                      {isAiLoading ? 'ANALYZING PROTOCOLS...' : 'RUN AUDIT ENGINE'}
                  </Button>
              </Card>
          </TabsContent>

          <TabsContent value="stock" className="mt-0">
            <div className="grid grid-cols-1 @[800px]/item-detail:grid-cols-2 gap-6">
              {Object.entries(item.warehouseStock).map(([whId, stock]: any) => {
                const wh = warehouses.find((w: any) => w.id === whId);
                return (wh && stock > 0) ? (
                  <Card key={whId} variant="outlined" className="p-6 flex justify-between items-center bg-white border-stone-200 rounded-xs hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xs bg-stone-50 flex items-center justify-center text-stone-400 border border-stone-100"><Icons.Warehouse size={28} /></div>
                      <div>
                        <Typography variant="titleMedium" className="font-black text-stone-800 uppercase leading-none">{wh.name}</Typography>
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[10px] tracking-widest mt-2 block">{whId} Protocol</Typography>
                      </div>
                    </div>
                    <Typography variant="headlineSmall" className="font-black text-stone-900 tabular-nums">
                        {stock} <span className="text-xs text-stone-400 uppercase font-black ml-1">{item.unit}</span>
                    </Typography>
                  </Card>
                ) : null;
              })}
            </div>
          </TabsContent>

          <TabsContent value="trace" className="mt-0">
             <div className="flex flex-col gap-6">
                <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest px-1">Active Batch Registry</Typography>
                <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                   <Table>
                      <TableHeader>
                         <TableRow className="bg-stone-50">
                            <TableHead>Batch ID / Serial</TableHead>
                            <TableHead>Arrival Date</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {[
                             { id: 'BAT-9921-X', date: '12 Oct 2023', qty: 250, s: 'Verified' },
                             { id: 'BAT-9920-Y', date: '05 Oct 2023', qty: 50, s: 'Allocated' }
                         ].map((b, i) => (
                             <TableRow key={i} className="hover:bg-stone-50">
                                <TableCell className="font-mono text-primary font-black py-4 uppercase">{b.id}</TableCell>
                                <TableCell className="font-bold text-stone-400 uppercase text-[11px]">{b.date}</TableCell>
                                <TableCell className="text-right font-black text-stone-900 tabular-nums">{b.qty} {item.unit}</TableCell>
                                <TableCell className="text-right">
                                    <Chip label={b.s} className="h-5 text-[8px] font-black rounded-xs border-none bg-emerald-50 text-emerald-700 uppercase" />
                                </TableCell>
                             </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
             <div className="border border-stone-200 rounded-xs overflow-hidden shadow-sm">
               <div className="bg-stone-50 px-6 py-5 border-b border-stone-100 flex justify-between items-center">
                 <Typography variant="labelLarge" className="font-black text-stone-500 uppercase tracking-widest">Registry Audit Trail</Typography>
                 <Button variant="text" size="sm" className="text-primary font-black text-[10px]">EXPORT LOGS</Button>
               </div>
               <div className="bg-white">
                 {item.history?.map((entry: any, i: number) => (
                   <div key={i} className="flex items-center justify-between px-8 py-6 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
                     <div className="flex gap-10 items-center">
                       <span className="text-xs font-black text-stone-400 w-16 tracking-tighter tabular-nums">{entry.date}</span>
                       <div>
                         <Typography variant="titleSmall" className="font-black text-stone-900 uppercase leading-none">{entry.action}</Typography>
                         <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[10px] mt-2 tracking-tight">{entry.entity}</Typography>
                       </div>
                     </div>
                     <div className="text-right">
                        <span className={cn("font-black text-lg tabular-nums", entry.type === 'in' ? "text-emerald-600" : entry.type === 'wastage' ? "text-error" : "text-stone-900")}>
                          {entry.qty > 0 ? `+${entry.qty}` : entry.qty} {entry.unit}
                        </span>
                        <span className="text-[9px] font-black uppercase text-stone-300 block mt-1 tracking-widest">{entry.type} LOG</span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </TabsContent>
      </div>
      <LabelPrintWizard open={isLabelWizardOpen} onClose={() => setIsLabelWizardOpen(false)} itemId={item.id} />
    </Tabs>
  );
};