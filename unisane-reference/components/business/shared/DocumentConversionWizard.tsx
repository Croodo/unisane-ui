import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Sheet } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { TextField } from '../../ui/TextField';
import { Divider } from '../../ui/Divider';
import { Icons } from '../Icons';
import { Stepper } from '../../ui/Stepper';

interface ConversionWizardProps {
  open: boolean;
  onClose: () => void;
  sourceDoc: any;
  targetType: string;
}

export const DocumentConversionWizard: React.FC<ConversionWizardProps> = ({
  open,
  onClose,
  sourceDoc,
  targetType
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'ITM-1': 10,
    'ITM-2': 5
  });

  const steps = [
    { label: 'SELECT ITEMS', description: 'Partial fulfillment' },
    { label: 'BILLING DETAILS', description: 'Verify terms' },
    { label: 'PREVIEW', description: 'Review draft' }
  ];

  const handleNext = () => setActiveStep(s => s + 1);
  const handleBack = () => setActiveStep(s => s - 1);

  return (
    <Sheet 
      open={open} 
      onClose={onClose} 
      title={`CONVERT ${sourceDoc?.id} TO ${targetType.toUpperCase()}`}
      icon={<Icons.File />}
      size="lg"
      footerRight={
        <div className="flex gap-2">
          {activeStep > 0 && <Button variant="text" size="md" onClick={handleBack} className="font-black">BACK</Button>}
          {activeStep < steps.length - 1 ? (
            <Button variant="filled" size="md" onClick={handleNext} className="font-black px-10">NEXT STEP</Button>
          ) : (
            <Button variant="filled" size="md" className="font-black px-10 shadow-2" onClick={onClose}>FINALIZE CONVERSION</Button>
          )}
        </div>
      }
    >
      <div className="p-10 flex flex-col gap-10">
        <Stepper steps={steps} activeStep={activeStep} />

        {activeStep === 0 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="p-6 bg-stone-50 rounded-xs border border-stone-200">
              <Typography variant="titleMedium" className="font-black text-stone-800 uppercase">Item Fulfillment</Typography>
              <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase mt-1">Adjust quantities for partial {targetType.toLowerCase()}</Typography>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { id: 'ITM-1', name: 'Granite Slab (Grey)', ordered: 20, remaining: 10, unit: 'SqFt' },
                { id: 'ITM-2', name: 'Marble Polish', ordered: 5, remaining: 5, unit: 'Ltr' }
              ].map(item => (
                <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_120px] gap-6 items-center p-4 border border-stone-100 rounded-xs bg-white">
                  <div className="flex flex-col">
                    <span className="font-black text-stone-900 text-sm uppercase">{item.name}</span>
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Ordered: {item.ordered} {item.unit}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black text-stone-400 uppercase block">Pending</span>
                    <span className="font-black text-stone-800 tabular-nums">{item.remaining}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black text-stone-400 uppercase block">This Doc</span>
                    <span className="font-black text-primary tabular-nums">{quantities[item.id] || 0}</span>
                  </div>
                  <TextField 
                    type="number" 
                    label="CONVERT" 
                    value={quantities[item.id] || ''} 
                    onChange={e => setQuantities({...quantities, [item.id]: Number(e.target.value)})}
                    labelBg="bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
             <TextField label="BILLING ADDRESS" multiline rows={3} defaultValue={sourceDoc?.address} labelBg="bg-white" />
             <div className="flex flex-col gap-6">
                <TextField label="TRANSPORT VEHICLE NO" placeholder="e.g. MH-04-XX-1234" labelBg="bg-white" />
                <TextField label="E-WAY BILL NO (OPTIONAL)" labelBg="bg-white" />
             </div>
          </div>
        )}
      </div>
    </Sheet>
  );
};