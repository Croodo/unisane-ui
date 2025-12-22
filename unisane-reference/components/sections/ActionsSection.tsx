import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Fab } from '../ui/Fab';
import { SegmentedButton } from '../ui/SegmentedButton';
import { SplitButton } from '../ui/SplitButton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuRadioItem } from '../ui/DropdownMenu';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';
import { MenuBar, MenuBarMenu, MenuBarItem, MenuBarSeparator } from '../ui/MenuBar';
import { HoverCard } from '../ui/HoverCard';
import { Rating } from '../ui/Rating';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Toolbar, ToolbarSeparator } from '../ui/Toolbar';

// Using Material Symbols for Actions
const Icons = {
  Add: (props: any) => <Icon symbol="add" {...props} />,
  Edit: (props: any) => <Icon symbol="edit" {...props} />,
  Favorite: (props: any) => <Icon symbol="favorite" {...props} />, 
  Share: (props: any) => <Icon symbol="share" {...props} />,
  ViewList: (props: any) => <Icon symbol="view_list" {...props} />,
  ViewModule: (props: any) => <Icon symbol="view_module" {...props} />,
  MoreVert: (props: any) => <Icon symbol="more_vert" {...props} />,
  Logout: (props: any) => <Icon symbol="logout" {...props} />,
  Refresh: (props: any) => <Icon symbol="refresh" {...props} />,
  Save: (props: any) => <Icon symbol="save" {...props} />,
  ArrowBack: (props: any) => <Icon symbol="arrow_back" {...props} />,
  Check: (props: any) => <Icon symbol="check" {...props} />,
  Sort: (props: any) => <Icon symbol="sort" {...props} />,
  Send: (props: any) => <Icon symbol="send" {...props} />,
  Filter: (props: any) => <Icon symbol="filter_list" {...props} />,
  FormatBold: (props: any) => <Icon symbol="format_bold" {...props} />,
  FormatItalic: (props: any) => <Icon symbol="format_italic" {...props} />,
  FormatUnderline: (props: any) => <Icon symbol="format_underlined" {...props} />,
  FormatColorText: (props: any) => <Icon symbol="format_color_text" {...props} />,
  ContentCopy: (props: any) => <Icon symbol="content_copy" {...props} />,
  Delete: (props: any) => <Icon symbol="delete" {...props} />,
};

