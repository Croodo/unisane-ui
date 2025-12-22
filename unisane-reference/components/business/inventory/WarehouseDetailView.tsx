import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/Tabs';

interface WarehouseDetailViewProps {
  warehouse?: any;
  allItemRecords: any[];
  onEdit: () => void;
  onTransfer: () => void;
}

export const WarehouseDetailView: React.FC<WarehouseDetailViewProps> = ({ 
  warehouse, allItemRecords, onEdit, onTransfer 
}) => {
  const [activeTab, setActiveTab] = useState('inventory');

  if (!warehouse) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 text-stone-200">
       <div className="p-10 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Warehouse size={96} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Hub</Typography>
          <Typography variant="bodyLarge" className="text-stone-300 font-bold uppercase tracking-tight mt-2 opacity-60">Pick a location to view real-time stock distribution</Typography>
       </div>
    </div>
  );

  const localInventory = allItemRecords.filter(item => (item.warehouseStock[warehouse.id] || 0) > 0);
  const occupancyValue = parseInt(warehouse.capacity);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-full bg-white animate-in fade-in duration-500 @container/wh-detail">
      <EntityDetailHeader 
        id={warehouse.id}
        title={warehouse.name}
        subtitle="Distribution Node"
        status={<Chip label={warehouse.status} className="h-6 text-[10px] bg-emerald-100 text-emerald-700 border-none font-black rounded-xs uppercase px-3" />}
        actions={
          <>
            <Button variant="outlined" size="md" icon={<Icons.Warehouse size={20} />} onClick={onTransfer} className="font-black">TRANSFER STOCK</Button>
            <Button variant="filled" size="md" icon={<Icons.Edit size={20} />} onClick={onEdit} className="shadow-2 font-black">EDIT HUB</Button>
          </>
        }
        tabs={
          <TabsList className="bg-transparent border-none p-0 h-auto gap-10 justify-start">
            <TabsTrigger value="inventory" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">LOCAL INVENTORY</TabsTrigger>
            <TabsTrigger value="personnel" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">STAFF & ACCESS</TabsTrigger>
          </TabsList>
        }
      />

      <div className="p-6 @[800px]/wh-detail:p-10 flex flex-col gap-10 pb-32 flex-1">
          <TabsContent value="inventory" className="mt-0 space-y-12">
              <div className="grid grid-cols-1 @[900px]/wh-detail:grid-cols-2 gap-6">
                  <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs shadow-sm flex flex-col">
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest mb-4">Occupancy Load</Typography>
                    <div className="flex items-center gap-6">
                        <Typography variant="displaySmall" className="font-black text-stone-900 leading-none">{warehouse.capacity}</Typography>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                             <div className={cn("h-full transition-all duration-1000 ease-emphasized", occupancyValue > 80 ? "bg-error" : "bg-primary")} style={{ width: warehouse.capacity }} />
                          </div>
                          <span className="text-[10px] font-black text-stone-400 uppercase">Limit: {warehouse.maxCapacity.toLocaleString()} Units</span>
                        </div>
                    </div>
                  </Card>
                  <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs shadow-sm flex flex-col">
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest mb-4">Node Valuation</Typography>
                    <Typography variant="displaySmall" className="font-black text-stone-900 tracking-tighter leading-none">
                        ₹{(localInventory.reduce((acc, item) => acc + (item.warehouseStock[warehouse.id] * item.purchasePrice), 0)).toLocaleString()}
                    </Typography>
                    <Typography variant="labelSmall" className="text-emerald-600 font-black uppercase mt-4 tracking-tight">Financial Status: Optimal</Typography>
                  </Card>
              </div>

              <div className="flex flex-col gap-4">
                 <Typography variant="labelMedium" className="font-black uppercase tracking-widest text-stone-400 px-1">Physical Stock Registry</Typography>
                 <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                          <TableRow className="bg-stone-50">
                            <TableHead className="py-4">Product Identity</TableHead>
                            <TableHead>Logic Group</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right">Unit Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {localInventory.length > 0 ? localInventory.map((item) => (
                            <TableRow key={item.id} className="hover:bg-stone-50/50 transition-colors border-b border-stone-50">
                              <TableCell className="font-black text-stone-800 uppercase tracking-tight flex items-center gap-4 py-5">
                                 <div className="w-10 h-10 rounded-xs overflow-hidden shrink-0 border border-stone-100 bg-white">
                                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span>{item.name}</span>
                                    <span className="text-[10px] text-stone-400 font-mono">{item.id}</span>
                                 </div>
                              </TableCell>
                              <TableCell><Chip label={item.category} className="h-5 text-[8px] font-black rounded-xs border-none bg-stone-100 uppercase" /></TableCell>
                              <TableCell className="text-right font-black text-stone-900 tabular-nums">{item.warehouseStock[warehouse.id]} <span className="text-[10px] text-stone-400 uppercase font-black ml-1">{item.unit}</span></TableCell>
                              <TableCell className="text-right font-bold text-stone-500 text-xs tabular-nums">₹{item.purchasePrice}</TableCell>
                            </TableRow>
                          )) : (
                             <TableRow><TableCell colSpan={4} className="text-center py-20 text-stone-200 font-black uppercase tracking-widest text-xs">Zero inventory at this location</TableCell></TableRow>
                          )}
                        </TableBody>
                    </Table>
                 </div>
              </div>
          </TabsContent>

          <TabsContent value="personnel" className="mt-0">
              <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs max-w-2xl">
                  <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest mb-6 block">Custodian Information</Typography>
                  <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-stone-900 rounded-xs flex items-center justify-center text-primary font-black text-2xl uppercase">{warehouse.manager[0]}</div>
                      <div className="flex flex-col gap-1">
                          <Typography variant="titleLarge" className="font-black text-stone-900 uppercase">{warehouse.manager}</Typography>
                          <Typography variant="bodyLarge" className="text-stone-500 font-bold uppercase tracking-tight">{warehouse.phone}</Typography>
                          <Typography variant="bodySmall" className="text-stone-400 font-bold mt-4 uppercase leading-relaxed">{warehouse.address}</Typography>
                      </div>
                  </div>
              </Card>
          </TabsContent>
      </div>
    </Tabs>
  );
};