import React, { useState, useEffect } from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Switch } from '../../ui/SelectionControls';
import { Button } from '../../ui/Button';
import { Divider } from '../../ui/Divider';
import { Icons } from '../Icons';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';
import { Avatar } from '../../ui/Avatar';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';
import { SegmentedButton } from '../../ui/SegmentedButton';
import { ImportUtility } from '../shared/ImportUtility';
import { RegistryHeader } from '../shared/RegistryComponents';
import { UnitConversionRegistry } from './UnitConversionRegistry';
import { PermissionGrid } from './PermissionGrid';
import { BranchRegistry } from './BranchRegistry';
import { EInvoiceMonitor } from './EInvoiceMonitor';
import { NumberingConfigurator } from './NumberingConfigurator';
import { PrintSettings } from './PrintSettings';

const UserManagement = ({ onEditPermissions }: { onEditPermissions: (role: string) => void }) => {
  const users = [
    { name: 'Admin User', role: 'Owner', email: 'owner@unisane.com', status: 'Active', access: 'Full Access' },
    { name: 'Ramesh Kumar', role: 'Manager', email: 'ramesh@unisane.com', status: 'Active', access: 'Warehouse WH001' },
    { name: 'Accounts Team', role: 'Accountant', email: 'fin@unisane.com', status: 'Away', access: 'Billing Only' },
  ];

  return (
    <div className="flex flex-col gap-10u @container animate-in fade-in duration-500">
       <div className="flex flex-col @md:flex-row justify-between items-start @md:items-end gap-6u">
          <div className="flex flex-col gap-1.5u">
             <Typography variant="headlineSmall" className="font-black text-stone-800 uppercase tracking-tighter">Staff & Access Control</Typography>
             <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase tracking-tight">Define role-based permissions (RBAC) for the entire tenant</Typography>
          </div>
          <Button 
            variant="filled" 
            size="md" 
            icon={<Icons.Add />} 
            className="font-black px-10u shadow-2 w-full @md:w-auto h-12u rounded-xs tracking-widest"
          >
            INVITE STAFF
          </Button>
       </div>

       <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm overflow-x-auto">
          <Table className="min-w-[800px] @md:min-w-full border-none">
             <TableHeader>
                <TableRow className="bg-stone-50 border-b border-stone-200">
                   <TableHead className="pl-8u py-4u">Staff Identity</TableHead>
                   <TableHead>Functional Role</TableHead>
                   <TableHead>Access Scope</TableHead>
                   <TableHead className="text-right pr-8u">Protocol Actions</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {users.map((u, i) => (
                   <TableRow key={i} className="hover:bg-stone-50/50 transition-colors border-b border-stone-50 last:border-0">
                      <TableCell className="pl-8u py-6u">
                         <div className="flex items-center gap-5u">
                            <Avatar fallback={u.name[0]} size="md" className="bg-stone-900 text-primary font-black rounded-xs shrink-0 shadow-sm" />
                            <div className="flex flex-col min-w-0">
                               <span className="font-black text-stone-900 uppercase text-[13px] truncate tracking-tight">{u.name}</span>
                               <span className="text-[11px] font-bold text-stone-400 truncate mt-0.5">{u.email}</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell><Chip label={u.role} className="h-6 text-[9px] font-black uppercase bg-stone-100 text-stone-600 border-none px-3 rounded-xs" /></TableCell>
                      <TableCell className="text-[12px] font-bold text-stone-500 uppercase tracking-tight">{u.access}</TableCell>
                      <TableCell className="text-right pr-8u">
                         <Button variant="text" size="sm" onClick={() => onEditPermissions(u.role)} className="font-black text-[10px] uppercase text-primary hover:bg-primary/5 px-4u">EDIT RULES</Button>
                      </TableCell>
                   </TableRow>
                ))}
             </TableBody>
          </Table>
       </div>
    </div>
  );
};

