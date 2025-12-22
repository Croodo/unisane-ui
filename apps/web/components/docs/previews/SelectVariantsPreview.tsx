"use client";

import React, { useState } from "react";
import { Select } from "@unisane/ui";

export const SelectVariantsPreview: React.FC = () => {
  const [environment, setEnvironment] = useState("prod");
  const [region, setRegion] = useState("us-east");
  const [role, setRole] = useState("operator");
  const [archive, setArchive] = useState("off");

  return (
    <div className="grid gap-4u medium:grid-cols-2 w-full">
      <Select
        label="Environment"
        value={environment}
        onChange={setEnvironment}
        options={[
          { value: "prod", label: "Production" },
          { value: "stage", label: "Staging" },
        ]}
      />
      <Select
        label="Region"
        variant="filled"
        value={region}
        onChange={setRegion}
        options={[
          { value: "us-east", label: "US East" },
          { value: "eu-west", label: "EU West" },
        ]}
      />
      <Select
        label="Role"
        error
        value={role}
        onChange={setRole}
        options={[
          { value: "operator", label: "Operator" },
          { value: "admin", label: "Admin" },
        ]}
      />
      <Select
        label="Archive"
        disabled
        value={archive}
        onChange={setArchive}
        options={[
          { value: "off", label: "Disabled" },
          { value: "on", label: "Enabled" },
        ]}
      />
    </div>
  );
};
