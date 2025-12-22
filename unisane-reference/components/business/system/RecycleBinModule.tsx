import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper, RegistryContainer } from '../shared/RegistryComponents';
import { ListItem } from '../../ui/List';
import { ListDetailLayout } from '../../ui/CanonicalLayouts';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';
import { Chip } from '../../ui/Chip';

const MOCK_DELETED = [
    { id: 'INV-2023-001', name: 'Invoice: Elite Builders', type: 'Document', deletedOn: '24 Oct 2023', reason: 'User Request', amount: 45000 },
    { id: 'ITM012', name: 'Drill Machine (Legacy)', type: 'Master Data', deletedOn: '20 Oct 2023', reason: 'Obsolete SKU', amount: 0 },
    { id: 'PRTY-991', name: 'Vendor: Global Tools', type: 'Entity', deletedOn: '18 Oct 2023', reason: 'Duplicate Record', amount: 0 },
];

export const RecycleBinModule = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = MOCK_DELETED.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.id.includes(search));
  const selected = MOCK_DELETED.find(d => d.id === selectedId);

  return (
    <div className="h-full @container relative isolate">
        <ListDetailLayout
            showDetailMobile={!!selectedId}
            onBackClick={() => setSelectedId(null)}
            list={
                <RegistryContainer className="bg-stone-50 border-r border-stone-200">
                    <RegistryHeader 
                        label="Recovery Vault"
                        title="Recycle Bin"
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search vault..."
                        action={
                            <Button variant="text" size="md" className="text-stone-400 font-black text-[10px] hover:text-rose-600 px-6">PURGE ALL</Button>
                        }
                    />

                    <RegistryList isEmpty={filtered.length === 0} emptyIcon={<Icons.Delete size={48} strokeWidth={1} />}>
                        {filtered.map(item => {
                            const isActive = selectedId === item.id;
                            return (
                                <RegistrySelectionWrapper key={item.id} isActive={isActive}>
                                    <ListItem 
                                        headline={item.name}
                                        supportingText={`${item.type} • Deleted ${item.deletedOn}`}
                                        className={cn(
                                            "rounded-xs min-h-[80px] transition-all border border-transparent px-4 items-center", 
                                            isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50"
                                        )}
                                        onClick={() => setSelectedId(item.id)}
                                        leadingIcon={<div className={cn("w-10 h-10 rounded-xs flex items-center justify-center font-black transition-colors shrink-0", isActive ? "bg-rose-600 text-white" : "bg-stone-200 text-stone-500")}><Icons.Delete size={20} /></div>}
                                    />
                                </RegistrySelectionWrapper>
                            )
                        })}
                    </RegistryList>
                </RegistryContainer>
            }
            detail={
                <div className="h-full bg-white animate-in fade-in duration-500">
                    {selected ? (
                        <div className="flex flex-col min-h-full">
                            <EntityDetailHeader 
                                id={selected.id}
                                title={selected.name}
                                subtitle={selected.type}
                                status={<Chip label="Isolated" className="h-6 text-[10px] font-black uppercase rounded-xs border-none bg-rose-50 text-rose-700 px-3" />}
                                actions={
                                    <>
                                        <Button variant="outlined" size="md" onClick={() => {}} className="font-black">PERMANENT DELETE</Button>
                                        <Button variant="filled" size="md" onClick={() => {}} className="shadow-2 font-black">RESTORE ENTITY</Button>
                                    </>
                                }
                            />
                            <div className="p-12 flex flex-col gap-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-stone-50 rounded-xs flex flex-col gap-4 border border-stone-100">
                                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Deletion Audit</Typography>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-stone-400 uppercase">Reason Code</span>
                                            <span className="text-sm font-black text-stone-800 uppercase">{selected.reason}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-stone-400 uppercase">Resource Type</span>
                                            <span className="text-sm font-black text-stone-800 uppercase">{selected.type}</span>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-stone-900 text-white rounded-xs flex flex-col justify-center gap-2 border-none shadow-3">
                                        <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest">Purge Countdown</Typography>
                                        <Typography variant="headlineMedium" className="font-black text-rose-400 tabular-nums">24 DAYS LEFT</Typography>
                                        <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase">Auto-purging on 18 Nov 2023</Typography>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 text-stone-200 opacity-50">
                            <Icons.Delete size={96} strokeWidth={1} />
                            <div className="text-center">
                                <Typography variant="titleLarge" className="font-black uppercase tracking-widest">Select Deleted Entity</Typography>
                                <Typography variant="bodyLarge" className="font-bold uppercase tracking-tight mt-2">View metadata before restoration</Typography>
                            </div>
                        </div>
                    )}
                </div>
            }
        />
    </div>
  );
};