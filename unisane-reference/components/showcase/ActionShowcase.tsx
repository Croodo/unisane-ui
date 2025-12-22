import React from 'react';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Fab } from '../ui/Fab';
import { SplitButton } from '../ui/SplitButton';
import { SegmentedButton } from '../ui/SegmentedButton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '../ui/DropdownMenu';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';
import { MenuBar, MenuBarMenu, MenuBarItem, MenuBarSeparator } from '../ui/MenuBar';
import { HoverCard } from '../ui/HoverCard';
import { Toolbar, ToolbarButton, ToolbarSeparator } from '../ui/Toolbar';
import { Icons } from '../business/Icons';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/Avatar';
import { ShowcaseSection, ComponentBlock } from './Shared';

export const ActionShowcase = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <ShowcaseSection title="Buttons" description="The primary trigger for operations. Available in five hierarchy levels.">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <ComponentBlock label="Variants">
                <Button variant="filled">Filled</Button>
                <Button variant="tonal">Tonal</Button>
                <Button variant="outlined">Outlined</Button>
                <Button variant="text">Text</Button>
                <Button variant="elevated">Elevated</Button>
            </ComponentBlock>
            <ComponentBlock label="Sizes & Icons">
                <Button size="sm" variant="filled">Small</Button>
                <Button size="md" variant="filled" icon={<Icons.Add />}>Icon</Button>
                <Button size="lg" variant="filled">Large</Button>
                <Button disabled>Disabled</Button>
            </ComponentBlock>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Complex Triggers" description="Advanced interaction patterns for dense UI areas.">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <ComponentBlock label="Icon Buttons">
                <IconButton variant="filled"><Icons.Search /></IconButton>
                <IconButton variant="tonal"><Icons.Edit /></IconButton>
                <IconButton variant="outlined"><Icons.Filter /></IconButton>
                <IconButton variant="standard"><Icons.More /></IconButton>
            </ComponentBlock>
            <ComponentBlock label="FABs (Floating Action)">
                <Fab variant="primary" icon={<Icons.Add />} />
                <Fab variant="secondary" size="sm" icon={<Icon symbol="edit" />} />
                <Fab variant="surface" icon={<Icon symbol="navigation" />} label="Extended" />
            </ComponentBlock>
            <ComponentBlock label="Split & Segmented">
                <SplitButton label="Launch" menuContent={<DropdownMenuItem label="Debug Mode" />} />
                <SegmentedButton 
                    value="list" 
                    onChange={()=>{}} 
                    options={[
                        { value: 'list', icon: <Icon symbol="list" /> },
                        { value: 'grid', icon: <Icon symbol="grid_view" /> }
                    ]} 
                />
            </ComponentBlock>
            <ComponentBlock label="Toolbars">
                <Toolbar>
                    <ToolbarButton active><Icon symbol="format_bold" size={18} /></ToolbarButton>
                    <ToolbarButton><Icon symbol="format_italic" size={18} /></ToolbarButton>
                    <ToolbarSeparator />
                    <ToolbarButton><Icon symbol="format_color_text" size={18} /></ToolbarButton>
                </Toolbar>
            </ComponentBlock>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Menus & Overlays" description="Contextual actions revealed on interaction.">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ComponentBlock label="Dropdown Menu" className="items-start">
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button variant="outlined" icon={<Icons.Menu />}>OPEN MENU</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem label="Account Settings" leadingIcon={<Icons.Edit />} />
                        <DropdownMenuItem label="System Preferences" leadingIcon={<Icons.Settings />} />
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked label="Show Status Bar" />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem label="Log Out" leadingIcon={<Icon symbol="logout" />} className="text-error" />
                    </DropdownMenuContent>
                </DropdownMenu>
            </ComponentBlock>

            <ComponentBlock label="Context Menu (Right Click)">
                <ContextMenu>
                    <ContextMenuTrigger className="w-full h-32 border-2 border-dashed border-stone-200 rounded-xs flex items-center justify-center bg-stone-50 cursor-context-menu hover:bg-stone-100 transition-colors">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Right Click Area</span>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem label="Back" leadingIcon={<Icon symbol="arrow_back" />} />
                        <ContextMenuItem label="Forward" leadingIcon={<Icon symbol="arrow_forward" />} disabled />
                        <ContextMenuSeparator />
                        <ContextMenuItem label="Reload Frame" leadingIcon={<Icon symbol="refresh" />} />
                    </ContextMenuContent>
                </ContextMenu>
            </ComponentBlock>

            <ComponentBlock label="Menu Bar">
                <MenuBar>
                    <MenuBarMenu trigger="File">
                        <MenuBarItem label="New File" />
                        <MenuBarItem label="Open..." />
                        <MenuBarSeparator />
                        <MenuBarItem label="Exit" />
                    </MenuBarMenu>
                    <MenuBarMenu trigger="Edit">
                        <MenuBarItem label="Undo" />
                        <MenuBarItem label="Redo" />
                    </MenuBarMenu>
                    <MenuBarMenu trigger="View">
                        <MenuBarItem label="Zoom In" />
                    </MenuBarMenu>
                </MenuBar>
            </ComponentBlock>

            <ComponentBlock label="Hover Card">
                <HoverCard trigger={<Button variant="text">HOVER FOR INFO</Button>}>
                    <div className="flex gap-4">
                        <Avatar fallback="UI" />
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-stone-900">System Kernel</span>
                            <span className="text-xs text-stone-500 leading-relaxed">Core processing unit for the Unisane ERP architecture. Maintains registry integrity.</span>
                        </div>
                    </div>
                </HoverCard>
            </ComponentBlock>
         </div>
      </ShowcaseSection>
    </div>
  );
};
