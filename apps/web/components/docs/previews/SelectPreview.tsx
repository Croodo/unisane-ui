"use client";

import React, { useState } from "react";
import { Select } from "@unisane/ui";

export const SelectPreview: React.FC = () => {
  const [value, setValue] = useState("operator");

  return (
    <Select
      label="Operator tier"
      value={value}
      onChange={setValue}
      options={[
        { value: "operator", label: "Operator" },
        { value: "supervisor", label: "Supervisor" },
        { value: "admin", label: "Admin" },
      ]}
    />
  );
};
