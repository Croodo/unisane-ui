import React from 'react';
import { Typography } from '../ui/Typography';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { LineChart, BarChart, DonutChart, ChartLegend } from '../ui/Charts';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const mockLineData = [
  { label: 'Mon', value: 120 },
  { label: 'Tue', value: 180 },
  { label: 'Wed', value: 150 },
  { label: 'Thu', value: 240 },
  { label: 'Fri', value: 200 },
  { label: 'Sat', value: 280 },
  { label: 'Sun', value: 230 },
];

const mockBarData = [
  { label: 'Jan', value: 4500 },
  { label: 'Feb', value: 3200 },
  { label: 'Mar', value: 5800 },
  { label: 'Apr', value: 4900 },
  { label: 'May', value: 6200 },
  { label: 'Jun', value: 5500 },
];

const mockPieData = [
  { label: 'Desktop', value: 45 },
  { label: 'Mobile', value: 35 },
  { label: 'Tablet', value: 20 },
];

export const ChartsSection = () => {
  return (
    <section className="flex flex-col gap-8">
       <Typography variant="headlineMedium">Data Visualization</Typography>
       <Typography variant="bodyLarge" className="text-on-surface-variant -mt-6 max-w-3xl">
          Lightweight, dependency-free SVG charts designed to inherit the Material 3 theme tokens automatically. 
          They respond to color mode changes and resize fluidly.
       </Typography>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Line Chart Card */}
          <Card variant="elevated" className="col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <Typography variant="titleLarge">Revenue Growth</Typography>
                    <Typography variant="bodySmall" className="text-on-surface-variant">Weekly performance</Typography>
                  </div>
                  <Button variant="tonal" size="sm" icon={<Icon viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></Icon>}>
                      Report
                  </Button>
              </CardHeader>
              <CardContent className="pt-4">
                  <div className="h-[250px] w-full">
                      <LineChart data={mockLineData} height={250} color="text-primary" />
                  </div>
              </CardContent>
          </Card>

          {/* Donut Chart Card */}
          <Card variant="outlined">
              <CardHeader>
                  <Typography variant="titleLarge">Traffic Source</Typography>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-4">
                   <DonutChart data={mockPieData} height={200} label="Visits" />
                   <ChartLegend data={mockPieData} />
              </CardContent>
          </Card>

          {/* Bar Chart Card */}
          <Card variant="filled" className="col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader>
                  <Typography variant="titleLarge">Monthly Sales</Typography>
              </CardHeader>
              <CardContent className="pt-4">
                  <BarChart data={mockBarData} height={200} color="bg-secondary" />
              </CardContent>
          </Card>

          {/* Sparkline / Small Line Card */}
          <Card variant="outlined" className="col-span-1">
              <CardHeader className="pb-0">
                  <Typography variant="titleMedium">Active Users</Typography>
                  <div className="flex items-end gap-2 mt-1">
                      <span className="text-3xl font-normal">2,840</span>
                      <span className="text-sm font-medium text-tertiary mb-1.5">+12.5%</span>
                  </div>
              </CardHeader>
              <CardContent className="pt-4 pb-0 h-[100px]">
                  <LineChart 
                    data={mockLineData.map(d => ({...d, value: d.value + Math.random() * 50}))} 
                    height={100} 
                    color="text-tertiary" 
                    className="overflow-visible"
                  />
              </CardContent>
          </Card>
          
          <Card variant="outlined" className="col-span-1">
              <CardHeader className="pb-0">
                  <Typography variant="titleMedium">Bounce Rate</Typography>
                   <div className="flex items-end gap-2 mt-1">
                      <span className="text-3xl font-normal">42%</span>
                      <span className="text-sm font-medium text-error mb-1.5">-2.1%</span>
                  </div>
              </CardHeader>
              <CardContent className="pt-4 pb-0 h-[100px]">
                  <BarChart 
                    data={mockBarData.slice(0,5).map(d => ({...d, value: d.value / 100}))} 
                    height={100} 
                    color="bg-error" 
                  />
              </CardContent>
          </Card>

       </div>
    </section>
  );
};