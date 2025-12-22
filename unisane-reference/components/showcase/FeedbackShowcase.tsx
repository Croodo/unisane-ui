import React, { useState } from 'react';
import { Alert } from '../ui/Alert';
import { Banner } from '../ui/Banner';
import { LinearProgress, CircularProgress } from '../ui/Progress';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Snackbar } from '../ui/Snackbar';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { BottomSheet } from '../ui/BottomSheet';
import { Tooltip } from '../ui/Tooltip';
import { ShowcaseSection, ComponentBlock } from './Shared';
import { Icons } from '../business/Icons';

export const FeedbackShowcase = () => {
  const [snack, setSnack] = useState(false);
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);

  return (
    <div className="animate-in fade-in duration-500">
      <ShowcaseSection title="System States" description="Indicators for loading, empty, and critical states.">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ComponentBlock label="Progress Indicators">
                <div className="flex flex-col gap-8 w-full max-w-xs">
                    <LinearProgress value={45} />
                    <div className="flex items-center gap-4">
                        <CircularProgress value={75} />
                        <CircularProgress /> {/* Indeterminate */}
                    </div>
                </div>
            </ComponentBlock>
            <ComponentBlock label="Loading Skeletons">
                <div className="flex flex-col gap-2 w-full max-w-xs">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width={40} height={40} />
                        <div className="flex-1">
                            <Skeleton variant="text" height={12} className="w-3/4" />
                            <Skeleton variant="text" height={10} className="w-1/2" />
                        </div>
                    </div>
                    <Skeleton variant="rectangular" height={100} className="w-full" />
                </div>
            </ComponentBlock>
         </div>
         <ComponentBlock label="Empty State" className="bg-white">
             <EmptyState title="No Records" description="Initialize a registry to see data." action={<Button variant="tonal">CREATE NEW</Button>} />
         </ComponentBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Messaging & Overlays" description="Interruptive and non-interruptive user communication.">
         <div className="flex flex-col gap-6">
            <Alert variant="info" title="System Info">New protocols available for sync.</Alert>
            <Alert variant="error" title="Critical Error">Connection to node lost.</Alert>
            <Banner icon={<Icons.Warning />} actions={<Button variant="text">FIX</Button>}>
                Subscription expiring in 3 days.
            </Banner>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
             <ComponentBlock label="Contextual Tips">
                 <div className="flex gap-4">
                     <Tooltip label="Simple Tooltip">
                         <Button variant="outlined">HOVER ME</Button>
                     </Tooltip>
                     <Tooltip label="Rich Info" subhead="Metadata" variant="rich">
                         <Button variant="tonal">RICH TIP</Button>
                     </Tooltip>
                 </div>
             </ComponentBlock>

             <ComponentBlock label="Triggers">
                <div className="flex gap-4">
                    <Button onClick={() => setSnack(true)}>SNACKBAR</Button>
                    <Button variant="outlined" onClick={() => setModal(true)}>DIALOG</Button>
                    <Button variant="tonal" onClick={() => setSheet(true)}>SHEET</Button>
                </div>
             </ComponentBlock>
         </div>

         <Snackbar open={snack} message="Operation completed successfully." onClose={() => setSnack(false)} />
         
         <Dialog open={modal} onClose={() => setModal(false)} title="Confirm Action">
            <div className="py-4">Are you sure you want to proceed with this irreversible action?</div>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="text" onClick={() => setModal(false)}>CANCEL</Button>
                <Button variant="filled" onClick={() => setModal(false)}>CONFIRM</Button>
            </div>
         </Dialog>

         <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Mobile Detail">
            <div className="p-4 h-64 flex items-center justify-center bg-stone-50">Sheet Content</div>
         </BottomSheet>
      </ShowcaseSection>
    </div>
  );
};
