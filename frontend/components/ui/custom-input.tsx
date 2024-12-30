"use client";

import React, { useState } from "react";

const CustomInput = ({
  placeholder,
  type = "text",
  className,
  rows,
}: {
  placeholder: string;
  type?: string;
  className?: string;
  rows?: number; // Optional rows prop for multi-line input
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };
  const getBackgroundColor = () => {
    if (isFocused) return "#FFFFFF"; // Active background
    if (!isFocused && value.trim() !== "") return "#FFFFFF"; // Filled background
    if (isFocused && !value.trim()) return "#F3F3F6"; // On click background
    return "#EAEAED"; // Default or hover background
  };

  const getBorderColor = () => {
    if (isFocused) return "#181615"; // Active border
    if (value.trim()) return "#171929"; // Filled border
    return "#B055CC"; // Hover and click border
  };

  if (rows) {
    return (
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        style={{
          backgroundColor: getBackgroundColor(),
          border: `1.5px solid ${getBorderColor()}`,
          borderRadius: "8px",
          padding: "10px 15px",
          width: "100%",
          outline: "none",
          color: "black",
          transition: "background-color 0.3s ease, border-color 0.3s ease",
          resize: "vertical",
        }}
        className={className}
      />
    );
  }

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      style={{
        backgroundColor: getBackgroundColor(),
        border: `1.5px solid ${getBorderColor()}`,
        borderRadius: "8px",
        padding: "10px 15px",
        width: "100%",
        outline: "none",
        color: "black",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
      className={className}
    />
  );
};

export default CustomInput;
