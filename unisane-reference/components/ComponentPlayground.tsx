
import React, { useState } from 'react';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { TextField } from './ui/TextField';
import { Select } from './ui/Select';
import { Checkbox, Radio, Switch } from './ui/SelectionControls';
import { Slider } from './ui/Slider';
import { Badge } from './ui/Badge';
import { Chip } from './ui/Chip';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { Icons } from './business/Icons';
import { Icon } from './ui/Icon';
import { LinearProgress, CircularProgress } from './ui/Progress';
import { SegmentedButton } from './ui/SegmentedButton';
import { Divider } from './ui/Divider';
import { cn } from '../lib/utils';

const PlaygroundSection = ({ title, children, description }: any) => (
  <div className="flex flex-col gap-8 pb-16 border-b border-stone-100 last:border-0">
    <div className="flex flex-col gap-2">
      <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter">{title}</Typography>
      {description && <Typography variant="bodyMedium" className="text-stone-400 font-bold uppercase text-xs">{description}</Typography>}
    </div>
    <div className="flex flex-wrap gap-10 items-start">
      {children}
    </div>
  </div>
);

const AtomicBox = ({ label, children, className }: any) => (
  <div className={cn("flex flex-col gap-4", className)}>
    <Typography variant="labelSmall" className="text-stone-300 font-black uppercase tracking-widest text-[9px]">{label}</Typography>
    <div className="flex flex-wrap gap-4 items-center">
      {children}
    </div>
  </div>
);

