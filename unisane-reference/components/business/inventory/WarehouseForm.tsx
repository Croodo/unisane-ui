
import React, { useState } from 'react';
import { TextField } from '../../ui/TextField';
import { Typography } from '../../ui/Typography';
import { Divider } from '../../ui/Divider';

interface WarehouseFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const WarehouseForm: React.FC<WarehouseFormProps> = ({ initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    manager: initialData?.manager || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    maxCapacity: initialData?.maxCapacity || '1000',
  });

  const bgClass = "bg-white";

  return (
    <div className="flex flex-col bg-white">
      <div className="p-8 md:p-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
           <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full" /> Location Identity
           </Typography>
           <TextField 
             label="WAREHOUSE NAME" 
             value={formData.name} 
             onChange={(e) => setFormData({...formData, name: e.target.value})} 
             placeholder="e.g. Mumbai Logistics Hub" 
             labelClassName={bgClass} 
           />
           <TextField 
             label="PHYSICAL ADDRESS" 
             multiline
             rows={2}
             value={formData.address} 
             onChange={(e) => setFormData({...formData, address: e.target.value})} 
             placeholder="Full site location..." 
             labelClassName={bgClass} 
           />
        </div>

        <Divider className="opacity-40" />

        <div className="flex flex-col gap-4">
           <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full" /> Operational Personnel
           </Typography>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField 
                label="PRIMARY CUSTODIAN" 
                value={formData.manager} 
                onChange={(e) => setFormData({...formData, manager: e.target.value})} 
                placeholder="Manager name" 
                labelClassName={bgClass} 
              />
              <TextField 
                label="CONTACT NUMBER" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                placeholder="+91 XXXXX XXXXX" 
                labelClassName={bgClass} 
              />
           </div>
        </div>

        <Divider className="opacity-40" />

        <div className="flex flex-col gap-4">
           <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full" /> Capacity Planning
           </Typography>
           <TextField 
             label="TOTAL STORAGE LIMIT (UNITS)" 
             type="number"
             value={formData.maxCapacity} 
             onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})} 
             placeholder="e.g. 5000" 
             labelClassName={bgClass} 
           />
        </div>
      </div>
    </div>
  );
};
