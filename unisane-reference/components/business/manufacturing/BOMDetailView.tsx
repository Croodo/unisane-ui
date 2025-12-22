import React from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Icons } from '../Icons';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';
import { Divider } from '../../ui/Divider';

export const BOMDetailView = ({ bom, onEdit }: any) => {
  if (!bom) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-6 text-stone-200">
       <div className="p-8 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Terminal size={80} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Recipe</Typography>
          <Typography variant="bodySmall" className="text-stone-200 font-bold uppercase tracking-tight mt-1">Choose a Bill of Materials to view production logic</Typography>
       </div>
    </div>
  );

  const MOCK_INGREDIENTS = [
    { id: 'ITM011', name: 'Black Granite Raw Block', qty: 1.2, unit: 'Ton', rate: 4500, waste: '15%' },
    { id: 'ITM004', name: 'Marble Polish Compound', qty: 5, unit: 'Ltr', rate: 600, waste: '2%' },
    { id: 'ITM014', name: 'Silicon Sealant (Clear)', qty: 2, unit: 'Pcs', rate: 140, waste: '0%' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-white animate-in fade-in duration-500 @container">
       <EntityDetailHeader 
         id={bom.id}
         title={bom.name}
         subtitle="Production Recipe Registry"
         status={<Chip label={bom.status} className="h-5 text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border-none rounded-xs px-2" />}
         actions={
           <>
             <Button variant="outlined" size="md" icon={<Icons.Adjust size={18} />} className="font-black">CLONE</Button>
             <Button variant="filled" size="md" icon={<Icons.Edit size={18} />} onClick={onEdit} className="shadow-1 font-black">EDIT BOM</Button>
           </>
         }
       />

       <div className="p-6 @md:p-10 flex flex-col gap-10 pb-32">
          <Card variant="outlined" className="bg-stone-50 border-stone-200 p-8 flex flex-col @xl:flex-row @xl:items-center justify-between gap-8 rounded-xs">
              <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-xs bg-white border border-stone-200 flex items-center justify-center text-stone-300 shadow-sm">
                     <Icons.Inventory size={32} />
                  </div>
                  <div>
                      <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[10px] tracking-widest">Finished Good Yield</Typography>
                      <Typography variant="titleLarge" className="font-black text-stone-900 uppercase mt-1">Granite Stone Slab (Grey)</Typography>
                      <Typography variant="bodySmall" className="text-amber-600 font-black uppercase mt-1 tracking-tight">Output Standard: {bom.yield}</Typography>
                  </div>
              </div>
              <div className="flex flex-col @xl:items-end">
                  <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[10px] tracking-widest">Est. Direct Material Cost</Typography>
                  <Typography variant="headlineSmall" className="font-black text-stone-900 tabular-nums">₹{bom.estimatedCost.toLocaleString()}</Typography>
              </div>
          </Card>

          <section className="flex flex-col gap-5">
             <div className="flex justify-between items-center px-1">
                <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest">Required Components</Typography>
                <span className="text-[10px] font-black text-stone-300 uppercase">Input / Output Ratio: 1.24</span>
             </div>
             <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-stone-50 border-b border-stone-200">
                            <TableHead className="py-4">Component</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Rate</TableHead>
                            <TableHead className="text-right">Wastage %</TableHead>
                            <TableHead className="text-right">Effective Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_INGREDIENTS.map((item, i) => (
                            <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-50 transition-colors">
                                <TableCell className="py-4">
                                    <div className="flex flex-col">
                                        <span className="font-black text-stone-900 uppercase text-[12px]">{item.name}</span>
                                        <span className="text-[10px] font-mono text-stone-400 uppercase">{item.id}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-stone-700 tabular-nums">{item.qty} {item.unit}</TableCell>
                                <TableCell className="text-right font-medium text-stone-400 tabular-nums">₹{item.rate}</TableCell>
                                <TableCell className="text-right font-black text-amber-600 text-[10px] uppercase tabular-nums">{item.waste}</TableCell>
                                <TableCell className="text-right font-black text-stone-900 tabular-nums">₹{(item.qty * item.rate).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                  <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest px-1">Labor & Overheads</Typography>
                  <div className="p-6 bg-stone-50 border border-stone-100 rounded-xs flex flex-col gap-3">
                      <div className="flex justify-between items-center text-[11px] font-bold text-stone-600 uppercase">
                          <span>Machine Operating Cost</span>
                          <span className="font-black text-stone-900">₹850 / hr</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-stone-600 uppercase">
                          <span>Direct Labor (Finishing)</span>
                          <span className="font-black text-stone-900">₹400 / hr</span>
                      </div>
                      <Divider className="my-1 opacity-50" />
                      <div className="flex justify-between items-center text-[11px] font-black text-stone-900 uppercase">
                          <span>Total Overhead Rate</span>
                          <span className="text-primary font-black">₹1,250 / hr</span>
                      </div>
                  </div>
              </div>
              <div className="flex flex-col gap-4">
                  <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest px-1">Recipe Compliance</Typography>
                  <div className="p-6 bg-stone-900 text-white rounded-xs flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-stone-900"><Icons.Check size={20} /></div>
                         <span className="text-xs font-black uppercase tracking-tight">ISO 9001 Process Validated</span>
                      </div>
                      <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase leading-relaxed italic">
                        "Standard production logic verified. Last deviation audit on 12 Oct resulted in 0 anomalies."
                      </Typography>
                  </div>
              </div>
          </section>
       </div>
    </div>
  );
};