export const SettingsModule = ({ activeTab }: { activeTab: string }) => {
  const bgClass = "bg-white";
  const [density, setDensity] = useState(() => document.documentElement.getAttribute('data-density') || 'standard');
  const [editingRole, setEditingRole] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  if (editingRole) {
    return (
      <div className="h-full bg-white overflow-hidden flex flex-col">
        <RegistryHeader 
          variant="full"
          label={`Security / ${editingRole}`}
          title="Permissions Matrix"
          hideSearch
          action={<Button variant="filled" className="font-black text-[10px] px-8u rounded-xs h-10u shadow-2" onClick={() => setEditingRole(null)}>SAVE RULES</Button>}
        />
        <div className="flex-1 overflow-y-auto px-6u @md:px-10u @lg:px-16u py-10u @md:py-16u no-scrollbar">
            <div className="max-w-[1200px] mx-auto w-full">
                <PermissionGrid roleName={editingRole} onBack={() => setEditingRole(null)} />
            </div>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'branches': return <BranchRegistry />;
      case 'digital': return <EInvoiceMonitor />;
      case 'numbering': return <NumberingConfigurator />;
      case 'print': return <PrintSettings />;
      case 'company':
        return (
          <div className="flex flex-col gap-12u pb-20">
            <section className="flex flex-col gap-8u p-10u md:p-14u bg-stone-900 text-white rounded-xs border-none shadow-5 relative overflow-hidden group">
               <div className="relative z-10 flex flex-col gap-3u">
                  <Typography variant="headlineSmall" className="text-primary-container font-black uppercase tracking-tighter flex items-center gap-5u">
                    <Icon symbol="tune" size={32} className="text-primary-container" /> System Calibration
                  </Typography>
                  <Typography variant="bodyLarge" className="text-stone-400 font-bold uppercase tracking-widest text-sm max-w-xl">
                    Adjust the visual density and interaction scaling across the entire tenant workspace.
                  </Typography>
               </div>
               
               <div className="relative z-10 grid grid-cols-1 @xl:grid-cols-2 gap-10u mt-6u">
                  <div className="flex flex-col gap-5u">
                      <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-[0.3em]">Scaling Protocol (UI Density)</Typography>
                      <SegmentedButton 
                        value={density}
                        onChange={setDensity}
                        options={[
                            { value: 'dense', label: 'DENSE', icon: <Icon symbol="compress" /> },
                            { value: 'compact', label: 'COMPACT' },
                            { value: 'standard', label: 'COMFORT' },
                        ]}
                        className="bg-white/5 border-white/10 h-14u rounded-xs"
                      />
                  </div>
               </div>
               <Icon symbol="settings" size={280} className="absolute -right-16 -bottom-16 opacity-5 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-1000" />
            </section>

            <section className="flex flex-col gap-8u">
              <header className="flex items-center gap-5u border-b border-stone-100 pb-6u">
                <div className="w-1.5 h-12 bg-primary rounded-full" />
                <div className="flex flex-col">
                    <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter leading-none">Organizational Profile</Typography>
                    <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase mt-1">Primary Statutory Records</Typography>
                </div>
              </header>
              <div className="grid grid-cols-1 @lg:grid-cols-2 gap-8u">
                <TextField label="LEGAL ENTITY NAME" defaultValue="Unisane Industrial Slabs Pvt Ltd" labelBg={bgClass} />
                <TextField label="GSTIN (PRIMARY)" defaultValue="27AAACE1234F1Z5" labelBg={bgClass} />
                <TextField label="CORPORATE EMAIL" defaultValue="compliance@unisane.com" labelBg={bgClass} />
                <TextField label="PRIMARY CONTACT NO" defaultValue="+91 98200 XXXXX" labelBg={bgClass} />
              </div>
              <TextField label="REGISTERED HEAD OFFICE" multiline rows={3} labelBg={bgClass} />
            </section>
          </div>
        );
      case 'tax':
        return (
          <div className="flex flex-col gap-12u pb-20">
             <section className="flex flex-col gap-10u">
                <header className="flex items-center gap-5u border-b border-stone-100 pb-6u">
                  <div className="w-1.5 h-12 bg-primary rounded-full" />
                  <div className="flex flex-col">
                    <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter leading-none">Tax Configuration</Typography>
                    <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase mt-1">GSTR & PAN Registry Controls</Typography>
                  </div>
                </header>
                <div className="grid grid-cols-1 @lg:grid-cols-2 gap-8u">
                    <TextField label="REGISTERED PAN" defaultValue="AAACE1234F" labelBg={bgClass} />
                    <Select 
                      label="GST FILING TYPE" 
                      value="regular" 
                      onChange={() => {}}
                      options={[{label: 'Regular Taxpayer (Monthly)', value: 'regular'}, {label: 'Composition Scheme', value: 'composition'}]} 
                    />
                </div>
                <Card variant="outlined" className="p-10u bg-stone-50 border-stone-200 rounded-xs flex flex-col @md:flex-row items-center justify-between gap-8u group hover:border-primary/20 transition-all shadow-none hover:shadow-sm">
                    <div className="flex flex-col w-full">
                        <span className="text-base font-black text-stone-800 uppercase tracking-tight group-hover:text-primary transition-colors">Authorization: e-Invoice API Gateway</span>
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-tight mt-1.5 leading-relaxed max-w-xl">
                            Grant the system permission to push tax vouchers directly to the government IRN portal in real-time.
                        </span>
                    </div>
                    <Switch defaultChecked />
                </Card>
             </section>

             <section className="flex flex-col gap-6u">
                <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-[0.3em] px-2u">GST Slab Hierarchy</Typography>
                <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm overflow-x-auto">
                    <Table className="min-w-[700px] @md:min-w-full border-none">
                        <TableHeader>
                            <TableRow className="bg-stone-50 border-b border-stone-200">
                                <TableHead className="pl-10u">Applicable Rate</TableHead>
                                <TableHead>Accounting Map</TableHead>
                                <TableHead className="text-right pr-10u">Registry Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { rate: '18%', label: 'Standard Industrial Material GST', active: true },
                                { rate: '28%', label: 'Luxury Marble & Cess Goods', active: true },
                                { rate: '5%', label: 'Raw Aggregate & Site Fillers', active: true },
                                { rate: '12%', label: 'Services & Fabrication', active: false },
                            ].map((slab, i) => (
                                <TableRow key={i} className="hover:bg-stone-50/50 border-b border-stone-50 last:border-0 transition-colors">
                                    <TableCell className="font-black text-stone-900 tabular-nums py-8u pl-10u text-lg">{slab.rate}</TableCell>
                                    <TableCell className="text-[12px] font-bold text-stone-500 uppercase tracking-tight">{slab.label}</TableCell>
                                    <TableCell className="text-right pr-10u">
                                        <Switch defaultChecked={slab.active} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
             </section>
          </div>
        );
      case 'inventory':
        return (
          <div className="flex flex-col gap-12u pb-20">
             <section className="flex flex-col gap-10u">
                <header className="flex items-center gap-5u border-b border-stone-100 pb-6u">
                  <div className="w-1.5 h-12 bg-primary rounded-full" />
                  <div className="flex flex-col">
                    <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter leading-none">Operational Protocol</Typography>
                    <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase mt-1">Stock Movement & Valuation Policy</Typography>
                  </div>
                </header>
              <div className="flex flex-col gap-8u">
                <div className="flex flex-col @md:flex-row items-center justify-between p-10u bg-stone-50 rounded-xs border border-stone-200 gap-8u group hover:border-primary/20 transition-all shadow-none hover:shadow-sm">
                  <div className="flex flex-col w-full">
                    <span className="text-base font-black text-stone-800 uppercase tracking-tight group-hover:text-primary transition-colors">Negative Inventory Commitment</span>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-tight mt-1.5 leading-relaxed max-w-xl">
                        Allow invoicing of items not physically logged in the hub. System will track as a pending reconciliation layer.
                    </span>
                  </div>
                  <Switch />
                </div>
                <div className="grid grid-cols-1 @xl:grid-cols-2 gap-10u mt-4u">
                  <Select label="VALUATION ARCHITECTURE" value="wavg" onChange={() => {}} options={[{label: 'Weighted Average (Industrial Std)', value: 'wavg'}, {label: 'FIFO (Layered Procurement)', value: 'fifo'}]} />
                  <Select label="DEFAULT SYSTEM UOM" value="sqft" onChange={() => {}} options={[{label: 'Square Feet (SqFt)', value: 'sqft'}, {label: 'Metric Tons (MT)', value: 'mt'}]} />
                </div>
              </div>
            </section>
            
            <Divider className="opacity-40 my-4u" />
            <UnitConversionRegistry />
          </div>
        );
      case 'users':
        return <UserManagement onEditPermissions={setEditingRole} />;
      default:
        return (
          <div className="py-48 flex flex-col items-center justify-center opacity-10 grayscale">
            <Icon symbol="settings" size={160} strokeWidth={1} />
            <Typography variant="labelLarge" className="font-black uppercase tracking-[20px] mt-10">NODE_STANDBY</Typography>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden @container">
        <RegistryHeader 
          variant="sidebar"
          label={editingRole ? `Security / ${editingRole}` : "System Controls"}
          title={editingRole ? "Rules Override" : "Command Console"}
          hideSearch
          className="z-40"
          action={
            <div className="flex gap-4u">
                {editingRole && <Button variant="outlined" onClick={() => setEditingRole(null)} className="font-black text-[10px] h-12u px-8u rounded-xs bg-white shadow-sm">ABORT</Button>}
                <Button variant="filled" className="font-black text-[10px] px-12u shadow-3 h-12u rounded-xs tracking-widest">COMMIT SNAPSHOT</Button>
            </div>
          }
        />
        <div className="flex-1 overflow-y-auto px-6u @md:px-10u @lg:px-16u py-10u @md:py-16u no-scrollbar scroll-smooth">
          <div className="max-w-[1200px] mx-auto w-full">
            {renderTab()}
          </div>
        </div>
    </div>
  );
};