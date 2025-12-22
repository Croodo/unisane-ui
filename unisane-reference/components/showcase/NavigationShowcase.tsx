import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../ui/Breadcrumb';
import { Stepper } from '../ui/Stepper';
import { Pagination } from '../ui/Pagination';
import { Tree } from '../ui/Tree';
import { SideSheet } from '../ui/SideSheet';
import { Button } from '../ui/Button';
import { ShowcaseSection, ComponentBlock } from './Shared';

export const NavigationShowcase = () => {
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="animate-in fade-in duration-500">
      <ShowcaseSection title="Wayfinding" description="Components that guide users through the hierarchy.">
         <div className="grid grid-cols-1 gap-12">
            <ComponentBlock label="Breadcrumbs" className="justify-start">
                <Breadcrumb>
                    <BreadcrumbItem><BreadcrumbLink>HOME</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>REGISTRY</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>ITEM_DETAIL</BreadcrumbPage></BreadcrumbItem>
                </Breadcrumb>
            </ComponentBlock>

            <ComponentBlock label="Tabs" className="justify-start w-full">
                <Tabs defaultValue="a" className="w-full">
                    <TabsList className="w-full max-w-md">
                        <TabsTrigger value="a">DETAILS</TabsTrigger>
                        <TabsTrigger value="b">HISTORY</TabsTrigger>
                        <TabsTrigger value="c">SETTINGS</TabsTrigger>
                    </TabsList>
                </Tabs>
            </ComponentBlock>

            <ComponentBlock label="Process Stepper" className="w-full">
                <div className="w-full max-w-lg">
                    <Stepper 
                        activeStep={1} 
                        steps={[{label: 'Draft'}, {label: 'Review', description: 'Pending'}, {label: 'Publish'}]} 
                    />
                </div>
            </ComponentBlock>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <ComponentBlock label="Pagination">
                    <Pagination currentPage={1} totalPages={10} onPageChange={()=>{}} />
                </ComponentBlock>
                <ComponentBlock label="Tree View">
                    <div className="w-64 bg-white border border-stone-200 rounded-xs">
                        <Tree data={[
                            { id: '1', label: 'Root', children: [
                                { id: '1-1', label: 'Child A' },
                                { id: '1-2', label: 'Child B', children: [{id: '1-2-1', label: 'Grandchild'}] }
                            ]} 
                        ]} />
                    </div>
                </ComponentBlock>
            </div>

            <ComponentBlock label="Side Sheet (Drawers)">
                <Button variant="outlined" onClick={() => setSideOpen(true)}>OPEN SIDE SHEET</Button>
                <SideSheet open={sideOpen} onClose={() => setSideOpen(false)} title="Detail View">
                    <div className="p-6">
                        <p className="text-sm text-stone-600">Side sheets are primarily used on desktop and tablet for auxiliary content.</p>
                    </div>
                </SideSheet>
            </ComponentBlock>
         </div>
      </ShowcaseSection>
    </div>
  );
};
