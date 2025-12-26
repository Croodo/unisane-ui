import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'tsx' }) => {
  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#1C1B1F] border border-[#49454F]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2B2930] border-b border-[#49454F]">
        <span className="text-xs text-[#CAC4D0] uppercase tracking-wider font-medium">{language}</span>
        <button 
            className="text-[#CAC4D0] hover:text-white transition-colors"
            onClick={() => navigator.clipboard.writeText(code)}
            title="Copy code"
        >
            <span className="material-symbols-outlined !text-[16px]">content_copy</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-[#E6E1E5] whitespace-pre">
          {code}
        </pre>
      </div>
    </div>
  );
};