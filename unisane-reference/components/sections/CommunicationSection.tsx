import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { Chip } from '../ui/Chip';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Icon } from '../ui/Icon';
import { LinearProgress, CircularProgress } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';
import { IconButton } from '../ui/IconButton';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { Snackbar } from '../ui/Snackbar';
import { BottomSheet } from '../ui/BottomSheet';
import { Dialog } from '../ui/Dialog';

const Icons = {
  Mail: (props: any) => <Icon symbol="mail" {...props} />,
  Notifications: (props: any) => <Icon symbol="notifications" {...props} />,
  ShoppingCart: (props: any) => <Icon symbol="shopping_cart" {...props} />,
  Chat: (props: any) => <Icon symbol="chat" {...props} />,
  Check: (props: any) => <Icon symbol="check" {...props} />,
  Face: (props: any) => <Icon symbol="face" {...props} />,
  Filter: (props: any) => <Icon symbol="filter_list" {...props} />,
  Info: (props: any) => <Icon symbol="info" {...props} />,
  Warning: (props: any) => <Icon symbol="warning" {...props} />,
};

export const CommunicationSection = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(1);
  const [badgeInvisible, setBadgeInvisible] = useState(false);

  return (
    <section className="flex flex-col gap-8">
       <Typography variant="headlineMedium">Communication & Feedback</Typography>
       
       {/* Badge Showcase Landing */}
       <div className="flex flex-col gap-6 p-6 md:p-8 rounded-[24px] bg-surface-container-low border border-outline-variant/20">
           <div className="flex flex-col gap-2">
               <Typography variant="titleLarge">Badges</Typography>
               <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
                   Badges indicate notifications, counts, or status information on navigation items and icons. 
                   Material 3 defines a small dot (6dp) for uncounted notifications and a large stadium shape (16dp) for counts.
               </Typography>
           </div>

           {/* Badge Playground */}
           <div className="flex flex-wrap gap-12 items-center justify-around p-8 bg-surface rounded-xl border border-outline-variant/20 border-dashed">
                {/* Small Badge */}
                <div className="flex flex-col items-center gap-4">
                    <Badge variant="small" invisible={badgeInvisible}>
                        <Icon symbol="mail" size={24} className="text-on-surface-variant" />
                    </Badge>
                    <span className="text-xs font-medium text-on-surface-variant">Small (Dot)</span>
                </div>

                {/* Single Digit */}
                <div className="flex flex-col items-center gap-4">
                    <Badge value={3} invisible={badgeInvisible}>
                        <Icon symbol="notifications" size={24} className="text-on-surface-variant" />
                    </Badge>
                    <span className="text-xs font-medium text-on-surface-variant">Large (1 Digit)</span>
                </div>

                 {/* Multi Digit */}
                <div className="flex flex-col items-center gap-4">
                    <Badge value={32} invisible={badgeInvisible}>
                        <Icon symbol="shopping_cart" size={24} className="text-on-surface-variant" />
                    </Badge>
                    <span className="text-xs font-medium text-on-surface-variant">Large (2 Digits)</span>
                </div>

                 {/* Max Value */}
                <div className="flex flex-col items-center gap-4">
                    <Badge value={1000} max={999} invisible={badgeInvisible}>
                        <Icon symbol="chat" size={24} className="text-on-surface-variant" />
                    </Badge>
                    <span className="text-xs font-medium text-on-surface-variant">Truncated (999+)</span>
                </div>
                
                 {/* On IconButton */}
                <div className="flex flex-col items-center gap-4">
                    <Badge value={badgeCount} position="icon-button" invisible={badgeInvisible}>
                        <IconButton variant="tonal" onClick={() => setBadgeCount(c => c + 1)}>
                            <Icons.Notifications />
                        </IconButton>
                    </Badge>
                    <span className="text-xs font-medium text-on-surface-variant">Icon Button</span>
                </div>
           </div>

           {/* Controls */}
           <div className="flex items-center gap-4 justify-end">
               <Button variant="outlined" onClick={() => setBadgeInvisible(!badgeInvisible)}>
                   {badgeInvisible ? "Show Badges" : "Hide Badges"}
               </Button>
               <Button variant="filled" onClick={() => setBadgeCount(c => c + 1)}>
                   Add Notification ({badgeCount})
               </Button>
           </div>
       </div>

       {/* Banner Demo */}
       <Banner 
          icon={<Icons.Warning />}
          actions={
              <>
                <Button variant="text">Dismiss</Button>
                <Button variant="text">Fix it</Button>
              </>
          }
       >
           This is a banner. It displays important, concise messages that persist until dismissed.
       </Banner>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
           {/* Alerts & Progress */}
           <div className="flex flex-col gap-6 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20">
               <Typography variant="titleLarge">Feedback & Overlays</Typography>
               <div className="flex flex-col gap-4">
                   <Alert variant="info" title="Update available">
                       A new software update is available for download.
                   </Alert>
                   
                   <div className="flex items-center gap-8 py-4">
                       <CircularProgress />
                       <div className="flex-1 flex flex-col gap-2">
                           <LinearProgress value={70} />
                           <LinearProgress />
                       </div>
                   </div>

                   <div className="flex flex-wrap gap-3 mt-2">
                       <Button variant="filled" onClick={() => setSnackbarOpen(true)}>
                           Show Snackbar
                       </Button>
                       <Button variant="outlined" onClick={() => setSheetOpen(true)}>
                           Open Bottom Sheet
                       </Button>
                       <Button variant="tonal" onClick={() => setDialogOpen(true)}>
                           Open Dialog
                       </Button>
                   </div>
               </div>
           </div>

           {/* Chips & Tooltips */}
           <div className="flex flex-col gap-6 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20">
               <div className="flex flex-col gap-6">
                   <Typography variant="titleLarge">Chips</Typography>
                   <div className="flex flex-wrap gap-2">
                       <Chip label="Assist" icon={<Icons.Face />} />
                       <Chip label="Filter" variant="filter" selected icon={<Icons.Check />} />
                       <Chip label="Suggestion" variant="suggestion" />
                       <Chip label="Input" variant="input" onDelete={() => {}} />
                   </div>
               </div>

               <div className="h-px bg-outline-variant/50 w-full" />

               <div className="flex flex-col gap-6">
                   <Typography variant="titleLarge">Tooltips</Typography>
                   <div className="flex flex-wrap gap-8 items-center">
                       <Tooltip label="Plain Tooltip">
                           <IconButton variant="standard"><Icons.Filter /></IconButton>
                       </Tooltip>
                       
                       <Tooltip label="Rich Tooltip" subhead="Subhead" variant="rich">
                           <Chip label="Hover me" />
                       </Tooltip>
                   </div>
               </div>
           </div>
       </div>

       {/* Interactivity Components */}
       <Snackbar 
            open={snackbarOpen} 
            onClose={() => setSnackbarOpen(false)} 
            message="This is a snackbar message."
            actionLabel="Undo"
            onAction={() => alert('Undo clicked')}
       />

       <BottomSheet 
            open={sheetOpen} 
            onClose={() => setSheetOpen(false)}
            title="Bottom Sheet"
       >
            <div className="flex flex-col gap-4">
                <Typography variant="bodyMedium">
                    Bottom sheets display content that supplements the screen's primary content. They are anchored to the bottom of the screen.
                </Typography>
                <Alert variant="info">You can put any content here.</Alert>
                <div className="flex justify-end pt-4">
                     <Button onClick={() => setSheetOpen(false)}>Close</Button>
                </div>
            </div>
       </BottomSheet>

       <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="Confirmation"
            icon={<Icons.Info size={32} />}
            actions={
                <>
                    <Button variant="text" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="text" onClick={() => setDialogOpen(false)}>Confirm</Button>
                </>
            }
       >
           Are you sure you want to proceed with this action? This dialog demonstrates the standard modal overlay behavior.
       </Dialog>
    </section>
  );
};