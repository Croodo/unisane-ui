import React from 'react';
import { DocLayout, DocSection } from '../pages/doc-layout';
import { DocTable, DocTableColumn } from '../ui/doc-table';
import { Button } from '../ui/button';
import { CodeBlock } from '../ui/code-block';

const ButtonPage: React.FC = () => {
  const toc = [
    { id: 'choosing-buttons', label: 'Choosing buttons' },
    { id: 'hierarchy', label: 'Hierarchy' },
    { id: 'placement', label: 'Placement' },
    { id: 'api', label: 'API Reference' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'implementation', label: 'Implementation' },
  ];

  // --- Data for the Choosing Buttons Table ---
  const choosingData = [
    { 
      emphasis: 'High emphasis', 
      component: <Button variant="filled" className="pointer-events-none">Filled button</Button>,
      rationale: "The filled button's primary color palette makes it the most prominent button after the FAB. It's used for final or unblocking actions in a flow.",
      example: 'Save, Confirm, Done'
    },
    { 
      emphasis: 'Medium emphasis', 
      component: <Button variant="tonal" className="pointer-events-none">Tonal button</Button>,
      rationale: "The tonal button has a secondary color palette, making it less visually prominent than a regular, filled button. It can be used for final or unblocking actions.",
      example: 'Next, Add, Reply'
    },
    { 
      emphasis: 'Low emphasis', 
      component: <Button variant="outlined" className="pointer-events-none">Outlined button</Button>,
      rationale: "Use an outlined button for actions that need attention but aren't the primary action, such as \"See all\" or \"Add to cart\".",
      example: 'Back, See all'
    },
    { 
      emphasis: 'Lowest emphasis', 
      component: <Button variant="text" className="pointer-events-none">Text button</Button>,
      rationale: "Text buttons are used for low-priority actions, such as \"Cancel\" or \"Learn more\". They are often used in dialogs and cards.",
      example: 'Cancel, Learn more'
    },
  ];

  const choosingColumns: DocTableColumn[] = [
    { header: 'Level of emphasis', key: 'emphasis', width: 'w-1/6' },
    { header: 'Component', key: 'component', width: 'w-1/4', render: (row) => row.component },
    { header: 'Rationale', key: 'rationale', width: 'w-1/3' },
    { header: 'Example actions', key: 'example', width: 'w-1/4' },
  ];

  // --- API Data ---
  const apiData = [
    { name: 'children', type: 'ReactNode', default: '-', description: 'The content displayed inside the button.' },
    { name: 'variant', type: "'filled' | 'tonal' | 'outlined' | 'text' | 'elevated'", default: "'filled'", description: 'The visual style of the button.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'The size of the button.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'If true, the button expands to full width.' },
    { name: 'onClick', type: '() => void', default: 'undefined', description: 'Callback fired when the button is clicked.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'If true, the button is disabled and cannot be clicked.' },
    { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes to apply to the button.' },
  ];

  const apiColumns: DocTableColumn[] = [
    { header: 'Prop', key: 'name', width: 'w-1/6', render: (row) => <code className="text-sm font-bold text-[#6750A4] bg-[#F3F3F1] px-2 py-1 rounded">{row.name}</code> },
    { header: 'Type', key: 'type', width: 'w-1/4', render: (row) => <code className="text-xs text-[#B3261E] bg-[#FFF8F7] px-2 py-1 rounded break-all">{row.type}</code> },
    { header: 'Default', key: 'default', width: 'w-1/6', render: (row) => <span className="text-stone-500 font-mono text-xs">{row.default}</span> },
    { header: 'Description', key: 'description', width: 'w-1/3' },
  ];

  // --- Hero Component ---
  const HeroVisual = () => (
    <div className="relative w-full h-full bg-[#E2F2FF] flex items-center justify-center p-8 overflow-hidden isolate">
        {/* Decorative Circles */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#D3E3FD] rounded-full opacity-50 blur-2xl" />
        <div className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-[#C2E7FF] rounded-full opacity-50 blur-2xl" />

        {/* Mock Screen */}
        <div className="relative bg-white w-[300px] h-[360px] rounded-[1.5rem] shadow-xl overflow-hidden flex flex-col border border-stone-100 z-10">
            {/* Mock Image Header */}
            <div className="h-40 bg-stone-200 relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 right-4 transform transition-transform group-hover:scale-105">
                     <Button variant="filled" className="shadow-md !bg-[#D3E3FD] !text-[#001D35] hover:!bg-[#C2E7FF]">
                        <span className="material-symbols-outlined !text-[18px]">edit</span>
                        Edit
                     </Button>
                </div>
            </div>
            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
                <div className="h-2 w-16 bg-stone-200 rounded mb-4" />
                <h3 className="text-2xl font-normal text-stone-800 mb-2 leading-tight">Top 5 tea houses</h3>
                <p className="text-stone-500 text-sm mb-auto">Seattle is full of amazing tea spots. Here are 5 of the coziest ones.</p>
                
                <div className="flex gap-2 pt-4">
                    <Button variant="tonal" className="flex-1">Read entry</Button>
                    <Button variant="text">Share</Button>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <DocLayout 
        title="All buttons" 
        description="Buttons help people take action, such as sending an email, sharing a document, or liking a comment."
        toc={toc}
        heroContent={<HeroVisual />}
    >
        {/* SECTION 1: Choosing Buttons */}
        <DocSection 
            id="choosing-buttons" 
            title="Choosing buttons" 
            description="When choosing the right button for an action, consider the level of emphasis each button type provides."
        >
            <DocTable columns={choosingColumns} data={choosingData} />
        </DocSection>

        {/* SECTION 2: Hierarchy */}
        <DocSection 
            id="hierarchy" 
            title="Hierarchy" 
            description="Button hierarchy helps users understand the importance of actions. The more important an action is, the more emphasis it should have."
        >
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* High Emphasis */}
                <div className="flex flex-col items-center gap-4 bg-[#F3F3F1] rounded-[1.5rem] p-12 text-center border border-stone-100">
                     <Button variant="filled">Primary</Button>
                     <div>
                        <span className="block text-sm font-semibold text-stone-800">High emphasis</span>
                        <span className="text-xs text-stone-500">Filled button</span>
                     </div>
                </div>
                {/* Medium Emphasis */}
                <div className="flex flex-col items-center gap-4 bg-[#F3F3F1] rounded-[1.5rem] p-12 text-center border border-stone-100">
                     <Button variant="tonal">Secondary</Button>
                     <div>
                        <span className="block text-sm font-semibold text-stone-800">Medium emphasis</span>
                        <span className="text-xs text-stone-500">Tonal button</span>
                     </div>
                </div>
                {/* Low Emphasis */}
                <div className="flex flex-col items-center gap-4 bg-[#F3F3F1] rounded-[1.5rem] p-12 text-center border border-stone-100">
                     <Button variant="text">Tertiary</Button>
                     <div>
                        <span className="block text-sm font-semibold text-stone-800">Low emphasis</span>
                        <span className="text-xs text-stone-500">Text button</span>
                     </div>
                </div>
            </div>
        </DocSection>

        {/* SECTION 3: Placement */}
        <DocSection 
            id="placement" 
            title="Placement" 
            description="Buttons can be placed in a variety of containers, such as cards, dialogs, and app bars."
        >
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Example 1: Dialog */}
                <div className="bg-stone-50 rounded-[1.5rem] p-8 border border-stone-200">
                    <h3 className="text-lg font-medium mb-6 text-stone-800">Dialog placement</h3>
                    
                    {/* Mock Dialog Surface */}
                    <div className="bg-white rounded-[1.75rem] p-6 shadow-sm max-w-[320px] mx-auto border border-stone-100">
                        <div className="mb-4">
                            <h4 className="text-xl font-normal text-stone-900">Discard draft?</h4>
                            <p className="text-stone-600 mt-2 text-sm">This will permanently delete your current draft.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="text">Cancel</Button>
                            <Button variant="text">Discard</Button>
                        </div>
                     </div>

                     <p className="mt-8 text-center text-sm text-stone-500 font-medium">Text buttons on the right side of dialogs</p>
                </div>
                
                {/* Example 2: Card */}
                 <div className="bg-stone-50 rounded-[1.5rem] p-8 border border-stone-200">
                    <h3 className="text-lg font-medium mb-6 text-stone-800">Card placement</h3>
                     
                     {/* Mock Card Surface */}
                     <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm max-w-[320px] mx-auto border border-stone-200">
                        <div className="h-32 bg-stone-200 w-full" />
                        <div className="p-4">
                            <div className="h-5 bg-stone-200 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-stone-100 rounded w-full mb-2" />
                            <div className="h-4 bg-stone-100 rounded w-2/3 mb-6" />
                            
                            <div className="flex gap-2">
                                <Button variant="filled" className="!px-6 !py-2">Buy</Button>
                                <Button variant="outlined" className="!px-6 !py-2">Info</Button>
                            </div>
                        </div>
                     </div>

                     <p className="mt-8 text-center text-sm text-stone-500 font-medium">Buttons aligned to start of content in cards</p>
                </div>
             </div>
        </DocSection>

        {/* SECTION 4: API Reference */}
        <DocSection 
            id="api" 
            title="API Reference" 
            description="Properties for the Button component. All standard HTML button attributes are also supported."
        >
            <DocTable columns={apiColumns} data={apiData} />
        </DocSection>

        {/* SECTION 5: Accessibility */}
        <DocSection 
            id="accessibility" 
            title="Accessibility"
        >
            <p className="text-stone-600 mb-6 leading-relaxed">
                The Button component renders a native <code className="text-sm bg-stone-100 px-1 rounded">button</code> element, ensuring standard keyboard navigation and screen reader support out of the box.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
                <li>Focus states are managed automatically with a visible ring.</li>
                <li>Disabled buttons receive the <code className="text-sm bg-stone-100 px-1 rounded">disabled</code> attribute and <code className="text-sm bg-stone-100 px-1 rounded">aria-disabled="true"</code>.</li>
                <li>Icons are purely decorative by default; if using an icon-only button, ensure you provide an <code className="text-sm bg-stone-100 px-1 rounded">aria-label</code>.</li>
            </ul>
        </DocSection>

        {/* SECTION 6: Implementation */}
         <DocSection id="implementation" title="Implementation">
            <p className="mb-4 text-stone-600">Import the component and specify the variant.</p>
            <CodeBlock code={`import { Button } from './ui/button';\n\nfunction MyComponent() {\n  return (\n    <div className="flex gap-4">\n      <Button variant="filled" onClick={handleSubmit}>Submit</Button>\n      <Button variant="text" onClick={handleCancel}>Cancel</Button>\n    </div>\n  );\n}`} />
        </DocSection>
    </DocLayout>
  );
};

export default ButtonPage;