import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { ListDetailLayout } from '../../ui/CanonicalLayouts';
import { ListItem } from '../../ui/List';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Avatar } from '../../ui/Avatar';
import { Card } from '../../ui/Card';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper } from '../shared/RegistryComponents';

interface CategoryViewProps {
  categories: any[];
  onAdd: () => void;
  onEdit: (cat: any) => void;
  onDelete: (id: string) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({ categories, onAdd, onEdit, onDelete }) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = categories.filter(cat => 
    cat.name.toLowerCase().includes(query.toLowerCase()) || 
    cat.description?.toLowerCase().includes(query.toLowerCase())
  );

  const selectedCategory = categories.find(c => c.id === selectedId);

  return (
    <ListDetailLayout
      showDetailMobile={!!selectedId}
      onBackClick={() => setSelectedId(null)}
      list={
        <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200">
          <RegistryHeader 
            label="Logic Segments"
            title="Categories"
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search logic groups..."
            action={
              <Button variant="filled" size="md" icon={<Icons.Add />} onClick={onAdd} className="rounded-xs shadow-1 font-black px-4">
                ADD CATEGORY
              </Button>
            }
          />

          <RegistryList isEmpty={filtered.length === 0} emptyIcon={<Icons.Filter size={48} strokeWidth={1} />}>
            {filtered.map((cat) => {
              const isActive = selectedId === cat.id;
              return (
                <RegistrySelectionWrapper key={cat.id} isActive={isActive}>
                  <ListItem
                    headline={cat.name}
                    supportingText={cat.description || 'No description'}
                    className={cn(
                      "rounded-xs min-h-[88px] py-3 px-3 transition-all border border-transparent items-start", 
                      isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50"
                    )}
                    onClick={() => setSelectedId(cat.id)}
                    leadingIcon={
                      <Avatar size="md" fallback={cat.name[0]} className={cn(
                          "rounded-xs font-black transition-colors shrink-0 mt-0.5", 
                          isActive ? "bg-primary text-white" : "bg-stone-200 text-stone-500"
                      )} />
                    }
                    trailingIcon={
                      <div className="flex flex-col items-end gap-1.5 pt-1">
                          <span className="font-black text-[11px] text-stone-900 uppercase">
                              {cat.count} ITEMS
                          </span>
                      </div>
                    }
                  />
                </RegistrySelectionWrapper>
              );
            })}
          </RegistryList>
        </div>
      }
      detail={
        <div className="h-full bg-white animate-in fade-in duration-500">
           {selectedCategory ? (
             <div className="p-12 flex flex-col gap-10">
                <div className="flex justify-between items-start border-b border-stone-100 pb-8">
                   <div>
                      <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest">{selectedCategory.id}</Typography>
                      <Typography variant="displaySmall" className="font-black text-stone-900 uppercase tracking-tighter mt-2">{selectedCategory.name}</Typography>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="filled" size="md" onClick={() => onEdit(selectedCategory)} icon={<Icons.Edit />} className="shadow-2 font-black">EDIT</Button>
                      <Button variant="outlined" size="md" className="text-error border-error/20 font-black" onClick={() => onDelete(selectedCategory.id)} icon={<Icons.Delete />}>DELETE</Button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card variant="outlined" className="p-8 bg-stone-50 border-stone-200">
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase mb-2">Logical Definition</Typography>
                        <Typography variant="bodyLarge" className="text-stone-700 font-bold uppercase leading-relaxed">
                            {selectedCategory.description}
                        </Typography>
                    </Card>
                    <Card variant="filled" className="p-8 bg-stone-900 text-white border-none shadow-2 flex flex-col justify-between h-[180px]">
                        <Typography variant="labelSmall" className="text-stone-500 font-black uppercase">Category Density</Typography>
                        <Typography variant="displaySmall" className="font-black text-primary-container leading-none">{selectedCategory.count} <span className="text-xs uppercase text-stone-500 font-black ml-2">Assigned SKUs</span></Typography>
                        <Button variant="tonal" className="bg-white/10 text-white border-none w-full font-black text-[10px]">VIEW ALL ITEMS</Button>
                    </Card>
                </div>
             </div>
           ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 text-stone-200">
                <div className="p-10 rounded-full bg-stone-50 border border-stone-100">
                    <Icons.Filter size={96} strokeWidth={1} />
                </div>
                <div className="text-center">
                    <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Logic Group</Typography>
                    <Typography variant="bodyLarge" className="text-stone-300 font-bold uppercase tracking-tight mt-2 opacity-60">Pick a category to view associated assets</Typography>
                </div>
            </div>
           )}
        </div>
      }
    />
  );
};