
import React, { useState, useEffect } from 'react';
import { TextField } from '../../ui/TextField';
import { Typography } from '../../ui/Typography';

interface CategoryFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
        setFormData({
            name: initialData.name || '',
            description: initialData.description || ''
        });
    }
  }, [initialData]);

  return (
    <div className="flex flex-col bg-white w-full">
      <div className="p-8 md:p-10 flex flex-col gap-8">
        <div className="flex flex-col gap-6">
            <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full" /> Category Details
            </Typography>

            <TextField 
              label="CATEGORY NAME" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. Slabs & Tiles" 
              labelClassName="bg-white" 
            />
            
            <TextField 
              label="DESCRIPTION" 
              multiline 
              rows={4} 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              placeholder="Define the item types within this category..." 
              labelClassName="bg-white" 
            />
        </div>
      </div>
    </div>
  );
};
