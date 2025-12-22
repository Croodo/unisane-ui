import React, { useState, useRef, useEffect } from 'react';
import { Typography } from '../../ui/Typography';
import { TextField } from '../../ui/TextField';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../../../lib/utils';

export const AICommandTerminal = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isLoading]);

  const handleCommand = async () => {
    if (!query.trim()) return;
    
    const userText = query;
    setQuery('');
    setHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: {
            systemInstruction: "You are the Stone Edition ERP Intelligence Assistant. You provide concise, data-driven answers about inventory, sales, and accounting. Format numbers as Indian Rupees (₹) where applicable. Keep responses under 3 sentences."
        }
      });
      
      setHistory(prev => [...prev, { role: 'ai', text: response.text || "Analysis complete. System ready." }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', text: "Protocol Error: Intelligence services temporarily unreachable." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        title="COMMAND TERMINAL" 
        icon={<Icons.Terminal />}
        contentClassName="p-0"
    >
      <div className="flex flex-col h-[500px] bg-stone-900 text-white font-mono">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
           <div className="flex flex-col gap-2 opacity-50">
              <span className="text-[10px] font-black uppercase text-primary-container tracking-widest">System Handshake Established</span>
              <span className="text-[10px] font-black uppercase text-stone-50">Gemini 3-Flash Core Staged</span>
           </div>

           {history.map((msg, i) => (
             <div key={i} className={cn(
                "flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 duration-300",
                msg.role === 'ai' ? "pl-4 border-l-2 border-primary" : "opacity-80"
             )}>
                <span className="text-[10px] font-black uppercase text-stone-500">
                    {msg.role === 'user' ? '> OPERATOR' : '< VH_INTELLIGENCE'}
                </span>
                <p className="text-sm leading-relaxed">{msg.text}</p>
             </div>
           ))}

           {isLoading && (
              <div className="flex items-center gap-3 text-primary animate-pulse">
                 <span className="text-xs font-black">ANALYZING REGISTRY...</span>
              </div>
           )}
        </div>

        <div className="p-4 bg-stone-800 border-t border-white/5 flex gap-3">
           <input 
             value={query}
             onChange={e => setQuery(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleCommand()}
             placeholder="Type natural language command..."
             className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-stone-600 focus:ring-0"
             autoFocus
           />
           <button 
             onClick={handleCommand}
             disabled={isLoading || !query.trim()}
             className="w-10 h-10 rounded-xs bg-primary text-stone-900 flex items-center justify-center hover:bg-emerald-400 disabled:opacity-30 transition-all"
           >
              <Icon symbol="send" size={20} />
           </button>
        </div>
      </div>
    </Dialog>
  );
};