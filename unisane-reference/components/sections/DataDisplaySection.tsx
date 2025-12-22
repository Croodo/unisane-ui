import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import { Icon } from '../ui/Icon';
import { Carousel } from '../ui/Carousel';
import { Card, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Chip } from '../ui/Chip';

const Icons = {
  MoreVert: (props: any) => <Icon symbol="more_vert" {...props} />,
  Edit: (props: any) => <Icon symbol="edit" {...props} />,
  Delete: (props: any) => <Icon symbol="delete" {...props} />,
};

const users = [
  { id: 1, name: 'Alex Morgan', role: 'Designer', status: 'Active', email: 'alex@example.com', avatar: 'A' },
  { id: 2, name: 'Jordan Lee', role: 'Developer', status: 'Offline', email: 'jordan@example.com', avatar: 'J' },
  { id: 3, name: 'Casey Smith', role: 'Manager', status: 'Active', email: 'casey@example.com', avatar: 'C' },
  { id: 4, name: 'Taylor Doe', role: 'Admin', status: 'Busy', email: 'taylor@example.com', avatar: 'T' },
];

export const DataDisplaySection = () => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <section className="flex flex-col gap-8">
      <Typography variant="headlineMedium">Data Display</Typography>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Table & Pagination */}
        <div className="flex flex-col gap-6 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 xl:col-span-2">
           <div className="flex justify-between items-center">
               <Typography variant="titleLarge">Team Members</Typography>
               <div className="flex gap-2">
                   <Chip label="All" selected variant="filter" />
                   <Chip label="Active" variant="filter" />
               </div>
           </div>
           
           <div className="border border-outline-variant rounded-xl overflow-hidden">
               <Table>
                   <TableHeader>
                       <TableRow>
                           <TableHead className="w-[50px]"></TableHead>
                           <TableHead>User</TableHead>
                           <TableHead className="hidden sm:table-cell">Role</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                   </TableHeader>
                   <TableBody>
                       {users.map((user) => (
                           <TableRow key={user.id}>
                               <TableCell>
                                   <Avatar fallback={user.avatar} size="sm" />
                               </TableCell>
                               <TableCell>
                                   <div className="flex flex-col">
                                       <span className="font-medium text-on-surface">{user.name}</span>
                                       <span className="text-xs text-on-surface-variant">{user.email}</span>
                                   </div>
                               </TableCell>
                               <TableCell className="hidden sm:table-cell text-on-surface-variant">
                                   {user.role}
                               </TableCell>
                               <TableCell>
                                   <Badge variant="small" className={user.status === 'Active' ? 'bg-primary' : 'bg-outline'} />
                                   <span className="ml-2 text-sm text-on-surface">{user.status}</span>
                               </TableCell>
                               <TableCell className="text-right">
                                   <IconButton variant="standard" className="w-8 h-8"><Icons.MoreVert size={20} /></IconButton>
                               </TableCell>
                           </TableRow>
                       ))}
                   </TableBody>
               </Table>
           </div>
           
           <Pagination 
               currentPage={currentPage} 
               totalPages={10} 
               onPageChange={setCurrentPage}
               className="justify-end"
           />
        </div>

        {/* Carousel */}
        <div className="flex flex-col gap-6 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20">
            <Typography variant="titleLarge">Carousel</Typography>
            <Carousel itemClassName="w-[280px] md:w-[320px]">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} variant="filled" className="h-[200px] relative overflow-hidden group">
                        <img 
                            src={`https://picsum.photos/seed/${i + 10}/600/400`} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            alt="Carousel Item"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                            <span className="text-white font-medium text-lg">Featured Item {i}</span>
                            <span className="text-white/80 text-sm">Discover amazing content</span>
                        </div>
                    </Card>
                ))}
            </Carousel>
        </div>

        {/* Skeleton Loading */}
        <div className="flex flex-col gap-6 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20">
            <Typography variant="titleLarge">Loading States</Typography>
            <div className="flex flex-col gap-4">
                {/* Simulated Card Loading */}
                <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-outline-variant/20">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 flex flex-col gap-2">
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="40%" height={16} />
                    </div>
                </div>
                
                {/* Simulated List Loading */}
                 <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <Skeleton variant="text" width={100} height={24} />
                        <Skeleton variant="rectangular" width={60} height={32} className="rounded-full" />
                    </div>
                    <Skeleton variant="rectangular" width="100%" height={120} className="rounded-xl" />
                </div>
            </div>
        </div>

      </div>
    </section>
  );
};