import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { ScrollArea } from '../ui/ScrollArea';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/Resizable';
import { Card, CardHeader, CardContent, CardMedia, CardFooter } from '../ui/Card';
import { List, ListItem } from '../ui/List';
import { Icon } from '../ui/Icon';
import { ListDetailLayout, SupportingPaneLayout, FeedLayout } from '../ui/CanonicalLayouts';
import { SegmentedButton } from '../ui/SegmentedButton';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Chip } from '../ui/Chip';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';

const Icons = {
  File: (props: any) => <Icon symbol="description" {...props} />,
  Image: (props: any) => <Icon symbol="image" {...props} />,
  ViewStream: (props: any) => <Icon symbol="view_stream" {...props} />, // List Detail
  SidePane: (props: any) => <Icon symbol="dock_to_right" {...props} />, // Supporting Pane
  Feed: (props: any) => <Icon symbol="grid_view" {...props} />, // Feed
  Email: (props: any) => <Icon symbol="mail" {...props} />,
  Star: (props: any) => <Icon symbol="star" {...props} />,
  Delete: (props: any) => <Icon symbol="delete" {...props} />,
  Info: (props: any) => <Icon symbol="info" {...props} />,
  Close: (props: any) => <Icon symbol="close" {...props} />,
};

// Mock Data for List-Detail
const EMAILS = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    sender: `User ${i + 1}`,
    subject: i % 2 === 0 ? "Project Update: Q4 Goals" : "Meeting Notes: Design Review",
    preview: "Hey team, just wanted to circle back on the previous discussion regarding the...",
    time: "10:30 AM",
    avatar: String.fromCharCode(65 + i)
}));

