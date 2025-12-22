import React, { useState } from 'react';
import { TextField } from '../ui/TextField';
import { Select } from '../ui/Select';
import { NumberInput } from '../ui/NumberInput';
import { TagInput } from '../ui/TagInput';
import { FileUpload } from '../ui/FileUpload';
import { Checkbox, Radio, Switch } from '../ui/SelectionControls';
import { Slider } from '../ui/Slider';
import { DatePicker } from '../ui/DatePicker';
import { DateRangePicker } from '../ui/DateRangePicker';
import { TimePicker } from '../ui/TimePicker';
import { MultiSelect } from '../ui/MultiSelect';
import { Combobox } from '../ui/Combobox';
import { Button } from '../ui/Button';
import { Icons } from '../business/Icons';
import { ShowcaseSection, ComponentBlock } from './Shared';

export const InputShowcase = () => {
  const [tags, setTags] = useState(['URGENT']);
  const [multi, setMulti] = useState(['opt1']);
  const [dateOpen, setDateOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [comboVal, setComboVal] = useState('');

  return (
    <div className="animate-in fade-in duration-500">
      <ShowcaseSection title="Text & Data Entry" description="High-precision input surfaces for alphanumeric data.">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ComponentBlock label="Text Fields">
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <TextField label="Standard Outlined" labelBg="bg-stone-50" />
                    <TextField label="Filled Variant" variant="filled" />
                    <TextField label="With Icon" leadingIcon={<Icons.Search />} labelBg="bg-stone-50" />
                    <TextField label="Error State" error helperText="Invalid entry" labelBg="bg-stone-50" />
                </div>
            </ComponentBlock>
            <ComponentBlock label="Specialized Inputs">
                <div className="flex flex-col gap-6 w-full max-w-xs">
                    <NumberInput value={10} onChange={()=>{}} label="Quantity Stepper" />
                    <TagInput tags={tags} onChange={setTags} label="Metadata Tags" />
                    <Combobox 
                        label="Searchable Combo" 
                        value={comboVal} 
                        onChange={setComboVal} 
                        options={[{label: 'React', value: 'react'}, {label: 'Vue', value: 'vue'}, {label: 'Angular', value: 'angular'}]} 
                        placeholder="Select framework..."
                    />
                </div>
            </ComponentBlock>
         </div>
      </ShowcaseSection>

      <ShowcaseSection title="Selection Controls" description="Boolean and multi-option logic gates.">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ComponentBlock label="Toggles">
                <div className="flex flex-col gap-4">
                    <Switch defaultChecked label="System Active" />
                    <Switch icons label="With Icons" />
                    <Switch disabled label="Locked" />
                </div>
            </ComponentBlock>
            <ComponentBlock label="Checks & Radios">
                <div className="flex flex-col gap-3">
                    <Checkbox defaultChecked label="Authorized" />
                    <Checkbox indeterminate label="Partial Sync" />
                    <Radio name="g1" defaultChecked label="Option A" />
                    <Radio name="g1" label="Option B" />
                </div>
            </ComponentBlock>
            <ComponentBlock label="Dropdowns & Ranges">
                <div className="flex flex-col gap-6 w-full max-w-[200px]">
                    <Select label="Single Select" value="1" options={[{label: 'Option 1', value: '1'}]} onChange={()=>{}} />
                    <MultiSelect label="Multi Select" value={multi} options={[{label: 'Option 1', value: 'opt1'}, {label: 'Option 2', value: 'opt2'}]} onChange={setMulti} />
                    <Slider defaultValue={60} />
                </div>
            </ComponentBlock>
         </div>
      </ShowcaseSection>

      <ShowcaseSection title="Date & Time" description="Temporal input controls.">
         <ComponentBlock label="Pickers" className="gap-8">
            <Button variant="outlined" className="justify-between min-w-[140px]" onClick={() => setDateOpen(true)}>
                <span className="text-[10px] font-black">SINGLE DATE</span>
                <Icons.History size={16} />
            </Button>
            <DatePicker open={dateOpen} onClose={() => setDateOpen(false)} />

            <Button variant="outlined" className="justify-between min-w-[140px]" onClick={() => setRangeOpen(true)}>
                <span className="text-[10px] font-black">DATE RANGE</span>
                <Icons.History size={16} />
            </Button>
            <DateRangePicker open={rangeOpen} onClose={() => setRangeOpen(false)} />
         </ComponentBlock>
      </ShowcaseSection>

      <ShowcaseSection title="File Operations" description="Drag-and-drop zones for document attachments.">
         <ComponentBlock label="Upload Zone" className="w-full">
            <div className="w-full max-w-md">
                <FileUpload onFilesSelected={()=>{}} />
            </div>
         </ComponentBlock>
      </ShowcaseSection>
    </div>
  );
};
