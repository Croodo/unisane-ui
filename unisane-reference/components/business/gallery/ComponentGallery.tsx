
import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Sheet, SheetSize } from '../../ui/Sheet';
import { Icons } from '../Icons';
import { Chip } from '../../ui/Chip';
import { Badge } from '../../ui/Badge';
import { IconButton } from '../../ui/IconButton';
import { LinearProgress, CircularProgress } from '../../ui/Progress';
import { LineChart, DonutChart, BarChart } from '../../ui/Charts';
import { Checkbox, Radio, Switch } from '../../ui/SelectionControls';
import { Slider } from '../../ui/Slider';
import { Tooltip } from '../../ui/Tooltip';
import { Avatar } from '../../ui/Avatar';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';
import { Tabs, TabsList, TabsTrigger } from '../../ui/Tabs';
import { RegistryHeader } from '../shared/RegistryComponents';

export const ComponentGallery = () => {
  const [sheetState, setSheetState] = useState<{ open: boolean; size: SheetSize }>({ open: false, size: 'md' });
  const [activeGalleryTab, setActiveGalleryTab] = useState('atomic');

  const openSheet = (size: SheetSize) => setSheetState({ open: true, size });

  const renderContent = () => {
    switch(activeGalleryTab) {
      case 'atomic':
        return (
          <div className="flex flex-col gap-12 animate-in fade-in duration-500">
             {/* 1. Action Tier */}
            <section className="flex flex-col gap-6">
                <Typography variant="titleLarge" className="font-black text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-4">01. Action Protocols</Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card variant="outlined" className="p-8 bg-white border-stone-200">
                        <Typography variant="labelSmall" className="font-black text-stone-400 mb-6 block">Command Buttons</Typography>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="filled">PRIMARY FILLED</Button>
                            <Button variant="outlined">OUTLINED</Button>
                            <Button variant="tonal">TONAL UTILITY</Button>
                            <Button variant="text">TEXT ONLY</Button>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center mt-6">
                            <Button variant="filled" size="sm" icon={<Icons.Add />}>CREATE</Button>
                            <Button variant="filled" size="lg" icon={<Icons.Check />}>AUTHORIZE TRANSACTION</Button>
                        </div>
                    </Card>
                    <Card variant="outlined" className="p-8 bg-white border-stone-200">
                        <Typography variant="labelSmall" className="font-black text-stone-400 mb-6 block">State Targets (IconButtons)</Typography>
                        <div className="flex flex-wrap gap-6 items-center">
                            <IconButton variant="standard"><Icons.Menu /></IconButton>
                            <IconButton variant="filled" className="bg-stone-900"><Icons.Search /></IconButton>
                            <IconButton variant="outlined"><Icons.Edit /></IconButton>
                            <IconButton variant="tonal"><Icons.Delete /></IconButton>
                            <Badge value={12} position="icon-button">
                                <IconButton variant="standard"><Icons.Notifications /></IconButton>
                            </Badge>
                        </div>
                    </Card>
                </div>
            </section>

            {/* 2. Selection Tier */}
            <section className="flex flex-col gap-6">
                <Typography variant="titleLarge" className="font-black text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-4">02. Selection Inputs</Typography>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <Card variant="outlined" className="p-6 bg-stone-50/50">
                        <Typography variant="labelSmall" className="font-black text-stone-400 mb-4 block">Switches & Toggles</Typography>
                        <div className="flex flex-col gap-4">
                            <Switch label="Active Sync" defaultChecked />
                            <Switch label="Protocol Override" icons />
                            <Switch label="Disabled State" disabled />
                        </div>
                   </Card>
                   <Card variant="outlined" className="p-6 bg-stone-50/50">
                        <Typography variant="labelSmall" className="font-black text-stone-400 mb-4 block">Logical Multi-Selection</Typography>
                        <div className="flex flex-col gap-2">
                            <Checkbox label="Authorized for Export" defaultChecked />
                            <Checkbox label="Manual Audit Required" />
                            <Checkbox label="Indeterminate Trace" indeterminate />
                        </div>
                   </Card>
                   <Card variant="outlined" className="p-6 bg-stone-50/50">
                        <Typography variant="labelSmall" className="font-black text-stone-400 mb-4 block">Registry Range (Sliders)</Typography>
                        <div className="flex flex-col gap-8 py-4">
                            <Slider defaultValue={65} />
                            <Slider defaultValue={3} min={0} max={10} step={1} withTicks withLabel />
                        </div>
                   </Card>
                </div>
            </section>
          </div>
        );
      case 'data':
        return (
          <div className="flex flex-col gap-12 animate-in fade-in duration-500">
            <section className="flex flex-col gap-8">
                <Typography variant="titleLarge" className="font-black text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-4">03. Visual Intelligence</Typography>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <Card variant="outlined" className="p-8 border-stone-200 bg-white">
                        <Typography variant="labelSmall" className="font-black text-stone-400 block mb-8">Supply Outflow Projections</Typography>
                        <div className="h-64">
                            <BarChart 
                                height={240}
                                color="bg-stone-900"
                                data={[
                                    { label: 'WEEK 1', value: 450 }, { label: 'WEEK 2', value: 820 },
                                    { label: 'WEEK 3', value: 610 }, { label: 'WEEK 4', value: 950 },
                                ]}
                            />
                        </div>
                    </Card>
                    <Card variant="outlined" className="p-8 border-stone-200 bg-white">
                        <Typography variant="labelSmall" className="font-black text-stone-400 block mb-8">Revenue Dynamics</Typography>
                        <div className="h-64">
                            <LineChart 
                                height={240} 
                                data={[
                                    { label: 'MON', value: 100 }, { label: 'TUE', value: 300 }, 
                                    { label: 'WED', value: 200 }, { label: 'THU', value: 600 },
                                    { label: 'FRI', value: 450 }, { label: 'SAT', value: 800 }
                                ]} 
                            />
                        </div>
                    </Card>
                </div>
            </section>
            
            <section className="flex flex-col gap-6">
                <Typography variant="titleLarge" className="font-black text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-4">04. Communication & Feedback</Typography>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <Card variant="filled" className="bg-emerald-50 border border-emerald-100 p-8 flex items-center gap-6">
                        <CircularProgress value={75} />
                        <div>
                            <Typography variant="titleMedium" className="font-black text-emerald-900 uppercase">Process Optimization</Typography>
                            <Typography variant="bodySmall" className="text-emerald-700 font-bold uppercase mt-1">Audit engine is 75% complete</Typography>
                        </div>
                   </Card>
                   <Card variant="filled" className="bg-stone-900 p-8 flex flex-col gap-6 justify-center">
                        <div className="flex flex-col gap-2">
                           <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Internal Thread Latency</span>
                           <LinearProgress value={40} className="h-2 bg-white/10" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Chip label="LATENCY OK" variant="filter" selected className="bg-emerald-500 text-white border-none" />
                            <Chip label="NODE_01_STABLE" variant="suggestion" className="border-white/20 text-stone-400" />
                        </div>
                   </Card>
                </div>
            </section>
          </div>
        );
      case 'forms':
        return (
          <div className="flex flex-col gap-12 animate-in fade-in duration-500">
            <section className="flex flex-col gap-8">
                <Typography variant="titleLarge" className="font-black text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-4">05. Data Entry Registry</Typography>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="flex flex-col gap-6">
                        <Typography variant="labelSmall" className="font-black text-stone-400 uppercase">Input Architecture</Typography>
                        <TextField label="PROTOCOL IDENTITY" placeholder="PRT-XXXX" labelClassName="bg-white" />
                        <TextField label="INSTANCE LOG" multiline rows={3} labelClassName="bg-white" />
                        <div className="grid grid-cols-2 gap-4">
                           <TextField label="VALUATION" type="number" leadingIcon={<span className="font-black text-stone-400">₹</span>} labelClassName="bg-white" />
                           <Select label="LOGIC SEGMENT" value="Ind" options={[{label: 'Industrial', value: 'Ind'}]} onChange={()=>{}} />
                        </div>
                   </div>
                   <div className="flex flex-col gap-8">
                        <Typography variant="labelSmall" className="font-black text-stone-400 uppercase">Interactive Overlays</Typography>
                        <div className="grid grid-cols-2 gap-4">
                           <Button variant="outlined" className="h-20 flex-col gap-1 rounded-xs" onClick={() => openSheet('md')}>
                              <span className="text-[10px] font-black">TRIGGER SHEET</span>
                              <span className="text-[8px] opacity-40">WORKSPACE MD</span>
                           </Button>
                           <Button variant="outlined" className="h-20 flex-col gap-1 rounded-xs" onClick={() => openSheet('lg')}>
                              <span className="text-[10px] font-black">DOCUMENT FOCUS</span>
                              <span className="text-[8px] opacity-40">WORKSPACE LG</span>
                           </Button>
                        </div>
                        <div className="p-8 border-2 border-dashed border-stone-200 rounded-xs flex flex-col items-center justify-center text-center gap-4 text-stone-300 group hover:border-primary/40 transition-colors">
                           <Icons.Search size={40} strokeWidth={1} />
                           <Typography variant="labelSmall" className="font-black uppercase tracking-[4px]">Advanced Search Surface</Typography>
                        </div>
                   </div>
                </div>
            </section>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <RegistryHeader 
        variant="full"
        label="Registry: Documentation"
        title="Component Lab"
        hideSearch
        subHeader={
          <div className="flex flex-col gap-4">
             <Typography variant="bodyLarge" className="text-stone-400 font-bold max-w-2xl leading-relaxed">
                The visual identity of **Stone Edition** is defined by geometric precision and high data-density.
             </Typography>
             <Tabs value={activeGalleryTab} onValueChange={setActiveGalleryTab} className="mt-2">
                <TabsList className="bg-transparent border-none p-0 h-auto gap-12 justify-start overflow-x-auto no-scrollbar">
                    <TabsTrigger value="atomic" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all">01. ATOMIC COMMANDS</TabsTrigger>
                    <TabsTrigger value="data" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all">02. VISUAL INTELLIGENCE</TabsTrigger>
                    <TabsTrigger value="forms" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all">03. REGISTRY INPUTS</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-8 md:p-12">
          <div className="max-w-[1400px] mx-auto w-full">
            {renderContent()}
          </div>
      </main>

      <Sheet
        open={sheetState.open}
        onClose={() => setSheetState({ ...sheetState, open: false })}
        size={sheetState.size}
        title={`${sheetState.size.toUpperCase()} WORKSPACE INSTANCE`}
        icon={<Icons.Terminal />}
        footerLeft={
          <div className="flex flex-col">
             <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px] tracking-tight">Financial Summary</Typography>
             <Typography variant="titleMedium" className="font-black text-primary">₹1,24,500.00</Typography>
          </div>
        }
        footerRight={
          <>
            <Button variant="text" onClick={() => setSheetState({ ...sheetState, open: false })} className="font-black">DISCARD</Button>
            <Button variant="filled" className="px-10 shadow-2 bg-stone-900 font-black">COMMIT RECORD</Button>
          </>
        }
      >
        <div className="p-10 flex flex-col gap-10">
           <section className="flex flex-col gap-4">
              <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter">Instance Context</Typography>
              <Typography variant="bodyLarge" className="text-stone-500 leading-relaxed max-w-2xl">
                This is a representation of a workspace sheet. Notice the emphasized micro-motion and the split footer architecture.
              </Typography>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="INSTANCE ID" defaultValue="SYS-PROT-9921" disabled labelClassName="bg-white" />
              <TextField label="OPERATOR LOG" placeholder="Enter notes..." labelClassName="bg-white" />
           </div>

           <Card variant="filled" className="bg-stone-900 text-white p-8 relative overflow-hidden group border-none shadow-3 rounded-xs">
              <div className="relative z-10">
                 <Typography variant="labelSmall" className="text-primary-container font-black uppercase">System Analytics</Typography>
                 <Typography variant="bodyLarge" className="mt-4 font-bold text-stone-300 italic border-l-2 border-primary-container pl-6">
                    "AI has identified a 12.5% increase in operational efficiency when utilizing this large-format sheet."
                 </Typography>
              </div>
              <div className="absolute top-0 right-0 w-32 h-full bg-primary/20 blur-3xl rounded-full translate-x-10 -translate-y-10" />
           </Card>

           <div className="h-[300px] border border-dashed border-stone-200 rounded-xs flex items-center justify-center text-stone-200">
              <Typography variant="labelMedium" className="font-black uppercase tracking-[10px]">RESERVED WORKSPACE AREA</Typography>
           </div>
        </div>
      </Sheet>
    </div>
  );
};
