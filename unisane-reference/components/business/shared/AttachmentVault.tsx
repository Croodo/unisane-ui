import React from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { IconButton } from '../../ui/IconButton';

export const AttachmentVault = ({ files = [] }: { files?: any[] }) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-end border-b border-stone-100 pb-3">
         <div className="flex items-center gap-2">
            <Icon symbol="folder_shared" className="text-stone-400" size={20} />
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Document Vault</Typography>
         </div>
         <Button variant="text" size="md" className="text-primary font-black text-[10px]">ADD ATTACHMENT</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {files.length > 0 ? files.map((f, i) => (
             <div key={i} className="p-4 bg-white border border-stone-200 rounded-xs flex items-center gap-4 hover:border-primary/40 cursor-pointer group">
                <div className="w-10 h-10 bg-stone-50 rounded-xs flex items-center justify-center text-stone-300 group-hover:text-primary transition-colors">
                    <Icon symbol="insert_drive_file" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="text-xs font-black text-stone-800 uppercase block truncate">{f.name}</span>
                    <span className="text-[9px] font-bold text-stone-400 uppercase">{f.size} • {f.type}</span>
                </div>
                <IconButton onClick={()=>{}} className="text-stone-300 hover:text-error"><Icons.Delete size={16} /></IconButton>
             </div>
         )) : (
            <div className="col-span-2 py-12 border-2 border-dashed border-stone-100 rounded-xs flex flex-col items-center justify-center text-stone-200 grayscale opacity-40">
                <Icon symbol="cloud_upload" size={40} strokeWidth={1} />
                <span className="text-[9px] font-black uppercase tracking-[4px] mt-4">No documents linked</span>
            </div>
         )}
      </div>
    </div>
  );
};