import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Stepper } from '../../ui/Stepper';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';

export const OnboardingWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    { label: 'IDENTITY', description: 'Legal Registry' },
    { label: 'FISCAL', description: 'Tax & Period' },
    { label: 'POLICIES', description: 'Stock Logic' },
    { label: 'INITIALIZE', description: 'Final Commit' }
  ];

  return (
    <div className="fixed inset-0 z-[5000] bg-white flex flex-col animate-in fade-in duration-500">
      <header className="h-20 border-b border-stone-200 px-8 flex items-center justify-between bg-stone-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-900 rounded-xs flex items-center justify-center text-primary shadow-2">
            <Icon symbol="rocket_launch" size={24} />
          </div>
          <Typography variant="titleMedium" className="font-black text-stone-900 uppercase">System Initialization</Typography>
        </div>
        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Workspace Protocol v1.0</Typography>
      </header>

      <main className="flex-1 overflow-y-auto p-12">
        <div className="max-w-4xl mx-auto flex flex-col gap-16">
          <Stepper steps={steps} activeStep={activeStep} />

          {activeStep === 0 && (
            <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col gap-2">
                  <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Business Identity</Typography>
                  <Typography variant="bodyLarge" className="text-stone-500 font-bold uppercase text-sm">Define the primary legal entity for this tenant.</Typography>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField label="TRADING NAME" placeholder="e.g. Unisane Granite Hub" labelBg="bg-white" />
                  <TextField label="GSTIN (INDIA)" placeholder="27XXXXX..." labelBg="bg-white" />
                  <TextField label="PRIMARY EMAIL" placeholder="admin@workspace.com" labelBg="bg-white" />
                  <TextField label="CONTACT NO" placeholder="+91" labelBg="bg-white" />
               </div>
               <TextField label="REGISTERED ADDRESS" multiline rows={3} labelBg="bg-white" />
            </div>
          )}

          {activeStep === 1 && (
            <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col gap-2">
                  <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Financial Parameters</Typography>
                  <Typography variant="bodyLarge" className="text-stone-500 font-bold uppercase text-sm">Configure the accounting timeline and currency.</Typography>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Select label="FISCAL YEAR START" value="April" options={[{label: 'April', value: 'April'}, {label: 'January', value: 'Jan'}]} onChange={()=>{}} />
                  <Select label="BASE CURRENCY" value="INR" options={[{label: 'INR (₹)', value: 'INR'}, {label: 'USD ($)', value: 'USD'}]} onChange={()=>{}} />
                  <Select label="DATE FORMAT" value="DD-MM-YYYY" options={[{label: 'DD-MM-YYYY', value: 'DD-MM-YYYY'}]} onChange={()=>{}} />
                  <Select label="TAXATION SCHEME" value="GST" options={[{label: 'GST (VAT Compatible)', value: 'GST'}]} onChange={()=>{}} />
               </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="flex flex-col items-center justify-center gap-8 py-20 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Icons.Check size={48} />
               </div>
               <div className="text-center">
                  <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Protocol Validated</Typography>
                  <Typography variant="bodyLarge" className="text-stone-500 font-bold uppercase mt-2 max-w-sm">
                    System is ready to allocate tenant resources. Commit to finalize.
                  </Typography>
               </div>
            </div>
          )}
        </div>
      </main>

      <footer className="h-24 border-t border-stone-200 px-12 bg-white flex items-center justify-between shrink-0">
        <Button variant="text" size="md" onClick={() => setActiveStep(s => Math.max(0, s - 1))} disabled={activeStep === 0} className="font-black">PREVIOUS</Button>
        <div className="flex gap-4">
           {activeStep < steps.length - 1 ? (
             <Button variant="filled" size="md" className="px-12 shadow-2 font-black" onClick={() => setActiveStep(s => s + 1)}>NEXT PROTOCOL</Button>
           ) : (
             <Button variant="filled" size="md" className="px-12 shadow-2 font-black" onClick={onComplete}>COMMIT & INITIATE</Button>
           )}
        </div>
      </footer>
    </div>
  );
};