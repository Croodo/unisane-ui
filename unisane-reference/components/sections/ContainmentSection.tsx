import React from 'react';
import { Typography } from '../ui/Typography';
import { Card, CardHeader, CardContent, CardFooter, CardMedia } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Chip } from '../ui/Chip';

const Icons = {
  MoreVert: (props: any) => <Icon {...props}><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></Icon>,
  Favorite: (props: any) => <Icon {...props}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></Icon>,
  Share: (props: any) => <Icon {...props}><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></Icon>,
};

export const ContainmentSection = () => {
  return (
    <section className="flex flex-col gap-8">
       <Typography variant="headlineMedium">Cards</Typography>
       <Typography variant="bodyLarge" className="text-on-surface-variant -mt-6 max-w-3xl">
          Cards contain content and actions about a single subject. M3 cards come in three varieties: Elevated, Filled, and Outlined.
       </Typography>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Elevated Card */}
           <div className="flex flex-col gap-4">
               <Typography variant="titleMedium" className="opacity-70">Elevated</Typography>
               <Card variant="elevated" interactive className="h-full">
                   <CardHeader>
                       <div className="flex justify-between items-start">
                           <div className="flex items-center gap-3">
                               <Avatar fallback="A" className="bg-primary text-on-primary" />
                               <div>
                                   <Typography variant="titleMedium">Elevated Card</Typography>
                                   <Typography variant="bodySmall" className="text-on-surface-variant">Subhead</Typography>
                               </div>
                           </div>
                           <Button variant="text" icon={<Icons.MoreVert />} className="px-0 w-10 min-w-0 -mr-2 -mt-2" />
                       </div>
                   </CardHeader>
                   <CardMedia src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80" className="h-48" />
                   <CardContent className="mt-4">
                       <Typography variant="bodyMedium">
                           Elevated cards have a shadow and separate content from the background. They work well for scrollable content.
                       </Typography>
                   </CardContent>
                   <CardFooter className="justify-end pt-0">
                       <Button variant="filled">Action</Button>
                       <Button variant="text">Skip</Button>
                   </CardFooter>
               </Card>
           </div>

           {/* Filled Card */}
           <div className="flex flex-col gap-4">
               <Typography variant="titleMedium" className="opacity-70">Filled</Typography>
               <Card variant="filled" interactive className="h-full">
                   <CardHeader>
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-3">
                               <Avatar fallback="B" className="bg-secondary text-on-secondary" />
                               <div>
                                   <Typography variant="titleMedium">Filled Card</Typography>
                                   <Typography variant="bodySmall" className="text-on-surface-variant">Subhead</Typography>
                               </div>
                           </div>
                           <Button variant="text" icon={<Icons.MoreVert />} className="px-0 w-10 min-w-0 -mr-2 -mt-2" />
                       </div>
                   </CardHeader>
                   <CardContent>
                       <Typography variant="bodyMedium" className="mb-4">
                           Filled cards have a subtle background fill and no shadow by default. They are good for separating content with less emphasis than elevated cards.
                       </Typography>
                       <div className="w-full h-32 bg-surface-variant/30 rounded-lg flex items-center justify-center text-on-surface-variant/50 mb-2">
                           Media Area
                       </div>
                   </CardContent>
                   <CardFooter className="gap-4">
                        <Button variant="tonal">Learn More</Button>
                   </CardFooter>
               </Card>
           </div>

           {/* Outlined Card */}
           <div className="flex flex-col gap-4">
               <Typography variant="titleMedium" className="opacity-70">Outlined</Typography>
               <Card variant="outlined" interactive className="h-full">
                   <CardHeader className="pb-0">
                       <Typography variant="titleLarge">Outlined Card</Typography>
                       <Typography variant="bodyMedium" className="text-on-surface-variant">Best for lowest emphasis</Typography>
                   </CardHeader>
                   <CardContent className="pt-4 flex-1">
                       <Typography variant="bodyMedium">
                           Outlined cards have a visible border and no shadow. They are ideal for secondary content or when you need a lightweight container.
                       </Typography>
                   </CardContent>
                   <div className="h-px bg-outline-variant mx-4" />
                   <CardFooter className="justify-between">
                       <div className="flex gap-2">
                            <Chip label="Tag 1" variant="suggestion" className="h-7" />
                            <Chip label="Tag 2" variant="suggestion" className="h-7" />
                       </div>
                       <Button variant="text" className="px-2">Read</Button>
                   </CardFooter>
               </Card>
           </div>
       </div>

       {/* Horizontal Card Example */}
       <div className="flex flex-col gap-4 mt-4">
            <Typography variant="titleMedium" className="opacity-70">Horizontal Layout</Typography>
            <Card variant="outlined" interactive className="flex-row overflow-hidden md:h-[160px] items-stretch">
                <img 
                    src="https://images.unsplash.com/photo-1501854140884-074bf86ee91c?w=600&q=80" 
                    className="w-[120px] md:w-[200px] object-cover shrink-0" 
                    alt="Horizontal"
                />
                <div className="flex flex-col flex-1">
                    <CardHeader>
                        <Typography variant="titleMedium">Horizontal Card</Typography>
                        <Typography variant="bodySmall" className="text-on-surface-variant">Optimized for lists</Typography>
                    </CardHeader>
                    <CardContent className="flex-1 py-0 hidden md:block">
                        <Typography variant="bodyMedium" className="line-clamp-2 text-on-surface-variant">
                            This layout creates more vertical space for text and works well when images are secondary or need to be scanned quickly in a list.
                        </Typography>
                    </CardContent>
                    <CardFooter className="justify-end gap-1">
                         <Button variant="text" icon={<Icons.Favorite />} className="px-2 min-w-0" />
                         <Button variant="text" icon={<Icons.Share />} className="px-2 min-w-0" />
                    </CardFooter>
                </div>
            </Card>
       </div>
    </section>
  );
};