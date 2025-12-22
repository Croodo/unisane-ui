"use client";

import React, { useState } from "react";
import { Button, Icon, Snackbar } from "@unisane/ui";

export const SnackbarPreview: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Trigger Snackbar
      </Button>
      <Snackbar
        open={open}
        onClose={() => setOpen(false)}
        message="Telemetry sync requested"
        icon={<Icon symbol="check" />}
        action={{
          label: "Undo",
          onClick: () => setOpen(false),
        }}
        autoHideDuration={4000}
      />
    </>
  );
};
