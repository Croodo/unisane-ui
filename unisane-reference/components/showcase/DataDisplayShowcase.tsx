import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { List, ListItem } from '../ui/List';
import { Avatar } from '../ui/Avatar';
import { AvatarGroup } from '../ui/AvatarGroup';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { Statistic } from '../ui/Statistic';
import { Tree } from '../ui/Tree';
import { Icons } from '../business/Icons';
import { Button } from '../ui/Button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui/Accordion';
import { Timeline, TimelineItem } from '../ui/Timeline';
import { DescriptionList, DescriptionItem } from '../ui/DescriptionList';
import { Kbd } from '../ui/Kbd';
import { ShowcaseSection, ComponentBlock } from './Shared';

export const DataDisplayShowcase = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <ShowcaseSection title="Cards & Containers" description="The fundamental building blocks for content grouping.">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="elevated" className="h-64">
                <CardHeader><Typography variant="titleMedium">Elevated</Typography></CardHeader>
                <CardContent><Typography variant="bodyMedium" className="text-stone-500">High emphasis surface with shadow.</Typography></CardContent>
            </Card>
            <Card variant="filled" className="h-64 bg-stone-100 border-none">
                <CardHeader><Typography variant="titleMedium">Filled</Typography></CardHeader>
                <CardContent><Typography variant="bodyMedium" className="text-stone-500">Medium emphasis, no shadow.</Typography></CardContent>
            </Card>
            <Card variant="outlined" className="h-64">
                <CardHeader><Typography variant="titleMedium">Outlined</Typography></CardHeader>
                <CardContent><Typography variant="bodyMedium" className="text-stone-500">Low emphasis, border only.</Typography></CardContent>
            </Card>
         </div>
      </ShowcaseSection>

      <ShowcaseSection title="Collapsible & Temporal" description="Organizing information in vertical stacks.">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <ComponentBlock label="Accordion">
                <Accordion type="single" className="w-full bg-white">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>System Parameters</AccordionTrigger>
                        <AccordionContent>Core logic settings for the active tenant node.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>User Permissions</AccordionTrigger>
                        <AccordionContent>Role-based access control matrix configuration.</AccordionContent>
                    </AccordionItem>
                </Accordion>
            </ComponentBlock>
            
            <ComponentBlock label="Timeline">
                <Timeline>
                    <TimelineItem title="Order Received" time="10:00 AM" status="completed" />
                    <TimelineItem title="Processing" time="10:30 AM" status="active" description="Validation in progress" />
                    <TimelineItem title="Dispatched" status="pending" isLast />
                </Timeline>
            </ComponentBlock>
         </div>
      </ShowcaseSection>

      <ShowcaseSection title="Structured Data" description="Key-value pairs and definition lists.">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <ComponentBlock label="Description List">
                 <DescriptionList className="w-full">
                     <DescriptionItem label="Order ID" value="#ORD-9921" />
                     <DescriptionItem label="Status" value="Processing" />
                     <DescriptionItem label="Total Value" value="₹24,500.00" />
                 </DescriptionList>
             </ComponentBlock>
             <ComponentBlock label="Keyboard Shortcuts">
                 <div className="flex gap-4 items-center">
                     <div className="flex items-center gap-1"><Kbd>⌘</Kbd> + <Kbd>K</Kbd> <span className="text-xs text-stone-400 font-bold ml-2">SEARCH</span></div>
                     <div className="flex items-center gap-1"><Kbd>SHIFT</Kbd> + <Kbd>?</Kbd> <span className="text-xs text-stone-400 font-bold ml-2">HELP</span></div>
                 </div>
             </ComponentBlock>
         </div>
      </ShowcaseSection>

      <ShowcaseSection title="Information Visuals" description="Compact indicators for status and identity.">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ComponentBlock label="Chips">
                <Chip label="Assist" icon={<Icons.Add />} />
                <Chip label="Filter" variant="filter" selected />
                <Chip label="Input" variant="input" onDelete={()=>{}} />
                <Chip label="Suggestion" variant="suggestion" />
            </ComponentBlock>
            <ComponentBlock label="Avatars & Badges">
                <div className="flex items-center gap-6">
                    <Badge value={4}><Avatar fallback="JD" /></Badge>
                    <AvatarGroup size="sm">
                        <Avatar fallback="A" className="bg-primary text-white" />
                        <Avatar fallback="B" />
                        <Avatar fallback="C" />
                    </AvatarGroup>
                    <Badge variant="small" className="bg-emerald-500"><Icons.Notifications /></Badge>
                </div>
            </ComponentBlock>
         </div>
         <ComponentBlock label="Statistics" className="justify-start">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                <Statistic label="Revenue" value="₹42.5k" trend={{value: '12%', direction: 'up'}} />
                <Statistic label="Pending" value="14" variant="filled" icon="pending" />
                <Statistic label="Errors" value="0" variant="low" />
             </div>
         </ComponentBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Lists & Tables" description="Dense data presentation for registries.">
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            <div className="border border-stone-200 rounded-xs overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-stone-50">
                            <TableHead>ID</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-mono text-xs">INV-001</TableCell>
                            <TableCell className="font-bold text-xs uppercase">Elite Builders</TableCell>
                            <TableCell className="text-right font-mono text-xs">₹12,000</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-mono text-xs">INV-002</TableCell>
                            <TableCell className="font-bold text-xs uppercase">Raj Corp</TableCell>
                            <TableCell className="text-right font-mono text-xs">₹8,500</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            
            <div className="border border-stone-200 rounded-xs">
                <List>
                    <ListItem headline="System Update" supportingText="Version 1.0.2 pending" leadingIcon={<Icons.Settings />} />
                    <ListItem headline="New User" supportingText="Arjun K. joined" leadingIcon={<Icons.Parties />} trailingIcon={<Button size="sm" variant="text">VIEW</Button>} />
                </List>
            </div>
         </div>
      </ShowcaseSection>
    </div>
  );
};
