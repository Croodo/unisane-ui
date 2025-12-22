
import React, { useState } from 'react';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Typography } from '../../ui/Typography';
import { Divider } from '../../ui/Divider';
import { Switch } from '../../ui/SelectionControls';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { IconButton } from '../../ui/IconButton';

interface ItemFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({ initialData }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'Hard Goods',
    unit: initialData?.unit || 'Pcs',
    price: initialData?.price || '',
    purchasePrice: initialData?.purchasePrice || '',
    hsn: initialData?.hsn || '',
    tax: initialData?.tax || '18%',
    taxPreference: initialData?.taxPreference || 'Exclusive',
    minStock: initialData?.minStock || '0',
    imageUrl: initialData?.imageUrl || '',
    barcode: initialData?.barcode || '',
    trackBatch: initialData?.trackBatch || false,
    trackSerial: initialData?.trackSerial || false,
    isBundle: initialData?.isBundle || false,
    bom: initialData?.bom || []
  });

  const bgClass = "bg-white";

  const addBOMComponent = () => {
    setFormData(prev => ({
        ...prev,
        bom: [...prev.bom, { id: '', qty: 1, unit: 'Pcs' }]
    }));
  };

  return (
    <div className="flex flex-col bg-white h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-8 border-b border-stone-100 bg-stone-50/30">
          <TabsList className="bg-transparent border-none p-0 h-auto gap-10">
            <TabsTrigger value="general" className="px-0 py-4 h-auto text-[10px] font-black uppercase tracking-widest rounded-none border-b-2 border-transparent">GENERAL PROTOCOL</TabsTrigger>
            <TabsTrigger value="inventory" className="px-0 py-4 h-auto text-[10px] font-black uppercase tracking-widest rounded-none border-b-2 border-transparent">STOCK LOGIC</TabsTrigger>
            <TabsTrigger value="bom" className="px-0 py-4 h-auto text-[10px] font-black uppercase tracking-widest rounded-none border-b-2 border-transparent">BUNDLE / RECIPE</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-10">
          <TabsContent value="general" className="mt-0 space-y-10">
            <div className="flex flex-col gap-6">
              <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-3 bg-primary rounded-full" /> Identity
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="ITEM NAME" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} labelClassName={bgClass} />
                <TextField label="IMAGE URL" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} labelClassName={bgClass} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <TextField label="SKU / BARCODE" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} labelClassName={bgClass} />
                <Select label="CATEGORY" value={formData.category} onChange={(val) => setFormData({...formData, category: val})} options={[{ label: 'Hard Goods', value: 'Hard Goods' }, { label: 'Chemicals', value: 'Chemicals' }]} />
                <Select label="PRIMARY UNIT" value={formData.unit} onChange={(val) => setFormData({...formData, unit: val})} options={[{ label: 'Pieces (Pcs)', value: 'Pcs' }, { label: 'Square Feet (SqFt)', value: 'SqFt' }]} />
              </div>
            </div>

            <Divider className="opacity-40" />

            <div className="flex flex-col gap-6">
              <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-3 bg-primary rounded-full" /> Pricing & Tax
              </Typography>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <TextField label="PURCHASE PRICE" type="number" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})} labelClassName={bgClass} />
                <TextField label="SALE PRICE" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} labelClassName={bgClass} />
                <Select label="TAX PREFERENCE" value={formData.taxPreference} onChange={(val) => setFormData({...formData, taxPreference: val})} options={[{ label: 'Inclusive', value: 'Inclusive' }, { label: 'Exclusive', value: 'Exclusive' }]} />
                <Select label="GST SLAB" value={formData.tax} onChange={(val) => setFormData({...formData, tax: val})} options={[{ label: '18%', value: '18%' }, { label: '28%', value: '28%' }]} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-0 space-y-10">
            <div className="flex flex-col gap-6">
              <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-3 bg-primary rounded-full" /> Traceability
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-stone-50 rounded-xs border border-stone-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-stone-700 uppercase">Track Batches</span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase">Perishable / Expiry tracking</span>
                    </div>
                    <Switch checked={formData.trackBatch} onChange={e => setFormData({...formData, trackBatch: e.target.checked})} />
                </div>
                <div className="p-4 bg-stone-50 rounded-xs border border-stone-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-stone-700 uppercase">Track Serials</span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase">Unique identity per unit</span>
                    </div>
                    <Switch checked={formData.trackSerial} onChange={e => setFormData({...formData, trackSerial: e.target.checked})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="HSN CODE" value={formData.hsn} onChange={(e) => setFormData({...formData, hsn: e.target.value})} labelClassName={bgClass} />
                <TextField label="MINIMUM STOCK THRESHOLD" type="number" value={formData.minStock} onChange={(e) => setFormData({...formData, minStock: e.target.value})} labelClassName={bgClass} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bom" className="mt-0 space-y-8">
            <div className="p-6 bg-stone-900 text-white rounded-xs border-none flex items-center justify-between shadow-2">
                <div className="flex flex-col">
                    <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest">Bill of Materials</Typography>
                    <Typography variant="bodyLarge" className="text-stone-200 font-bold uppercase mt-1">Enable for manufacturing / kits</Typography>
                </div>
                <Switch checked={formData.isBundle} onChange={e => setFormData({...formData, isBundle: e.target.checked})} />
            </div>

            {formData.isBundle && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-top-4 duration-500">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest px-1">Required Components</Typography>
                    <div className="flex flex-col gap-3">
                        {formData.bom.map((comp: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_48px] gap-4 items-center p-3 bg-stone-50 border border-stone-100 rounded-xs">
                                <Select label="ITEM" value={comp.id} onChange={()=>{}} options={[]} />
                                <TextField label="QTY" type="number" value={comp.qty} labelClassName="bg-stone-50" />
                                <div className="text-center">
                                    <span className="text-[9px] font-black text-stone-400 uppercase block">Unit</span>
                                    <span className="font-black text-stone-900 text-xs">SqFt</span>
                                </div>
                                <IconButton onClick={() => setFormData(p => ({...p, bom: p.bom.filter((_:any,i:number)=>i!==idx)}))} className="text-stone-300 hover:text-error">
                                    <Icons.Delete size={18} />
                                </IconButton>
                            </div>
                        ))}
                        <Button variant="outlined" size="sm" icon={<Icons.Add />} onClick={addBOMComponent} className="h-12 border-dashed border-2 text-[10px] font-black tracking-widest">ADD COMPONENT</Button>
                    </div>
                </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
