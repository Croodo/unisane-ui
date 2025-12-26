import React from 'react';
import { DocLayout, DocSection } from '../pages/doc-layout';
import { DocTable, DocTableColumn } from '../ui/doc-table';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CodeBlock } from '../ui/code-block';

const CardPage: React.FC = () => {
  const toc = [
    { id: 'choosing-cards', label: 'Choosing cards' },
    { id: 'types', label: 'Types' },
    { id: 'api', label: 'API Reference' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'implementation', label: 'Implementation' },
  ];

  // --- Data for the Choosing Buttons Table ---
  const choosingData = [
    { 
      type: 'Elevated', 
      usage: 'Create hierarchy between content and the background.',
      rationale: "Elevated cards have a drop shadow, providing more separation from the background than filled cards, but less than outlined cards."
    },
    { 
      type: 'Filled', 
      usage: 'Provide a subtle visual separation.',
      rationale: "Filled cards have a fill color but no shadow or outline. They are good for separating content without drawing too much attention."
    },
    { 
      type: 'Outlined', 
      usage: 'Group content with a visual border.',
      rationale: "Outlined cards have a stroke and no fill or shadow. They are the most subtle card type and work well on white backgrounds."
    },
  ];

  const choosingColumns: DocTableColumn[] = [
    { header: 'Card type', key: 'type', width: 'w-1/4', render: (row) => <span className="font-medium text-stone-900">{row.type}</span> },
    { header: 'Usage', key: 'usage', width: 'w-1/4' },
    { header: 'Rationale', key: 'rationale', width: 'w-1/2' },
  ];

  // --- API Data ---
  const apiData = [
    { name: 'variant', type: "'elevated' | 'filled' | 'outlined'", default: "'filled'", description: 'The visual style of the card.' },
    { name: 'children', type: 'ReactNode', default: '-', description: 'The content to display inside the card.' },
    { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes to apply to the card container.' },
  ];

  const apiColumns: DocTableColumn[] = [
    { header: 'Prop', key: 'name', width: 'w-1/6', render: (row) => <code className="text-sm font-bold text-[#6750A4] bg-[#F3F3F1] px-2 py-1 rounded">{row.name}</code> },
    { header: 'Type', key: 'type', width: 'w-1/4', render: (row) => <code className="text-xs text-[#B3261E] bg-[#FFF8F7] px-2 py-1 rounded break-all">{row.type}</code> },
    { header: 'Default', key: 'default', width: 'w-1/6', render: (row) => <span className="text-stone-500 font-mono text-xs">{row.default}</span> },
    { header: 'Description', key: 'description', width: 'w-1/3' },
  ];

  // --- Hero Component ---
  const HeroVisual = () => (
    <div className="relative w-full h-full bg-[#F2E7FE] flex items-center justify-center p-8 overflow-hidden isolate">
        {/* Decorative Shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-[#E8DEF8] rounded-full mix-blend-multiply opacity-40 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#D0BCFF] rounded-full mix-blend-multiply opacity-30 blur-3xl" />

        {/* Hero Card Example */}
        <div className="relative z-10 transform transition-transform hover:scale-[1.02] duration-500 ease-out">
            <Card variant="elevated" className="w-[340px] !p-0 overflow-hidden shadow-xl bg-white">
                <div className="h-48 bg-stone-200 relative">
                     <img 
                        src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                        alt="Abstract art" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="p-6">
                    <h3 className="text-2xl font-normal text-[#1D192B] mb-2">Glassmorphism</h3>
                    <p className="text-[#49454F] mb-6 leading-relaxed text-sm">
                        A visual style that uses transparency and background blur to create a glass-like effect.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outlined">Explore</Button>
                        <Button variant="filled">Learn</Button>
                    </div>
                </div>
            </Card>
        </div>
    </div>
  );

  return (
    <DocLayout 
        title="Cards" 
        description="Cards contain content and actions about a single subject. They are flexible containers that can hold images, text, and buttons."
        toc={toc}
        heroContent={<HeroVisual />}
    >
        {/* SECTION 1: Choosing Cards */}
        <DocSection 
            id="choosing-cards" 
            title="Choosing cards" 
            description="Three types of cards are available: elevated, filled, and outlined. Choose the type that best fits the hierarchy of your content."
        >
            <DocTable columns={choosingColumns} data={choosingData} />
        </DocSection>

        {/* SECTION 2: Types (Visuals) */}
        <DocSection 
            id="types" 
            title="Types" 
            description="Use different card types to create visual hierarchy and separation."
        >
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Elevated */}
                <div className="flex flex-col gap-4">
                     <div className="bg-[#F3F3F1] p-8 rounded-[1.5rem] flex items-center justify-center min-h-[280px] border border-stone-100">
                        <Card variant="elevated" className="w-full max-w-[240px] !p-4 min-h-[160px] flex flex-col">
                            <div className="h-4 w-12 bg-stone-200 rounded mb-4" />
                            <div className="h-4 w-3/4 bg-stone-200 rounded mb-2" />
                            <div className="h-4 w-1/2 bg-stone-200 rounded" />
                        </Card>
                     </div>
                     <div className="px-2">
                        <h4 className="text-base font-semibold text-[#1D192B]">Elevated</h4>
                        <p className="text-sm text-[#49454F] mt-1">Lower elevation. Good for list items or dashboard widgets.</p>
                     </div>
                </div>

                {/* Filled */}
                <div className="flex flex-col gap-4">
                     <div className="bg-[#F3F3F1] p-8 rounded-[1.5rem] flex items-center justify-center min-h-[280px] border border-stone-100">
                        <Card variant="filled" className="w-full max-w-[240px] !p-4 min-h-[160px] flex flex-col bg-[#E8DEF8] !border-none">
                             <div className="h-4 w-12 bg-white/50 rounded mb-4" />
                            <div className="h-4 w-3/4 bg-white/50 rounded mb-2" />
                            <div className="h-4 w-1/2 bg-white/50 rounded" />
                        </Card>
                     </div>
                     <div className="px-2">
                        <h4 className="text-base font-semibold text-[#1D192B]">Filled</h4>
                        <p className="text-sm text-[#49454F] mt-1">Subtle background color. Provides good separation from white backgrounds.</p>
                     </div>
                </div>

                {/* Outlined */}
                <div className="flex flex-col gap-4">
                     <div className="bg-[#F3F3F1] p-8 rounded-[1.5rem] flex items-center justify-center min-h-[280px] border border-stone-100">
                        <Card variant="outlined" className="w-full max-w-[240px] !p-4 min-h-[160px] flex flex-col">
                             <div className="h-4 w-12 bg-stone-200 rounded mb-4" />
                            <div className="h-4 w-3/4 bg-stone-200 rounded mb-2" />
                            <div className="h-4 w-1/2 bg-stone-200 rounded" />
                        </Card>
                     </div>
                     <div className="px-2">
                        <h4 className="text-base font-semibold text-[#1D192B]">Outlined</h4>
                        <p className="text-sm text-[#49454F] mt-1">Has a border stroke. Good for high information density.</p>
                     </div>
                </div>

            </div>
        </DocSection>

         {/* SECTION 3: API Reference */}
         <DocSection 
            id="api" 
            title="API Reference" 
            description="Properties for the Card component. All standard HTML Div attributes are also supported."
        >
            <DocTable columns={apiColumns} data={apiData} />
        </DocSection>

        {/* SECTION 4: Accessibility */}
        <DocSection 
            id="accessibility" 
            title="Accessibility"
        >
             <p className="text-stone-600 mb-6 leading-relaxed">
                Cards are generic containers. If a card is interactive (clickable), ensure it follows the following guidelines:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
                <li>If the entire card is clickable, use a semantic button or link tag, or add <code className="text-sm bg-stone-100 px-1 rounded">role="button"</code> and proper tab index.</li>
                <li>Avoid "card within a card" accessibility issues where multiple actions exist in a clickable card. It is better to place actions in the card footer.</li>
            </ul>
        </DocSection>

        {/* SECTION 5: Implementation */}
         <DocSection id="implementation" title="Implementation">
            <p className="mb-4 text-stone-600">Cards are versatile containers.</p>
            <CodeBlock 
                code={`import { Card } from './ui/card';\nimport { Button } from './ui/button';\n\nfunction ArticleCard() {\n  return (\n    <Card variant="elevated" className="max-w-sm overflow-hidden p-0">\n      <img src="/image.jpg" className="h-48 w-full object-cover" />\n      <div className="p-6">\n         <h3 className="text-xl mb-2">Title</h3>\n         <p className="mb-4 text-stone-600">Description text...</p>\n         <Button variant="text">Read more</Button>\n      </div>\n    </Card>\n  );\n}`} 
            />
        </DocSection>
    </DocLayout>
  );
};

export default CardPage;