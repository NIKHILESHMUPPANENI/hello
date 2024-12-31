"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "../components";
import CustomInput from "@/components/ui/custom-input";
import JobDescriptionSection from "./ui/jobDescribtionText";

export const FILE_DROP = "Drag & drop your company logo (format: .jpeg, .png). Max 25 MB.";
export const PAGE_TOP = "FlowerWork will help you to create an announcement for LinkedIn to " +
  "find the right talent. You can post in both Personal and FlowerWork's " +
  "LinkedIn accounts.";



const PostTask = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]); // Skills array
  const [showModal, setShowModal] = useState(false); // Toggle modal visibility
  const maxSkills = 10; // Maximum number of skills
  const inputRef = useRef<HTMLInputElement>(null); // Reference to input
  const [experienceRequirements, setExperienceRequirements] = useState<string[]>(["UX/UI", "Illustration", "HTML"]);


  const addSkill = (value: string) => {
    if (value.trim() && skills.length < maxSkills) {
      setSkills([...skills, value.trim()]); // Add skill
      setShowModal(false); // Hide modal
      setExperienceRequirements([...experienceRequirements, ""]); // Add an empty requirement
    }
  };

  // Handle pressing "Enter" key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputRef.current) {
      addSkill(inputRef.current.value);
      inputRef.current.value = ""; // Clear input
    }
  };

  // Handle "Choose" button click
  const handleChooseClick = () => {
    if (inputRef.current) {
      addSkill(inputRef.current.value); // Add skill
      inputRef.current.value = ""; // Clear input
    }
  };

  // Remove skill
  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index)); // Remove skill
    setExperienceRequirements(experienceRequirements.filter((_, i) => i !== index));
  };


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      console.log("Selected file:", droppedFile.name);
    }
  };

  return (
    <div className="w-full min-h-screen text-black">
      <header className="relative z-30 w-full">
        <Navbar className="z-40" />
      </header>
      <div className="w-full max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md mt-10">
        {/* Top Text */}
        <h1 className="font-montserrat text-3xl sm:text-4xl font-bold mb-6">
          {PAGE_TOP}
        </h1>

        {/* Title Section */}
        <h1 className="text-3xl font-bold mb-4">
          Outsource task: <em>Design a logo for a bakery</em>
        </h1>

        {/* Edit Title */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Edit title of outsourced task (Current title: "Design a logo for a bakery")
          </label>
          <CustomInput
            placeholder="Edit the title of the task here"
            rows={2} // Multi-line input
            className="border-gray-300 rounded-md"
          />
        </div>

        {/* Company Title */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Title of your company
          </label>
          <CustomInput
            placeholder="Type your company name here"
            rows={2} // Multi-line input
            className="border-gray-300 rounded-md"
          />
        </div>

        {/* Logo Upload */}

        <div className="flex flex-col mb-6">
          <label className="lock text-sm font-bold text-gray-700 mb-2">Company logo file</label>
          <div
            onDrop={(e) => handleDrop(e, setLogoFile)}
            onDragOver={handleDragOver}
            className="p-4 border border-gray-400 gap-2 rounded-md bg-white text-black flex flex-row items-center"
          >
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              id="logo"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) setLogoFile(selectedFile);
              }}
            />
            <Button
              className="flex items-center justify-center bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition"
              style={{
                minWidth: "120px",
                fontSize: "0.875rem",
                color: "#555555",
                padding: "8px",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
              onClick={(e) => {
                e.preventDefault();
                const LogoInput = document.getElementById("logo") as HTMLInputElement;
                if (LogoInput) LogoInput.click();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                style={{
                  display: "inline-block",
                }}
              >
                <path d="M21.44 11.05L12.4 20.1c-1.69 1.69-4.44 1.69-6.13 0-1.69-1.69-1.69-4.44 0-6.13l8.1-8.1c1.17-1.17 3.07-1.17 4.24 0 1.17 1.17 1.17 3.07 0 4.24l-8.1 8.1a1.5 1.5 0 01-2.12-2.12L15.18 7.3" />
              </svg>
              <span>Attach a file</span>
            </Button>
            <p className="flex items-center justify-center transition">{FILE_DROP}</p>
          </div>
          {logoFile && (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-gray-300">Selected file: {logoFile.name}</p>
              <Button
                className="text-red-500 hover:text-red-700 transition"
                onClick={() => setLogoFile(null)}
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        {/* Job Description */}
        <JobDescriptionSection />


        {/* Skills Section */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            What skills are required? <span className="text-red-500">*</span>
          </label>


          {/* Skills Display */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 border rounded-md p-3">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="
                  mt-2 flex items-center gap-2 text-black-500 
                  hover:text-black-700 
                  transition border border-black-500 px-4 py-2 
                  rounded-full shadow hover:shadow-md"
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
          )}


          {/* Counter */}
          <p className="text-sm text-gray-500 mt-1">
            {skills.length}/{maxSkills} selected
          </p>

          {/* Add Skills Button */}
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 flex items-center gap-2 text-black-500 hover:text-black-700 transition border border-black-500 px-4 py-2 rounded-full shadow hover:shadow-md"

          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add skills
          </button>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
              <div
                className="bg-white rounded-md shadow-lg w-96 p-6 animate-modal"
                style={{
                  animation: "fadeInScale 0.3s ease-in-out", // Add animation
                }}
              >
                <h2 className="text-lg font-bold mb-4">Add a skill</h2>
                <input
                  type="text"
                  ref={inputRef}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                  placeholder="Type a skill and press Enter"
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="mt-2 bg-gray-200 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition border border-black-500 px-4 py-2 rounded-full shadow hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChooseClick}
                    className="mt-2 flex items-center gap-2 text-purple-500 hover:text-purple-700 transition border border-purple-500 px-4 py-2 rounded-full shadow hover:shadow-md"
                  >
                    choose
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Animation Keyframes */}
          <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
        </div>



        {/* Preferred Years of Experience Section */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Preferred years of experience, requirements <span className="text-red-500">*</span>
          </label>
          <div className="space-y-4">
            {skills.map((skill, index) => (
              <div key={index} className="flex flex-col">
                {/* Skill Name with Dropdown */}

                <select
                  className="mt-2 flex items-center gap-2 text-black-500 
                  hover:text-black-700 
                  transition border border-black-500 px-4 py-2 
                  rounded-full shadow hover:shadow-md"
                  onChange={(e) => {
                    // Update the experience requirements
                    const updatedExperience = [...experienceRequirements];
                    updatedExperience[index] = e.target.value; // Update experience for this skill
                    setExperienceRequirements(updatedExperience);
                  }}
                  value={experienceRequirements[index] || ""}
                >
                  <option value="" disabled>
                    {skill}
                  </option>
                  <option value="1-2">{skill}: 1-2 years</option>
                  <option value="3-5">{skill}: 3-5 years</option>
                  <option value="5+">{skill}: 5+ years</option>
                </select>
              </div>
            ))}
          </div>
        </div>



        {/* Contact Information */}
        <div className="mb-6 col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Contact information
          </label>
          <div className="flex flex-col gap-4"> {/* Stack inputs vertically */}
            <CustomInput
              type="email"
              placeholder="Enter contact email"
              className="w-full p-2 text-sm border-gray-300 rounded-md"
            />
            <CustomInput
              type="tel"
              placeholder="Enter contact phone number"
              className="w-full p-2 text-sm border-gray-300 rounded-md"
            />
            <CustomInput
              type="url"
              placeholder="Company website URL"
              className="w-full p-2 text-sm border-gray-300 rounded-md"
            />
          </div>
          <button
            className="
              mt-2 flex items-center gap-2 text-black-500 
              hover:text-black-700 
              transition border border-black-500 px-4 py-2 
              rounded-full shadow hover:shadow-md"  // Full width on small screens
          >
            <span className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" // Adjust icon size based on screen size
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add other contact method
            </span>
          </button>
        </div>


        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-start gap-4 mt-6">
          {/* Preview Post Button */}

          <Button
            className="
          mt-2 bg-purple-500 hover:bg-purple-600 
          text-white flex items-center gap-2 
          px-4 py-2 rounded-full shadow hover:shadow-md
           sm:w-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview Post
          </Button>

          {/* Save Post as Draft Button */}
          <Button
            variant="outline"
            className="
          mt-2 flex items-center gap-2 text-black-500 
          hover:text-black-700 
          transition border border-black-500 px-4 py-2 
          rounded-full shadow hover:shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Save post as draft
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostTask;