export const ComponentPlayground = () => {
  const [activeTab, setActiveTab] = useState('atoms');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden @container">
      <header className="px-8 py-12 md:px-12 bg-stone-900 text-white shrink-0">
          <div className="flex flex-col gap-2">
            <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-[0.4em]">Design Protocol</Typography>
            <Typography variant="displaySmall" className="font-black uppercase tracking-tighter text-white">Component Playground</Typography>
          </div>
          <div className="mt-10">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-transparent border-none p-0 h-auto gap-12 justify-start">
                    <TabsTrigger value="atoms" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all">01. ATOMIC COMMANDS</TabsTrigger>
                    <TabsTrigger value="molecules" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all">02. MOLECULAR LOGIC</TabsTrigger>
                    <TabsTrigger value="visual" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all">03. VISUAL SYSTEMS</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 md:p-16 scroll-smooth">
          <div className="max-w-6xl mx-auto flex flex-col gap-2">
              
              {activeTab === 'atoms' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-12">
                   <PlaygroundSection title="Action Triggers" description="The primary interaction layer for organizational commands.">
                      <AtomicBox label="Buttons / Standard">
                        <Button variant="filled">FILLED</Button>
                        <Button variant="outlined">OUTLINED</Button>
                        <Button variant="tonal">TONAL</Button>
                        <Button variant="text">TEXT</Button>
                      </AtomicBox>
                      <AtomicBox label="Buttons / Sized">
                        <Button size="sm" variant="filled">SMALL</Button>
                        <Button size="md" variant="filled">MEDIUM</Button>
                        <Button size="lg" variant="filled">LARGE_PROTOCOL</Button>
                      </AtomicBox>
                      <AtomicBox label="Icon Targets">
                        <IconButton variant="filled" className="bg-stone-900"><Icons.Search /></IconButton>
                        <IconButton variant="outlined"><Icons.Edit /></IconButton>
                        <IconButton variant="tonal"><Icons.Delete /></IconButton>
                        <IconButton variant="standard"><Icons.Notifications /></IconButton>
                      </AtomicBox>
                   </PlaygroundSection>

                   <PlaygroundSection title="Selection Protocol" description="Structural inputs for registry filtering and boolean state.">
                      <AtomicBox label="Binary Toggle">
                        <Switch defaultChecked />
                        <Switch icons defaultChecked />
                        <Switch disabled />
                      </AtomicBox>
                      <AtomicBox label="Check & Match">
                        <Checkbox defaultChecked />
                        <Checkbox indeterminate />
                        <Checkbox label="Authorized" />
                      </AtomicBox>
                      <AtomicBox label="Scaling (Sliders)">
                         <div className="w-64 flex flex-col gap-8">
                            <Slider defaultValue={75} />
                            <Slider defaultValue={4} min={0} max={10} step={1} withTicks withLabel />
                         </div>
                      </AtomicBox>
                   </PlaygroundSection>
                </div>
              )}

              {activeTab === 'molecules' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-12">
                   <PlaygroundSection title="Data Entry Surfaces" description="High-density input groups for commercial document generation.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
                         <div className="flex flex-col gap-6">
                            <TextField label="PROTOCOL IDENTITY" defaultValue="PRT-4421-X" labelClassName="bg-white" />
                            <div className="grid grid-cols-2 gap-4">
                               <TextField label="VALUATION" type="number" leadingIcon={<span className="font-black text-stone-400">₹</span>} labelClassName="bg-white" />
                               <Select label="LOGIC GROUP" value="Industrial" options={[{label: 'Industrial', value: 'Industrial'}]} onChange={()=>{}} />
                            </div>
                            <TextField label="AUDIT NOTES" multiline rows={3} labelClassName="bg-white" />
                         </div>
                         <div className="flex flex-col gap-6">
                            <Typography variant="labelSmall" className="text-stone-300 font-black uppercase">Segmented Commands</Typography>
                            <SegmentedButton 
                                value="opt1" 
                                onChange={()=>{}} 
                                options={[
                                    { value: 'opt1', label: 'INBOUND', icon: <Icon symbol="download" /> },
                                    { value: 'opt2', label: 'OUTBOUND', icon: <Icon symbol="upload" /> },
                                    { value: 'opt3', label: 'INTERNAL', icon: <Icon symbol="sync" /> }
                                ]} 
                            />
                            <div className="p-8 border-2 border-dashed border-stone-100 rounded-xs flex flex-col items-center justify-center text-stone-200">
                                <Icon symbol="cloud_upload" size={48} strokeWidth={1} />
                                <span className="text-[10px] font-black uppercase tracking-[6px] mt-4">Drop Registry Archive</span>
                            </div>
                         </div>
                      </div>
                   </PlaygroundSection>

                   <PlaygroundSection title="Containment Architecture" description="Standardized surfaces for information density control.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                         <Card variant="outlined" className="p-6 bg-white border-stone-200 shadow-sm">
                            <Typography variant="titleSmall" className="font-black uppercase text-stone-900">Outlined Container</Typography>
                            <Typography variant="bodySmall" className="text-stone-500 font-bold uppercase mt-2">Low emphasis registry surface.</Typography>
                         </Card>
                         <Card variant="filled" className="p-6 bg-stone-50 border-none">
                            <Typography variant="titleSmall" className="font-black uppercase text-stone-900">Filled Surface</Typography>
                            <Typography variant="bodySmall" className="text-stone-500 font-bold uppercase mt-2">Secondary information group.</Typography>
                         </Card>
                         <Card variant="filled" className="p-6 bg-stone-900 text-white border-none shadow-3">
                            <Typography variant="titleSmall" className="font-black uppercase text-primary-container">Emphasized Node</Typography>
                            <Typography variant="bodySmall" className="text-stone-500 font-bold uppercase mt-2">Primary call to organizational action.</Typography>
                         </Card>
                      </div>
                   </PlaygroundSection>
                </div>
              )}

              {activeTab === 'visual' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-12">
                   <PlaygroundSection title="Communication Feedback" description="Live status indicators and system health monitoring.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                         <div className="flex flex-col gap-10 p-8 bg-stone-50 rounded-xs border border-stone-100">
                             <div className="flex items-center gap-6">
                                <CircularProgress value={65} />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-stone-800 uppercase">Audit Engine Status</span>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase">Processing Ledger Layers...</span>
                                </div>
                             </div>
                             <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Internal Thread Latency</span>
                                <LinearProgress value={40} />
                             </div>
                         </div>
                         <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4">
                                <Chip label="PROTOCOL_OK" variant="filter" selected className="bg-emerald-500 text-white border-none" />
                                <Chip label="SYNC_PENDING" variant="filter" className="bg-amber-100 text-amber-700 border-none" />
                                <Chip label="ISO_VERIFIED" icon={<Icons.Check />} />
                            </div>
                            <div className="flex gap-8 mt-6 items-center">
                               <Badge value={8}><Icons.Notifications size={28} className="text-stone-400" /></Badge>
                               <Badge variant="small"><Icons.Terminal size={28} className="text-stone-400" /></Badge>
                               <Badge value="NEW" className="bg-primary text-white text-[8px] px-2 h-4"><Icons.Inventory size={28} className="text-stone-400" /></Badge>
                            </div>
                         </div>
                      </div>
                   </PlaygroundSection>
                </div>
              )}

          </div>
      </main>
    </div>
  );
};
