import React from 'react';
import { DocLayout } from './doc-layout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface ComponentsOverviewPageProps {
  onNavigate: (id: string) => void;
}

const ComponentsOverviewPage: React.FC<ComponentsOverviewPageProps> = ({ onNavigate }) => {
  
  const componentList = [
    {
      id: 'button', 
      title: 'Buttons',
      description: 'Buttons help people take action, such as sending an email, sharing a document, or liking a comment.',
      image: 'https://lh3.googleusercontent.com/RxS23Qe_6p0Y_oM_6V3wDk_sZ6xT2-5uK5q3qX2-9x9x9x9x9x9x9x9x9x9=w2400-rj', // Placeholder styled below
      icon: 'smart_button'
    },
    {
      id: 'card',
      title: 'Cards',
      description: 'Cards contain content and actions about a single subject.',
      image: '',
      icon: 'branding_watermark'
    },
    {
        id: 'fab',
        title: 'FABs',
        description: 'A floating action button (FAB) represents the primary action of a screen.',
        icon: 'add_circle',
        disabled: true
    },
    {
        id: 'dialog',
        title: 'Dialogs',
        description: 'Dialogs provide important prompts in a user flow.',
        icon: 'chat_bubble',
        disabled: true
    }
  ];

  return (
    <DocLayout 
        title="Components" 
        description="Material Design components are interactive building blocks for creating a user interface."
    >
        {/* Container Query Grid:
            - @md (container width ~24rem): 1 col (default)
            - @lg (container width ~32rem): 2 cols
            - @2xl (container width ~42rem): 3 cols
            This allows the grid to shrink when the sidebar pushes the content.
        */}
        <div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-6">
            {componentList.map((comp) => (
                <div 
                    key={comp.id}
                    onClick={() => !comp.disabled && onNavigate(comp.id)}
                    className={`
                        group relative overflow-hidden rounded-[2rem] bg-[#F3F3F1] border border-stone-200 transition-all duration-300
                        ${comp.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#E2E2E0] cursor-pointer hover:shadow-lg hover:-translate-y-1'}
                    `}
                >
                    {/* Visual Area */}
                    <div className={`h-40 w-full ${comp.disabled ? 'bg-stone-200' : 'bg-white'} relative flex items-center justify-center`}>
                        {comp.id === 'button' && !comp.disabled && (
                            <div className="flex gap-2 transform group-hover:scale-110 transition-transform">
                                <Button variant="filled">Button</Button>
                            </div>
                        )}
                        {comp.id === 'card' && !comp.disabled && (
                            <div className="transform group-hover:scale-105 transition-transform">
                                <Card variant="elevated" className="w-32 h-24 p-2 flex flex-col gap-2">
                                    <div className="h-2 bg-stone-200 rounded w-1/2"/>
                                    <div className="h-2 bg-stone-100 rounded w-full"/>
                                </Card>
                            </div>
                        )}
                        {comp.disabled && (
                            <span className="material-symbols-outlined !text-[48px] text-stone-300">{comp.icon}</span>
                        )}
                    </div>

                    {/* Text Content */}
                    <div className="p-8">
                        <h3 className="text-2xl font-normal text-stone-900 mb-2 flex items-center gap-2">
                            {comp.title}
                            {comp.disabled && <span className="text-xs bg-stone-200 px-2 py-1 rounded text-stone-500">Soon</span>}
                        </h3>
                        <p className="text-stone-600 text-sm leading-relaxed">
                            {comp.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </DocLayout>
  );
};

export default ComponentsOverviewPage;