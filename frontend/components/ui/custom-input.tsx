"use client";

import React, { useState, useEffect } from "react";

interface CustomInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder: string;
  type?: string;
  className?: string;
  rows?: number;
  required?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  value: externalValue,
  onChange: externalOnChange,
  placeholder,
  type = "text",
  className = "",
  rows,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(externalValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (externalOnChange) {
      externalOnChange(e);
    }
    setInternalValue(e.target.value);
  };

  const getBackgroundColor = () => {
    if (isFocused) return "#FFFFFF"; // Active background
    if (!isFocused && internalValue.trim() !== "") return "#FFFFFF"; // Filled background
    if (isFocused && !internalValue.trim()) return "#F3F3F6"; // On click background
    return "#EAEAED"; // Default or hover background
  };

  const getBorderColor = () => {
    if (isFocused) return "#181615"; // Active border
    if (internalValue.trim()) return "#171929"; // Filled border
    return "#B055CC"; // Hover and click border
  };

  const baseStyles = {
    backgroundColor: getBackgroundColor(),
    border: `1.5px solid ${getBorderColor()}`,
    borderRadius: "8px",
    padding: "10px 15px",
    outline: "none",
    color: "black",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  };

  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  if (rows) {
    return (
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={externalValue !== undefined ? externalValue : internalValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        style={baseStyles}
        className={`resize-vertical w-full ${className}`}
        required={required}
      />
    );
  }

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={externalValue !== undefined ? externalValue : internalValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      style={baseStyles}
      className={`w-full ${className}`}
      required={required}
    />
  );
};

export default CustomInput;