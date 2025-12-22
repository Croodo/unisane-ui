import React, { useState } from 'react';
import { LayoutProvider, useLayout } from './context/LayoutContext';
import { Scaffold } from './components/ui/Scaffold';
import { NavigationRail } from './components/ui/NavigationRail';
import { NavigationDrawer, NavigationDrawerItem, NavigationDrawerHeadline, NavigationDrawerDivider } from './components/ui/NavigationDrawer';
import { SearchBar } from './components/ui/SearchBar';
import { IconButton } from './components/ui/IconButton';
import { FabMenu } from './components/ui/FabMenu'; 
import { Avatar } from './components/ui/Avatar';
import { Typography } from './components/ui/Typography';
import { SupportingPaneLayout } from './components/ui/CanonicalLayouts';
import { Sheet } from './components/ui/Sheet';
import { Button } from './components/ui/Button';
import { Icon } from './components/ui/Icon';
import { ContextualSubNav } from './components/ui/ContextualSubNav';
import { cn } from './lib/utils';

// Business Modules
import { Icons } from './components/business/Icons';
import { DashboardOverview } from './components/business/dashboard/DashboardOverview';
import { InventoryMaster } from './components/business/inventory/InventoryMaster';
import { PartiesModule } from './components/business/parties/PartiesModule';
import { SalesModule } from './components/business/sales/SalesModule';
import { PurchasesModule } from './components/business/purchases/PurchasesModule';
import { InvoiceForm } from './components/business/sales/InvoiceForm';
import { AccountingModule } from './components/business/accounting/AccountingModule';
import { ReportsModule } from './components/business/reports/ReportsModule';
import { SettingsModule } from './components/business/settings/SettingsModule';
import { ManufacturingModule } from './components/business/manufacturing/ManufacturingModule';
import { RecycleBinModule } from './components/business/system/RecycleBinModule';
import { ShowcaseLanding } from './components/ShowcaseLanding';
import { GlobalSearchPage } from './components/business/system/GlobalSearchPage';
import { AICommandTerminal } from './components/business/shared/AICommandTerminal';
import { ChartOfAccounts } from './components/business/accounting/ChartOfAccounts';
import { BranchRegistry } from './components/business/settings/BranchRegistry';
import { BalanceSheetView } from './components/business/accounting/BalanceSheetView';
import { EInvoiceMonitor } from './components/business/settings/EInvoiceMonitor';
import { NumberingConfigurator } from './components/business/settings/NumberingConfigurator';

