
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { InventoryReportView } from './InventoryReportView';
import { SalesReportView } from './SalesReportView';
import { GSTRReportView } from './GSTRReportView';
import { RegistryHeader } from '../shared/RegistryComponents';

export const ReportsModule = ({ type }: { type: string }) => {
  const getHeaderInfo = () => {
    switch(type) {
        case 'inventory_rep': return { title: 'Inventory Audit', sub: 'Warehouse-level stock valuation & aging' };
        case 'sales_rep': return { title: 'Sales Performance', sub: 'Revenue trends and party-wise analytics' };
        case 'gst_rep': return { title: 'Tax Compliance (GSTR)', sub: 'Statutory summaries for GST filing' };
        default: return { title: 'Business Analytics', sub: 'Derived business intelligence' };
    }
  };

  const info = getHeaderInfo();

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
       <RegistryHeader 
         label="Intelligence Engine"
         title={info.title}
         hideSearch
         action={
           <div className="flex gap-2">
              <Button variant="outlined" size="md" icon={<Icons.Filter />} className="font-black text-[10px] bg-white">FILTERS</Button>
              <Button variant="filled" size="md" icon={<Icons.File />} className="bg-stone-900 text-white font-black text-[10px] px-8 shadow-2">EXPORT DATA</Button>
           </div>
         }
         subHeader={
            <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase tracking-tight -mt-4">{info.sub}</Typography>
         }
       />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
          <div className="max-w-[1400px]">
            {type === 'inventory_rep' && <InventoryReportView />}
            {type === 'sales_rep' && <SalesReportView />}
            {type === 'gst_rep' && <GSTRReportView />}
          </div>
      </div>
    </div>
  );
};
