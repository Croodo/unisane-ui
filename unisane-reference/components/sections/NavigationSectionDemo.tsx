import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { NavigationBar } from '../ui/NavigationBar';
import { Stepper } from '../ui/Stepper';
// Removed non-existent BreadcrumbList import
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../ui/Breadcrumb';
import { Icon } from '../ui/Icon';
import { TopAppBar } from '../ui/TopAppBar';
import { BottomAppBar } from '../ui/BottomAppBar';
import { IconButton } from '../ui/IconButton';
import { Fab } from '../ui/Fab';

const Icons = {
  Home: (props: any) => <Icon symbol="home" {...props} />,
  Favorite: (props: any) => <Icon symbol="favorite" {...props} />,
  Person: (props: any) => <Icon symbol="person" {...props} />,
  Menu: (props: any) => <Icon symbol="menu" {...props} />,
  Search: (props: any) => <Icon symbol="search" {...props} />,
  MoreVert: (props: any) => <Icon symbol="more_vert" {...props} />,
  Add: (props: any) => <Icon symbol="add" {...props} />,
  Check: (props: any) => <Icon symbol="check" {...props} />,
  Edit: (props: any) => <Icon symbol="edit" {...props} />,
  Mic: (props: any) => <Icon symbol="mic" {...props} />,
};

export const NavigationSectionDemo = () => {
  const [navVal, setNavVal] = useState('home');

  return (
    <section className="flex flex-col gap-8">
       <Typography variant="headlineMedium">Navigation</Typography>

       <div className="flex flex-col gap-8 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20">
           {/* Tabs */}
           <div>
               <Typography variant="titleMedium" className="mb-4 text-on-surface-variant">Tabs</Typography>
               <Tabs defaultValue="photos">
                   <TabsList className="bg-transparent w-full md:w-[400px]">
                       <TabsTrigger value="photos">Photos</TabsTrigger>
                       <TabsTrigger value="videos">Videos</TabsTrigger>
                       <TabsTrigger value="music">Music</TabsTrigger>
                   </TabsList>
               </Tabs>
           </div>

           <div className="h-px bg-outline-variant/50" />

           {/* Breadcrumb & Stepper */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div>
                   <Typography variant="titleMedium" className="mb-4 text-on-surface-variant">Breadcrumbs</Typography>
                   <Breadcrumb>
                       {/* Removed redundant BreadcrumbList wrapper as Breadcrumb already provides the <ol> */}
                       <BreadcrumbItem>
                           <BreadcrumbLink>Home</BreadcrumbLink>
                       </BreadcrumbItem>
                       <BreadcrumbSeparator />
                       <BreadcrumbItem>
                           <BreadcrumbLink>Components</BreadcrumbLink>
                       </BreadcrumbItem>
                       <BreadcrumbSeparator />
                       <BreadcrumbItem>
                           <BreadcrumbPage>Navigation</BreadcrumbPage>
                       </BreadcrumbItem>
                   </Breadcrumb>
               </div>

               <div>
                   <Typography variant="titleMedium" className="mb-6 text-on-surface-variant">Stepper</Typography>
                   <Stepper 
                       activeStep={1}
                       steps={[
                           { label: 'Details' },
                           { label: 'Shipping' },
                           { label: 'Payment' },
                       ]}
                   />
               </div>
           </div>
           
           <div className="h-px bg-outline-variant/50" />

           {/* App Bars Demo */}
           <div>
               <Typography variant="titleMedium" className="mb-6 text-on-surface-variant">App Bars & Structure</Typography>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Mobile Screen Simulation 1: Top Bar + Nav Bar */}
                   <div className="rounded-xl overflow-hidden border border-outline-variant/20 shadow-sm flex flex-col h-[400px] bg-surface relative">
                       <TopAppBar 
                           title="Page Title"
                           variant="small"
                           navigationIcon={<IconButton><Icons.Menu /></IconButton>}
                           actions={
                               <>
                                   <IconButton><Icons.Person /></IconButton>
                                   <IconButton><Icons.MoreVert /></IconButton>
                               </>
                           }
                           className="bg-surface-container"
                       />
                       
                       <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm bg-surface p-4">
                           <div className="text-center opacity-50">
                               Scrollable Content Area
                           </div>
                       </div>
                       
                       <NavigationBar 
                           value={navVal}
                           onChange={setNavVal}
                           items={[
                               { value: 'home', label: 'Home', icon: <Icons.Home /> },
                               { value: 'favorites', label: 'Favorites', icon: <Icons.Favorite /> },
                               { value: 'profile', label: 'Profile', icon: <Icons.Person /> },
                           ]}
                       />
                   </div>

                   {/* Mobile Screen Simulation 2: Large Top Bar + Bottom App Bar + FAB */}
                   <div className="rounded-xl overflow-hidden border border-outline-variant/20 shadow-sm flex flex-col h-[400px] bg-surface relative">
                        <TopAppBar 
                           title="Library"
                           variant="medium"
                           navigationIcon={<IconButton><Icons.Menu /></IconButton>}
                           actions={<IconButton><Icons.Search /></IconButton>}
                           className="bg-surface-container"
                       />
                       
                       <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm bg-surface p-4">
                           Content
                       </div>
                       
                       <BottomAppBar 
                           fab={<Fab icon={<Icons.Add />} variant="secondary" />}
                       >
                           <IconButton><Icons.Check /></IconButton>
                           <IconButton><Icons.Edit /></IconButton>
                           <IconButton><Icons.Mic /></IconButton>
                       </BottomAppBar>
                   </div>
               </div>
           </div>
       </div>
    </section>
  );
};