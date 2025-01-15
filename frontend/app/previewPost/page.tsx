"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from "../components";

const PreviewPost = () => {
  const searchParams = useSearchParams();
  const [logoData, setLogoData] = useState('');
  const taskTitle = searchParams.get('taskTitle');
  const companyName = searchParams.get('companyName');
  const skills = searchParams.get('skills');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const website = searchParams.get('website');
  const logoFileName = searchParams.get('logoFileName');
  
  const jobDescription = searchParams.get('jobDescription');

  // Parse skills safely
  const parsedSkills = skills ? JSON.parse(skills) as string[] : [];

  useEffect(() => {
    // Get logo data from localStorage
    const tempLogoData = localStorage.getItem('tempLogoData');
    if (tempLogoData) {
      setLogoData(tempLogoData);
      // Clean up
      localStorage.removeItem('tempLogoData');
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-100 text-black">
      <div className="w-full max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md mt-10">
        <h1 className="text-3xl font-bold mb-6">Preview Your Post</h1>

        {/* Task Title */}
        <h2 className="text-xl font-semibold mb-4">Task Title</h2>
        <p className="text-lg mb-6">{taskTitle || 'N/A'}</p>

        {/* Company Name */}
        <h2 className="text-xl font-semibold mb-4">Company Name</h2>
        <p className="text-lg mb-6">{companyName || 'N/A'}</p>

        {/* Logo */}
        {logoData && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Company Logo</h2>
            <div className="w-48 h-48 relative">
              <img 
                src={logoData}
                alt="Company Logo"
                className="object-contain w-full h-full rounded-md"
              />
            </div>
          </div>
        )}

        {/* Job Description */}
        <h2 className="text-xl font-semibold mb-4">Job Description</h2>
        <p className="text-lg whitespace-pre-wrap">{jobDescription || 'N/A'}</p>

        {/* Skills */}
        <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
        <p className="text-lg mb-6">{parsedSkills.join(', ') || 'None'}</p>

        {/* Contact Info */}
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        <p className="text-lg mb-2">Email: {email || 'N/A'}</p>
        <p className="text-lg mb-2">Phone: {phone || 'N/A'}</p>
        <p className="text-lg mb-6">Website: {website || 'N/A'}</p>

        {/* Logo */}
        {logoFileName && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Company Logo</h2>
            <p className="text-lg">{logoFileName}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={() => alert("Post to LinkedIn")}
          >
            Post to LinkedIn
          </button>
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded-md"
            onClick={() => window.history.back()}
          >
            Edit Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPost;