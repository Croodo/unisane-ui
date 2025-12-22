"use client";

import React, { useState } from "react";
import { Button, Dialog, Icon, Typography } from "@unisane/ui";

export const DialogPreview: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="filled" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Deploy config patch"
        icon={<Icon symbol="system_update" />}
        actions={
          <div className="flex gap-3u">
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={() => setOpen(false)}>
              Deploy
            </Button>
          </div>
        }
      >
        <Typography variant="bodyMedium" className="text-on-surface-variant">
          This will apply the patch to 128 nodes and restart the telemetry
          pipeline.
        </Typography>
      </Dialog>
    </>
  );
};