export const ActionsSection = () => {
  const [view, setView] = useState('list');
  const [days, setDays] = useState(['mon']);
  const [rating, setRating] = useState(3);
  
  // Dropdown States
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  return (
    <section className="flex flex-col gap-8">
      <Typography variant="headlineMedium">Actions & Interaction</Typography>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Buttons */}
        <div className="p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 flex flex-col gap-6">
          <Typography variant="titleLarge">Common Buttons</Typography>
          <div className="flex flex-wrap gap-3 md:gap-4 items-center">
            <Button variant="filled">Filled</Button>
            <Button variant="tonal">Tonal</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
            <Button variant="elevated">Elevated</Button>
          </div>
          <div className="h-px bg-outline-variant/20 w-full" />
          <Typography variant="titleMedium">Split Buttons</Typography>
          <div className="flex flex-wrap gap-4 items-center">
             <SplitButton 
                variant="filled" 
                label="Post" 
                onClick={() => console.log('Post')}
                menuContent={
                    <>
                        <DropdownMenuItem label="Schedule Post" leadingIcon={<Icons.Edit />} />
                        <DropdownMenuItem label="Save Draft" leadingIcon={<Icons.Save />} />
                    </>
                } 
             />
             <SplitButton 
                variant="outlined" 
                label="Merge" 
                onClick={() => console.log('Merge')}
                menuContent={
                    <>
                        <DropdownMenuItem label="Squash and merge" />
                        <DropdownMenuItem label="Rebase and merge" />
                    </>
                } 
             />
             <SplitButton 
                variant="tonal" 
                label="Run" 
                leadingIcon={<Icon symbol="play_arrow" />}
                menuContent={
                    <>
                        <DropdownMenuItem label="Run with Debugger" />
                        <DropdownMenuItem label="Run Settings..." />
                    </>
                } 
             />
          </div>
        </div>

        {/* Toolbars */}
        <div className="p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 flex flex-col gap-6">
           <Typography variant="titleLarge">Toolbars</Typography>
           <div className="flex flex-col gap-8">
               
               <div className="flex flex-col gap-2">
                   <Typography variant="bodyMedium" className="text-on-surface-variant">Standard (Surface)</Typography>
                   <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 h-32 flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]">
                       <Toolbar>
                           <IconButton variant="standard" aria-label="Bold"><Icons.FormatBold /></IconButton>
                           <IconButton variant="standard" aria-label="Italic"><Icons.FormatItalic /></IconButton>
                           <IconButton variant="standard" aria-label="Underline"><Icons.FormatUnderline /></IconButton>
                           <ToolbarSeparator />
                           <IconButton variant="standard" aria-label="Color"><Icons.FormatColorText /></IconButton>
                       </Toolbar>
                   </div>
               </div>

               <div className="flex flex-col gap-2">
                   <Typography variant="bodyMedium" className="text-on-surface-variant">Inverse (Contextual)</Typography>
                   <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 h-32 flex items-center justify-center relative">
                       <p className="text-lg font-serif italic text-on-surface">"Design is intelligence made visible."</p>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%]">
                           <Toolbar variant="inverse">
                               <IconButton variant="standard" className="text-inverse-on-surface hover:bg-inverse-on-surface/10" aria-label="Copy"><Icons.ContentCopy /></IconButton>
                               <ToolbarSeparator className="bg-inverse-on-surface/20" />
                               <IconButton variant="standard" className="text-inverse-on-surface hover:bg-inverse-on-surface/10" aria-label="Share"><Icons.Share /></IconButton>
                               <IconButton variant="standard" className="text-inverse-on-surface hover:bg-inverse-on-surface/10" aria-label="Delete"><Icons.Delete /></IconButton>
                               <ToolbarSeparator className="bg-inverse-on-surface/20" />
                               <IconButton variant="standard" className="text-inverse-on-surface hover:bg-inverse-on-surface/10" aria-label="More"><Icons.MoreVert /></IconButton>
                           </Toolbar>
                       </div>
                   </div>
               </div>

           </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 flex flex-col gap-6">
           <Typography variant="titleLarge">Floating Action Buttons</Typography>
           <div className="flex flex-wrap gap-6 items-end">
              <div className="flex flex-col items-center gap-2">
                 <Fab size="sm" variant="secondary" icon={<Icons.Add />} />
                 <span className="text-xs text-on-surface-variant">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <Fab size="md" variant="primary" icon={<Icons.Add />} />
                 <span className="text-xs text-on-surface-variant">Standard</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <Fab size="lg" variant="tertiary" icon={<Icons.Add />} />
                 <span className="text-xs text-on-surface-variant">Large</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <Fab variant="surface" icon={<Icons.Edit />} label="Compose" />
                 <span className="text-xs text-on-surface-variant">Extended</span>
              </div>
           </div>
        </div>

        {/* Segmented Buttons */}
        <div className="p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 flex flex-col gap-8">
           <div className="flex flex-col gap-6">
              <Typography variant="titleLarge">Segmented Buttons</Typography>
              
              <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-on-surface-variant">Single Select</span>
                      <SegmentedButton 
                        value={view}
                        onChange={setView}
                        options={[
                            { value: 'list', label: 'List', icon: <Icons.ViewList /> },
                            { value: 'grid', label: 'Grid', icon: <Icons.ViewModule /> },
                            { value: 'map', label: 'Map', icon: <Icon symbol="map" /> },
                        ]}
                      />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-on-surface-variant">Multi Select</span>
                      <SegmentedButton 
                        multiSelect
                        value={days}
                        onChange={setDays}
                        options={[
                            { value: 'mon', label: 'Mon' },
                            { value: 'tue', label: 'Tue' },
                            { value: 'wed', label: 'Wed' },
                            { value: 'thu', label: 'Thu' },
                            { value: 'fri', label: 'Fri', disabled: true },
                        ]}
                      />
                  </div>
              </div>
           </div>
           
           <div className="flex flex-col gap-6">
              <Typography variant="titleLarge">Icon Buttons</Typography>
              <div className="flex flex-wrap gap-4 items-center">
                  <IconButton variant="standard" aria-label="Favorite"><Icons.Favorite /></IconButton>
                  <IconButton variant="filled" selected aria-label="Favorite Selected"><Icons.Favorite filled /></IconButton>
                  <IconButton variant="tonal" aria-label="Share"><Icons.Share /></IconButton>
                  <IconButton variant="outlined"><Icons.Filter /></IconButton>
              </div>
           </div>
        </div>

        {/* Menus & Overlays */}
        <div className="p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 flex flex-col gap-6 xl:col-span-2">
            <Typography variant="titleLarge">Menus & Overlays</Typography>
            
            <div className="flex flex-wrap gap-6 items-start">
                {/* Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button variant="outlined" icon={<Icons.MoreVert />}>Options</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem label="Account Settings" leadingIcon={<Icons.Edit />} />
                        <DropdownMenuItem label="Share" leadingIcon={<Icons.Share />} />
                        <DropdownMenuSeparator />
                        <div className="px-3 py-1.5 text-xs font-medium text-on-surface-variant">View Options</div>
                        <DropdownMenuCheckboxItem 
                            label="Show Status Bar" 
                            checked={showStatusBar} 
                            onClick={() => setShowStatusBar(!showStatusBar)} 
                        />
                        <DropdownMenuCheckboxItem 
                            label="Show Line Numbers" 
                            checked={showLineNumbers} 
                            onClick={() => setShowLineNumbers(!showLineNumbers)} 
                        />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem label="Log out" leadingIcon={<Icons.Logout />} className="text-error" />
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Context Menu Area */}
                <ContextMenu>
                    <ContextMenuTrigger className="w-40 h-24 border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors">
                        <span className="text-sm text-on-surface-variant">Right click me</span>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                         <ContextMenuItem label="Back" leadingIcon={<Icons.ArrowBack />} />
                         <ContextMenuItem label="Reload" leadingIcon={<Icons.Refresh />} />
                         <ContextMenuSeparator />
                         <ContextMenuItem label="Save As..." leadingIcon={<Icons.Save />} />
                    </ContextMenuContent>
                </ContextMenu>

                {/* Hover Card */}
                <HoverCard trigger={<span className="underline cursor-help text-primary font-medium mt-2 block">Hover me</span>}>
                    <div className="flex gap-4">
                        <Avatar fallback="UI" />
                        <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-semibold">Unisane UI</h4>
                            <p className="text-xs text-on-surface-variant">
                                A modern Material 3 design system built with React and Tailwind CSS.
                            </p>
                        </div>
                    </div>
                </HoverCard>
                
                 {/* Rating */}
                <div className="flex items-center gap-4 border border-outline-variant/40 p-4 rounded-xl">
                    <span className="text-sm font-medium">Rating:</span>
                    <Rating value={rating} onChange={setRating} />
                </div>
            </div>

            {/* Menu Bar */}
            <div className="mt-2">
                <MenuBar>
                    <MenuBarMenu trigger="File">
                        <MenuBarItem label="New File" />
                        <MenuBarItem label="Open File..." />
                        <MenuBarSeparator />
                        <MenuBarItem label="Exit" />
                    </MenuBarMenu>
                    <MenuBarMenu trigger="Edit">
                        <MenuBarItem label="Undo" />
                        <MenuBarItem label="Redo" />
                    </MenuBarMenu>
                </MenuBar>
            </div>
        </div>
      </div>
    </section>
  );
};
