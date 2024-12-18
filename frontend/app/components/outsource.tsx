"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Custom Textarea Component
const CustomTextarea = ({
  placeholder,
  rows = 4,
  className = "",
}: {
  placeholder: string;
  rows?: number;
  className?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");

  return (
    <textarea
      rows={rows}
      value={value}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={`w-full p-3 border ${
        isFocused ? "border-purple-500" : "border-gray-300"
      } rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${className}`}
      style={{
        backgroundColor: isFocused ? "#fff" : "#f9f9f9", // Light gray background
        resize: "none", // Prevent resizing
        boxShadow: isFocused ? "0px 0px 5px rgba(128, 0, 128, 0.2)" : "none",
      }}
    />
  );
};

const PostTask = () => {
  const [skills, setSkills] = useState<string[]>(["UX/UI", "Illustration", "HTML", "Web design"]);
  const [contactMethods, setContactMethods] = useState<string[]>([""]);

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      setSkills([...skills, e.currentTarget.value.trim()]);
      e.currentTarget.value = "";
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addContactMethod = () => {
    setContactMethods([...contactMethods, ""]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-2">
        Outsource task: <em>Design a logo for a bakery</em>
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        FlowerWork will help you to create an announcement for LinkedIn to find the right talent.
      </p>

      {/* Title Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Title of your company</label>
        <Input placeholder="Type your company name here" />
      </div>

      {/* Company Logo Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Company logo file</label>
        <Input type="file" accept="image/*" />
      </div>

      {/* Job Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Job description</label>
        <CustomTextarea
          placeholder="Describe the job you are trying to outsource"
          rows={5}
        />
      </div>

      {/* Skills Required */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">What skills are required?</label>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="bg-gray-200 text-sm rounded-full px-3 py-1 flex items-center space-x-2"
            >
              {skill}
              <button
                onClick={() => removeSkill(index)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="Add skills and press Enter"
          className="mt-2"
          onKeyDown={addSkill}
        />
      </div>

      {/* Contact Information */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Contact information</label>
        {contactMethods.map((_, index) => (
          <Input
            key={index}
            placeholder="Enter contact method (email, phone, etc)"
            className="mb-2"
          />
        ))}
        <Button variant="outline" onClick={addContactMethod} className="mt-2">
          + Add another contact method
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline">Save post as draft</Button>
        <Button className="bg-purple-500 hover:bg-purple-600 text-white">
          Preview Post
        </Button>
      </div>
    </div>
  );
};

export default PostTask;
