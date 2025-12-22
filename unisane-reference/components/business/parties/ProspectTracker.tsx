import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Chip } from '../../ui/Chip';
import { RegistryHeader, RegistryList, RegistryContainer } from '../shared/RegistryComponents';
import { ListItem } from '../../ui/List';

const MOCK_PROSPECTS = [
    { id: 'LD-101', name: 'Lodha Developers', contact: 'Anil Deshmukh', val: '₹12.5L', status: 'Quoted', date: '2h ago' },
    { id: 'LD-100', name: 'Private Villa Project', contact: 'Ar. Sameer', val: '₹4.2L', status: 'Visit Done', date: '1d ago' },
    { id: 'LD-099', name: 'Godrej Properties', contact: 'Manoj K.', val: '₹45L', status: 'Negotiation', date: '3d ago' },
];

export const ProspectTracker = () => {
  const [search, setSearch] = useState('');
  
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
        <RegistryHeader 
          variant="full"
          label="Sales Pipeline"
          title="Lead Management"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search leads or contacts..."
          action={
            <Button variant="filled" size="md" icon={<Icons.Add />} className="shadow-2 font-black text-[10px] px-8">LOG NEW INQUIRY</Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-stone-50/30">
            <div className="max-w-5xl mx-auto flex flex-col gap-2">
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {['New', 'Site Visit', 'Quoted', 'Negotiation'].map(stage => (
                        <div key={stage} className="bg-white border border-stone-200 p-4 rounded-xs text-center">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{stage}</span>
                            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1">
                                {Math.floor(Math.random() * 5) + 1}
                            </Typography>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    {MOCK_PROSPECTS.map(p => (
                        <div key={p.id} className="p-6 bg-white border border-stone-200 rounded-xs flex items-center justify-between group hover:border-primary transition-all cursor-pointer">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xs bg-stone-100 text-stone-400 flex items-center justify-center font-black group-hover:bg-stone-900 group-hover:text-primary transition-colors">
                                    <Icons.Parties size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-primary uppercase mb-1">{p.id}</span>
                                    <Typography variant="titleSmall" className="font-black text-stone-900 uppercase">{p.name}</Typography>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase mt-1">Contact: {p.contact}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-stone-400 uppercase">Est. Value</span>
                                    <span className="text-[13px] font-black text-stone-900 tabular-nums">{p.val}</span>
                                </div>
                                <Chip label={p.status} className="h-6 text-[8px] font-black uppercase bg-stone-900 text-primary-container border-none" />
                                <Button variant="tonal" size="md" className="font-black text-[9px] h-10 px-4">CONVERT TO PARTY</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};