const SyncIndicator = ({ onClick }: { onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="flex items-center gap-2u px-3u py-1u bg-surface-container-high rounded-full border border-outline-variant shrink-0 cursor-pointer hover:bg-surface-container-highest transition-colors"
  >
    <div className="w-1.5u h-1.5u rounded-full bg-emerald-500 animate-pulse" />
    <span className="hidden sm:inline text-[9px] font-black uppercase text-on-surface-variant tracking-widest leading-none">SYNC_OK</span>
  </div>
);

const AppContent = () => {
  const { isNavOpen, setNavOpen, toggleNav, isPaneOpen, togglePane } = useLayout();
  const [currentModule, setCurrentModule] = useState('showcase'); 
  const [activeSubModule, setActiveSubModule] = useState('overview');
  const [selectedContext, setSelectedContext] = useState<any>(null);
  const [isInvoiceSheetOpen, setIsInvoiceSheetOpen] = useState(false);
  const [isAiTerminalOpen, setIsAiTerminalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const modules = [
    { id: 'showcase', label: 'Protocol', icon: <Icon symbol="rocket_launch" />, activeIcon: <Icon symbol="rocket_launch" filled /> },
    { id: 'dashboard', label: 'Command', icon: <Icons.Dashboard />, activeIcon: <Icons.Dashboard filled /> },
    { id: 'inventory', label: 'Asset', icon: <Icons.Inventory />, activeIcon: <Icons.Inventory filled /> },
    { id: 'manufacturing', label: 'Factory', icon: <Icon symbol="factory" />, activeIcon: <Icon symbol="factory" filled /> },
    { id: 'parties', label: 'Partner', icon: <Icons.Parties />, activeIcon: <Icons.Parties filled /> },
    { id: 'sales', label: 'Revenue', icon: <Icons.Sales />, activeIcon: <Icons.Sales filled /> },
    { id: 'purchases', label: 'Procure', icon: <Icons.Purchases />, activeIcon: <Icons.Purchases filled /> },
    { id: 'accounting', label: 'Ledger', icon: <Icons.Money />, activeIcon: <Icons.Money filled /> },
    { id: 'settings', label: 'Registry', icon: <Icons.Settings />, activeIcon: <Icons.Settings filled /> },
  ];

  const subNavs: Record<string, any[]> = {
    showcase: [{ id: 'overview', label: 'Initialization', icon: <Icon symbol="palette" size={18} /> }],
    dashboard: [
        { id: 'overview', label: 'Node Overview', icon: <Icons.Dashboard size={18} /> },
        { id: 'approvals', label: 'Approval Inbox', icon: <Icon symbol="fact_check" size={18} /> }
    ],
    inventory: [
      { id: 'catalog', label: 'Item Master', icon: <Icons.Inventory size={18} /> }, 
      { id: 'categories', label: 'Logic Groups', icon: <Icons.Filter size={18} /> }, 
      { id: 'warehouses', label: 'Supply Hubs', icon: <Icons.Warehouse size={18} /> },
      { id: 'counts', label: 'Audit Counts', icon: <Icon symbol="inventory" size={18} /> }
    ],
    manufacturing: [
      { id: 'overview', label: 'Factory Pulse', icon: <Icons.Dashboard size={18} /> },
      { id: 'orders', label: 'Work Orders', icon: <Icon symbol="precision_manufacturing" size={18} /> }
    ],
    parties: [
      { id: 'overview', label: 'Network Map', icon: <Icons.Dashboard size={18} /> }, 
      { id: 'customers', label: 'Customers', icon: <Icons.Parties size={18} /> }, 
      { id: 'suppliers', label: 'Suppliers', icon: <Icons.Parties size={18} /> }
    ],
    sales: [
      { id: 'overview', label: 'Revenue Pulse', icon: <Icons.Dashboard size={18} /> }, 
      { id: 'invoices', label: 'Tax Invoices', icon: <Icons.Sales size={18} /> }
    ],
    accounting: [
      { id: 'ledger', label: 'General Ledger', icon: <Icon symbol="menu_book" size={18} /> },
      { id: 'cashbank', label: 'Cash & Bank', icon: <Icon symbol="account_balance_wallet" size={18} /> },
      { id: 'bs', label: 'Balance Sheet', icon: <Icon symbol="account_balance" size={18} /> }
    ],
    settings: [
      { id: 'company', label: 'System Params', icon: <Icon symbol="business" size={18} /> },
      { id: 'branches', label: 'Branch Registry', icon: <Icon symbol="storefront" size={18} /> }
    ],
  };

  const handleModuleChange = (module: string) => {
    setCurrentModule(module);
    setShowSearchResults(false);
    setNavOpen(false); 
    setMobileMenuOpen(false);
    const firstSub = subNavs[module]?.[0]?.id;
    if (firstSub) setActiveSubModule(firstSub);
  };

  const renderModule = () => {
    if (showSearchResults) return <GlobalSearchPage query={searchQuery} />;

    switch (currentModule) {
      case 'showcase': return <ShowcaseLanding />;
      case 'dashboard': return <div className="h-full overflow-y-auto px-8u py-8u"><DashboardOverview /></div>;
      case 'inventory': return <InventoryMaster subModule={activeSubModule} onSelectItem={(item) => setSelectedContext({ type: 'item', data: item })} />;
      case 'manufacturing': return <ManufacturingModule type={activeSubModule} />;
      case 'parties': return <PartiesModule type={activeSubModule} onSelectItem={(party) => setSelectedContext({ type: 'party', data: party })} />;
      case 'sales': return <SalesModule subType={activeSubModule} />;
      case 'purchases': return <PurchasesModule subType={activeSubModule} />;
      case 'accounting': 
        if (activeSubModule === 'coa') return <ChartOfAccounts />;
        if (activeSubModule === 'bs') return <BalanceSheetView />;
        return <AccountingModule type={activeSubModule} />;
      case 'settings': 
        if (activeSubModule === 'branches') return <BranchRegistry />;
        if (activeSubModule === 'digital') return <EInvoiceMonitor />;
        if (activeSubModule === 'numbering') return <NumberingConfigurator />;
        return <SettingsModule activeTab={activeSubModule} />;
      default: return <ShowcaseLanding />;
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-white">
      <Scaffold
        disableScroll={true}
        // Mobile Drawer
        mobileNavigation={
            <NavigationDrawer modal open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
                 <div className="p-6u">
                    <div className="w-14 h-14 rounded-xs bg-primary text-on-primary flex items-center justify-center font-black text-xl shadow-lg leading-none mb-6u">VH</div>
                    <NavigationDrawerHeadline>Core Modules</NavigationDrawerHeadline>
                    <div className="flex flex-col gap-2u mt-2u">
                        {modules.map(m => (
                            <NavigationDrawerItem
                                key={m.id}
                                active={currentModule === m.id}
                                onClick={() => handleModuleChange(m.id)}
                                icon={currentModule === m.id ? m.activeIcon : m.icon}
                            >
                                {m.label}
                            </NavigationDrawerItem>
                        ))}
                    </div>
                 </div>
            </NavigationDrawer>
        }
        // Desktop Rail
        navigation={
            <NavigationRail
                items={modules.map(m => ({ ...m, value: m.id }))}
                value={currentModule}
                onChange={handleModuleChange}
                header={
                  <div className="w-14 h-14 rounded-xs bg-primary text-on-primary flex items-center justify-center font-black text-xl shadow-lg leading-none">VH</div>
                }
            />
        }
        // Desktop Secondary Nav (Context Nodes)
        secondaryNavigation={
          <div className="w-[260px] h-full bg-surface-container-low border-r border-outline-variant/30 flex flex-col z-[10] overflow-hidden shrink-0">
            <div className="p-6u pb-2u">
                <Typography variant="labelSmall" className="text-on-surface-variant font-black uppercase tracking-[0.4em] text-[8px] opacity-40">Context Nodes</Typography>
            </div>
            <div className="flex-1 w-full overflow-y-auto no-scrollbar p-4u flex flex-col gap-1.5u">
                {(subNavs[currentModule] || []).map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveSubModule(item.id)}
                        className={cn(
                            "flex items-center gap-4u h-10u px-4u rounded-xs transition-all text-left shrink-0 border border-transparent leading-none w-full", 
                            activeSubModule === item.id 
                            ? "bg-white shadow-sm text-primary border-outline-variant/50" 
                            : "text-on-surface-variant hover:bg-surface-variant/50"
                        )}
                    >
                        <span className={cn("shrink-0", activeSubModule === item.id ? "text-primary" : "text-on-surface-variant/40")}>{item.icon}</span>
                        <Typography variant="labelSmall" className="font-black uppercase truncate text-[10px] tracking-widest leading-none flex-1">{item.label}</Typography>
                    </button>
                ))}
            </div>
          </div>
        }
        fab={
          <div className="fixed bottom-8u right-8u z-[200]">
             <FabMenu actions={[
               { label: 'AI TERMINAL', icon: <Icon symbol="bolt" />, onClick: () => setIsAiTerminalOpen(true) },
               { label: 'NEW INVOICE', icon: <Icons.Sales />, onClick: () => setIsInvoiceSheetOpen(true) }, 
             ]} />
          </div>
        }
      >
        <div className="flex flex-col w-full h-full bg-white overflow-hidden relative">
            {/* Header Area */}
            <div className="sticky top-0 z-[100] flex flex-col w-full bg-white/95 backdrop-blur-md border-b border-outline-variant/30 shrink-0">
                {/* Main Bar */}
                <div className="w-full py-3u px-4u md:px-8u shrink-0 flex items-center gap-3u md:gap-6u h-18u">
                    
                    <SearchBar 
                        placeholder="Registry Lookup (Ctrl + K)..." 
                        className="bg-surface-container-low border-outline-variant/30 h-12u rounded-xs shadow-none flex-1 min-w-0 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchQuery && setShowSearchResults(true)}
                        leadingIcon={
                            <>
                                <IconButton 
                                    className="lg:hidden -ml-2u mr-1u text-on-surface-variant shrink-0" 
                                    onClick={() => setMobileMenuOpen(true)}
                                    variant="standard"
                                >
                                    <Icon symbol="menu" />
                                </IconButton>
                                <Icons.Search size={20} className="hidden lg:block text-on-surface-variant/40" />
                            </>
                        }
                        trailingIcon={
                            <div className="flex items-center gap-4u shrink-0">
                                <SyncIndicator onClick={() => handleModuleChange('settings')} />
                                <Avatar fallback="VH" size="sm" className="bg-primary text-on-primary font-black rounded-xs shrink-0 shadow-sm leading-none" />
                            </div>
                        }
                    />
                </div>

                {/* Mobile Context Chips (ContextualSubNav) */}
                <div className="lg:hidden w-full border-t border-outline-variant/10 bg-surface-container-low/30 pb-2u pt-2u">
                     <ContextualSubNav
                        items={subNavs[currentModule] || []}
                        activeId={activeSubModule}
                        onChange={setActiveSubModule}
                     />
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <SupportingPaneLayout
                    isRoot
                    open={isPaneOpen}
                    onToggleSupporting={togglePane}
                    main={<div className="h-full w-full overflow-hidden relative flex flex-col">{renderModule()}</div>}
                    supporting={
                        <div className="h-full bg-surface-container-lowest flex flex-col">
                            <div className="flex items-center justify-between px-8u h-16u border-b border-outline-variant/30 bg-white z-10 shrink-0">
                                <Typography variant="labelSmall" className="font-black text-[10px] uppercase tracking-[0.3em] text-primary leading-none">System Audit Feed</Typography>
                                <IconButton onClick={togglePane} className="rounded-xs hover:bg-surface-variant h-8u w-8u"><Icon symbol="chevron_right" /></IconButton>
                            </div>
                            <div className="flex-1 w-full overflow-y-auto p-6u flex flex-col gap-6u no-scrollbar">
                                <div className="p-6u rounded-xs bg-secondary text-on-secondary flex flex-col gap-3u shadow-2 border-none">
                                    <Icons.Terminal className="text-primary-container" size={24} />
                                    <Typography variant="labelSmall" className="font-black uppercase tracking-[0.2em] leading-none">Operational Telemetry</Typography>
                                    <Typography variant="bodySmall" className="text-on-secondary/70 font-bold uppercase text-[10px] leading-relaxed">System state is optimal. No registry conflicts detected.</Typography>
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
      </Scaffold>

      <Sheet
        open={isInvoiceSheetOpen}
        onClose={() => setIsInvoiceSheetOpen(false)}
        title="GENERATE TRANSACTION VOUCHER"
        icon={<Icons.Sales />}
        size="lg"
        footerRight={
            <>
                <Button variant="text" size="md" onClick={() => setIsInvoiceSheetOpen(false)} className="font-black text-on-surface-variant">ABORT</Button>
                <Button variant="filled" size="md" className="px-12u shadow-3 font-black uppercase tracking-widest">COMMIT LEDGER</Button>
            </>
        }
      >
        <InvoiceForm onCancel={() => setIsInvoiceSheetOpen(false)} onSave={() => setIsInvoiceSheetOpen(false)} />
      </Sheet>

      <AICommandTerminal open={isAiTerminalOpen} onClose={() => setIsAiTerminalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (<LayoutProvider><AppContent /></LayoutProvider>);
}