export const LayoutSection = () => {
  const [activeLayout, setActiveLayout] = useState('list-detail');
  
  // List-Detail State
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  
  // Supporting Pane State
  const [showSupportMobile, setShowSupportMobile] = useState(false);

  const renderActiveLayout = () => {
      switch (activeLayout) {
          case 'list-detail':
              const selectedEmail = EMAILS.find(e => e.id === selectedEmailId);
              return (
                  <ListDetailLayout
                      showDetailMobile={selectedEmailId !== null}
                      onBackClick={() => setSelectedEmailId(null)}
                      list={
                          <div className="flex flex-col h-full">
                              <div className="p-4 border-b border-outline-variant/20 sticky top-0 bg-surface z-10 flex justify-between items-center">
                                  <Typography variant="titleMedium">Inbox</Typography>
                                  <IconButton><Icons.File /></IconButton>
                              </div>
                              <List className="p-2 gap-1">
                                  {EMAILS.map(email => (
                                      <ListItem
                                          key={email.id}
                                          headline={email.sender}
                                          supportingText={email.subject}
                                          trailingSupportingText={email.time}
                                          leadingIcon={<Avatar size="sm" fallback={email.avatar} className={selectedEmailId === email.id ? "bg-primary text-on-primary" : "bg-primary-container text-on-primary-container"} />}
                                          className={selectedEmailId === email.id ? "bg-secondary-container text-on-secondary-container rounded-full" : "rounded-full"}
                                          onClick={() => setSelectedEmailId(email.id)}
                                      />
                                  ))}
                              </List>
                          </div>
                      }
                      detail={
                          selectedEmail ? (
                              <div className="p-6 md:p-8 h-full flex flex-col gap-6">
                                   <div className="flex justify-between items-start">
                                       <div className="flex gap-4">
                                           <Avatar fallback={selectedEmail.avatar} size="lg" className="bg-tertiary-container text-on-tertiary-container" />
                                           <div>
                                               <Typography variant="headlineSmall">{selectedEmail.subject}</Typography>
                                               <div className="flex items-center gap-2 mt-1">
                                                    <Chip label={selectedEmail.sender} variant="assist" className="h-6 text-xs" />
                                                    <span className="text-sm text-on-surface-variant">{selectedEmail.time}</span>
                                               </div>
                                           </div>
                                       </div>
                                       <div className="flex gap-2">
                                           <IconButton variant="standard"><Icons.Star /></IconButton>
                                           <IconButton variant="standard"><Icons.Delete /></IconButton>
                                       </div>
                                   </div>
                                   <div className="h-px bg-outline-variant/20 w-full" />
                                   <Typography variant="bodyLarge" className="leading-relaxed">
                                       {selectedEmail.preview} <br/><br/>
                                       Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                                       Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                       <br/><br/>
                                       Best,<br/>
                                       {selectedEmail.sender}
                                   </Typography>
                              </div>
                          ) : (
                              <div className="h-full flex items-center justify-center text-on-surface-variant/40 flex-col gap-4">
                                  <Icons.Email size={64} />
                                  <Typography variant="bodyLarge">Select an item to view details</Typography>
                              </div>
                          )
                      }
                  />
              );
          
          case 'supporting-pane':
              return (
                  <SupportingPaneLayout
                      showSupportingMobile={showSupportMobile}
                      main={
                          <div className="max-w-3xl mx-auto flex flex-col gap-6">
                              <div className="flex justify-between items-center md:hidden">
                                  <Typography variant="titleMedium">Document.pdf</Typography>
                                  <IconButton 
                                    onClick={() => setShowSupportMobile(!showSupportMobile)} 
                                    variant={showSupportMobile ? 'filled' : 'standard'}
                                  >
                                    <Icons.Info />
                                  </IconButton>
                              </div>
                              <Card variant="elevated" className="min-h-[600px] p-8 md:p-12 bg-surface">
                                  <Typography variant="displaySmall" className="mb-6">Project Requirements</Typography>
                                  <div className="space-y-4">
                                      <div className="h-4 bg-surface-variant/30 rounded w-full" />
                                      <div className="h-4 bg-surface-variant/30 rounded w-[90%]" />
                                      <div className="h-4 bg-surface-variant/30 rounded w-[95%]" />
                                      <br/>
                                      <div className="h-32 bg-surface-variant/10 rounded w-full flex items-center justify-center text-on-surface-variant/40 border border-dashed border-outline-variant">
                                          Diagram Placeholder
                                      </div>
                                      <br/>
                                      <div className="h-4 bg-surface-variant/30 rounded w-full" />
                                      <div className="h-4 bg-surface-variant/30 rounded w-[80%]" />
                                  </div>
                              </Card>
                          </div>
                      }
                      supporting={
                          <div className="h-full flex flex-col">
                              <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
                                  <Typography variant="titleMedium">Comments</Typography>
                                  {/* Close button only relevant on mobile logic really, but good for demo */}
                                  <IconButton className="md:hidden" onClick={() => setShowSupportMobile(false)}><Icons.Close /></IconButton>
                              </div>
                              <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
                                  {[1, 2, 3].map(i => (
                                      <Card key={i} variant="filled" className="bg-surface-container-high">
                                          <CardHeader className="pb-2">
                                              <div className="flex items-center gap-2">
                                                  <Avatar size="sm" fallback={`U${i}`} />
                                                  <span className="text-sm font-medium">Reviewer {i}</span>
                                              </div>
                                          </CardHeader>
                                          <CardContent>
                                              <Typography variant="bodyMedium">
                                                  Can we clarify the requirements for the mobile layout in section 3?
                                              </Typography>
                                          </CardContent>
                                      </Card>
                                  ))}
                              </div>
                              <div className="p-4 border-t border-outline-variant/20">
                                  <Button variant="tonal" className="w-full">Add Comment</Button>
                              </div>
                          </div>
                      }
                  />
              );

          case 'feed':
              return (
                  <FeedLayout>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                          <Card key={i} variant="elevated" className="overflow-hidden group cursor-pointer hover:shadow-2 transition-shadow">
                              <div className="relative h-48 overflow-hidden">
                                  <img 
                                    src={`https://picsum.photos/seed/${i + 50}/600/400`} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    alt="Feed"
                                  />
                                  <div className="absolute top-2 right-2">
                                      <IconButton variant="filled" className="bg-surface/50 backdrop-blur-md h-8 w-8"><Icons.Star /></IconButton>
                                  </div>
                              </div>
                              <CardContent className="pt-4">
                                  <Typography variant="titleMedium" className="mb-1">Amazing Content {i}</Typography>
                                  <Typography variant="bodyMedium" className="text-on-surface-variant line-clamp-2">
                                      Discover the latest trends in design and technology. This card represents a feed item in a responsive grid.
                                  </Typography>
                              </CardContent>
                              <CardFooter className="pt-0 justify-between">
                                  <Chip label="Design" className="h-6 text-xs" />
                                  <Button variant="text" size="sm">Read</Button>
                              </CardFooter>
                          </Card>
                      ))}
                  </FeedLayout>
              );
          default:
              return null;
      }
  };

  return (
    <section className="flex flex-col gap-8">
      <div>
          <Typography variant="headlineMedium">Canonical Layouts</Typography>
          <Typography variant="bodyLarge" className="text-on-surface-variant max-w-3xl mt-2">
              Material 3 defines standard layout patterns that adapt across screen sizes. 
              Use the playground below to interact with these layouts. 
              <strong> Drag the handle on the right of the simulator to resize the viewport.</strong>
          </Typography>
      </div>

      {/* Playground Container */}
      <div className="flex flex-col gap-6">
          {/* Controls */}
          <div className="flex justify-center">
              <SegmentedButton 
                  value={activeLayout}
                  onChange={setActiveLayout}
                  options={[
                      { value: 'list-detail', label: 'List Detail', icon: <Icons.ViewStream /> },
                      { value: 'supporting-pane', label: 'Supporting Pane', icon: <Icons.SidePane /> },
                      { value: 'feed', label: 'Feed', icon: <Icons.Feed /> },
                  ]}
              />
          </div>

          {/* Simulator */}
          <div className="w-full bg-surface-container-low rounded-xl border border-outline-variant/20 p-4 md:p-8 flex justify-center overflow-hidden relative">
               {/* Background Grid Pattern */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

               {/* Resizable Viewport */}
               <div className="resize-x overflow-hidden border-x border-t border-outline shadow-2xl bg-surface rounded-t-xl max-w-full min-w-[320px] w-full lg:w-[1000px] h-[700px] relative flex flex-col mx-auto transition-[width] duration-75">
                   {/* Fake Browser Chrome */}
                   <div className="h-8 bg-surface-container-highest border-b border-outline-variant/20 flex items-center px-4 gap-2 shrink-0">
                       <div className="flex gap-1.5">
                           <div className="w-3 h-3 rounded-full bg-error/40" />
                           <div className="w-3 h-3 rounded-full bg-secondary/40" />
                           <div className="w-3 h-3 rounded-full bg-primary/40" />
                       </div>
                       <div className="flex-1 text-center text-[10px] text-on-surface-variant/50 font-mono">
                           Canonical Layout Simulator
                       </div>
                   </div>

                   {/* Layout Content */}
                   <div className="flex-1 overflow-hidden relative">
                       {renderActiveLayout()}
                   </div>
                   
                   {/* Resize Handle Hint */}
                   <div className="absolute bottom-2 right-2 pointer-events-none bg-inverse-surface text-inverse-on-surface text-[10px] px-2 py-1 rounded opacity-50">
                       Drag corner to resize
                   </div>
               </div>
          </div>
      </div>

      {/* Utilities Section (Previous content moved down) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pt-12 border-t border-outline-variant/20">
        <div className="flex flex-col gap-4">
             <Typography variant="titleLarge">Resizable Panels</Typography>
             <Card variant="outlined" className="h-[400px] w-full p-0 overflow-hidden flex flex-col">
                <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/20 text-xs font-mono text-on-surface-variant">
                    Drag the dividers to resize
                </div>
                <ResizablePanelGroup direction="horizontal" className="flex-1">
                    <ResizablePanel defaultSize={30} minSize={20} className="bg-surface-container-low">
                        <ScrollArea className="h-full">
                            <List className="p-2">
                                {Array.from({length: 10}).map((_, i) => (
                                    <ListItem 
                                        key={i} 
                                        headline={`File_${i+1}.tsx`} 
                                        leadingIcon={<Icons.File />} 
                                        className="rounded-md"
                                    />
                                ))}
                            </List>
                        </ScrollArea>
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle />
                    
                    <ResizablePanel defaultSize={70}>
                         <ResizablePanelGroup direction="vertical">
                             <ResizablePanel defaultSize={70} className="bg-surface p-6">
                                 <Typography variant="headlineSmall" className="mb-4">Main Editor</Typography>
                                 <Typography variant="bodyMedium" className="text-on-surface-variant">
                                     This is the main content area. It is resizable both horizontally and vertically.
                                 </Typography>
                             </ResizablePanel>
                             <ResizableHandle />
                             <ResizablePanel defaultSize={30} className="bg-black text-white p-4 font-mono text-sm">
                                 <div className="opacity-50 mb-2">TERMINAL</div>
                                 <div className="text-green-400">➜  ~  npm run dev</div>
                             </ResizablePanel>
                         </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
             </Card>
        </div>

        <div className="flex flex-col gap-4">
             <Typography variant="titleLarge">Scroll Area</Typography>
             <Card variant="filled" className="h-[400px] p-0 overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-outline-variant/10">
                     <Typography variant="titleMedium">Custom Scrollbars</Typography>
                 </div>
                 <ScrollArea className="flex-1 p-4">
                     <div className="space-y-4">
                         <Typography variant="bodyLarge">
                             The <code>ScrollArea</code> component provides a thin, unobtrusive scrollbar that respects the system's `outline-variant` color token.
                         </Typography>
                         <div className="grid grid-cols-2 gap-4 my-6">
                             {Array.from({length: 6}).map((_, i) => (
                                 <div key={i} className="aspect-video bg-surface-container-highest rounded-lg flex items-center justify-center text-on-surface-variant">
                                     <Icons.Image size={32} />
                                 </div>
                             ))}
                         </div>
                         {Array.from({length: 5}).map((_, i) => (
                             <Typography key={i} variant="bodyMedium" className="text-on-surface-variant">
                                 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                             </Typography>
                         ))}
                     </div>
                 </ScrollArea>
             </Card>
        </div>
      </div>
    </section>
  );
};