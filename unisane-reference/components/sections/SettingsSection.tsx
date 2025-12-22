import React, { useEffect, useState } from 'react';
import { Typography } from '../ui/Typography';
import { Switch } from '../ui/SelectionControls';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const Icons = {
  DarkMode: (props: any) => <Icon {...props}><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></Icon>,
  LightMode: (props: any) => <Icon {...props}><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.79 1.41-1.41-1.79-1.79-1.41 1.41zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></Icon>,
  Palette: (props: any) => <Icon {...props}><path d="M12 3a9 9 0 0 0 0 18c4.97 0 9-4.03 9-9s-4.03-9-9-9zM6.5 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 2.5c-.83 0-1.5.67-1.5 1.5 0 .83.67 1.5 1.5 1.5.83 0 1.5-.67 1.5-1.5 0-.83-.67-1.5-1.5-1.5z"/></Icon>,
};

export const SettingsSection = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <section className="flex flex-col gap-8 pb-20">
      <Typography variant="headlineMedium">Settings</Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="outlined" className="p-0 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                {isDark ? <Icons.DarkMode /> : <Icons.LightMode />}
              </div>
              <div>
                <Typography variant="titleMedium">Appearance</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">Customize the look and feel</Typography>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-base text-on-surface">Dark Mode</span>
                <span className="text-sm text-on-surface-variant">Adjust the theme to reduce eye strain</span>
              </div>
              <Switch checked={isDark} onChange={(e) => toggleTheme(e.target.checked)} />
            </div>
          </CardContent>
        </Card>

        <Card variant="filled" className="p-0 overflow-hidden">
           <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                <Icons.Palette />
              </div>
              <div>
                <Typography variant="titleMedium">System</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">Version info</Typography>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                  <span className="text-sm text-on-surface-variant">Unisane UI Version</span>
                  <span className="text-sm font-mono text-on-surface">v1.0.0-beta</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                  <span className="text-sm text-on-surface-variant">React Version</span>
                  <span className="text-sm font-mono text-on-surface">v19.0.0</span>
              </div>
              <div className="flex justify-end mt-2">
                   <Button variant="text" onClick={() => window.open('https://github.com/unisane/ui', '_blank')}>Check for updates</Button>
              </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};