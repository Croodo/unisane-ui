import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { TextField } from '../ui/TextField';
import { Select } from '../ui/Select';
import { Checkbox, Radio, Switch } from '../ui/SelectionControls';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { DateRangePicker } from '../ui/DateRangePicker';
import { TimePicker } from '../ui/TimePicker';
import { Icon } from '../ui/Icon';
import { DateRange } from '../ui/Calendar';

const Icons = {
  Person: (props: any) => <Icon {...props}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></Icon>,
  Search: (props: any) => <Icon {...props}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"/></Icon>,
  Calendar: (props: any) => <Icon {...props}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></Icon>,
  Clock: (props: any) => <Icon {...props}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></Icon>,
  DateRange: (props: any) => <Icon {...props}><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></Icon>,
};

export const FormsSection = () => {
  const [sliderVal, setSliderVal] = useState(50);
  const [sliderDiscrete, setSliderDiscrete] = useState(3);
  const [selectVal, setSelectVal] = useState('opt1');
  
  // Pickers State
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [rangePickerOpen, setRangePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // The card has bg-surface-container-low, so outlined inputs need to match that for the notch.
  const bgClass = "bg-surface-container-low";

  return (
    <section className="flex flex-col gap-8">
       <Typography variant="headlineMedium">Forms & Selection</Typography>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Text Fields */}
          <div className="flex flex-col gap-6 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20">
              <Typography variant="titleLarge">Text Fields</Typography>
              <div className="flex flex-col gap-4">
                  <TextField label="Outlined" labelClassName={bgClass} />
                  <TextField label="Filled" variant="filled" />
                  <TextField 
                      label="With Icon" 
                      leadingIcon={<Icons.Person />} 
                      placeholder="Username" 
                      labelClassName={bgClass}
                  />
                  <div className="flex flex-col sm:flex-row gap-4">
                      <TextField label="Error" error helperText="Invalid input" className="flex-1" labelClassName={bgClass} />
                      <TextField label="Disabled" disabled defaultValue="Cannot edit" className="flex-1" labelClassName={bgClass} />
                  </div>
                  <TextField label="Multiline" multiline rows={3} labelClassName={bgClass} />
              </div>
          </div>

          <div className="flex flex-col gap-6">
              {/* Pickers */}
              <div className="p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 flex flex-col gap-6">
                  <Typography variant="titleLarge">Pickers</Typography>
                  <div className="flex flex-wrap gap-4">
                      {/* Date */}
                      <Button 
                          variant="outlined" 
                          icon={<Icons.Calendar />} 
                          onClick={() => setDatePickerOpen(true)}
                      >
                          {selectedDate ? selectedDate.toLocaleDateString() : 'Pick Date'}
                      </Button>
                      <DatePicker 
                          open={datePickerOpen} 
                          onClose={() => setDatePickerOpen(false)} 
                          onSelect={setSelectedDate}
                          initialDate={selectedDate || new Date()}
                      />

                      {/* Range */}
                      <Button 
                          variant="outlined" 
                          icon={<Icons.DateRange />} 
                          onClick={() => setRangePickerOpen(true)}
                      >
                          {selectedRange.from ? 
                              `${selectedRange.from.toLocaleDateString()} - ${selectedRange.to?.toLocaleDateString() || '...'}` 
                              : 'Pick Range'}
                      </Button>
                      <DateRangePicker 
                          open={rangePickerOpen}
                          onClose={() => setRangePickerOpen(false)}
                          onSelect={setSelectedRange}
                          initialRange={selectedRange}
                      />

                      {/* Time */}
                      <Button 
                          variant="outlined" 
                          icon={<Icons.Clock />} 
                          onClick={() => setTimePickerOpen(true)}
                      >
                          {selectedTime || 'Pick Time'}
                      </Button>
                      <TimePicker 
                          open={timePickerOpen}
                          onClose={() => setTimePickerOpen(false)}
                          onSelect={setSelectedTime}
                          initialTime={selectedTime || "12:00"}
                      />
                  </div>
              </div>

              {/* Selection Controls */}
              <div className="p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 flex flex-col gap-6">
                  <Typography variant="titleLarge">Selection Controls</Typography>
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <div className="flex flex-col gap-2 min-w-[120px]">
                          <Checkbox label="Checkbox" defaultChecked />
                          <Checkbox label="Unchecked" />
                          <Checkbox label="Indeterminate" indeterminate />
                          <Checkbox label="Error" error defaultChecked />
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                          <Radio name="r1" label="Radio 1" defaultChecked />
                          <Radio name="r1" label="Radio 2" />
                          <Radio name="r3" label="Disabled" disabled />
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                          <Switch label="Switch On" defaultChecked />
                          <Switch label="With Icons" icons defaultChecked />
                          <Switch label="Disabled" disabled />
                      </div>
                  </div>
              </div>

              {/* Slider & Select */}
              <div className="p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20 flex flex-col gap-6 flex-1">
                  <Typography variant="titleLarge">Range & Dropdown</Typography>
                  <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-1">
                          <Typography variant="labelMedium" className="text-on-surface-variant">Continuous</Typography>
                          <Slider value={sliderVal} onChange={setSliderVal} />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                          <Typography variant="labelMedium" className="text-on-surface-variant">Discrete (with Ticks & Label)</Typography>
                          <Slider 
                            min={0} max={10} step={1}
                            value={sliderDiscrete} 
                            onChange={setSliderDiscrete} 
                            withLabel 
                            withTicks 
                          />
                      </div>
                      
                      <Select 
                        label="Choose an option"
                        value={selectVal}
                        onChange={setSelectVal}
                        options={[
                            { value: 'opt1', label: 'Option 1' },
                            { value: 'opt2', label: 'Option 2' },
                            { value: 'opt3', label: 'Option 3' },
                        ]}
                      />
                  </div>
              </div>
          </div>
       </div>
    </section>
  );
};