"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../components";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PAGE_TOP } from "../components/outsource/OutsourceForm";
import CustomInput from "@/components/ui/custom-input";


interface MediaContent {
  type: 'image' | 'video' | 'audio';
  src: string;
}

const PreviewPost = () => {
  const searchParams = useSearchParams();
  const [previewData, setPreviewData] = useState<{
    jobDescription: string;
    mediaContent: MediaContent[];
  }>({ jobDescription: '', mediaContent: [] });
  const [logoUrl, setLogoUrl] = useState<string>("/placeholder-logo.png");
  const taskTitle = searchParams.get("taskTitle");
  const companyName = searchParams.get("companyName");
  const skills = searchParams.get("skills");
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");
  const website = searchParams.get("website");
  const [figmaLink, setFigmaLink] = useState<string>("");
  const [isEditingFigma, setIsEditingFigma] = useState(false);
  // const jobDescription = searchParams.get("jobDescription");
  // const decodedJobDescription = jobDescription ? decodeURIComponent(jobDescription) : '';
  // const mediaContent = searchParams.get("mediaContent")
  //   ? JSON.parse(searchParams.get("mediaContent")!) as MediaContent[]
  //   : [];


  // Parse skills safely
  const parsedSkills = skills ? (JSON.parse(skills) as string[]) : [];

  const renderMedia = (media: MediaContent) => {
    switch (media.type) {
      case 'image':
        return <img src={media.src} alt="Uploaded content" className="max-w-full h-auto" />;
      case 'video':
        return <video src={media.src} controls className="max-w-full" />;
      case 'audio':
        return <audio src={media.src} controls className="w-full" />;
      default:
        return null;
    }
  };

  useEffect(() => {
    // Get preview data from localStorage
    const storedData = localStorage.getItem('previewData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setPreviewData(parsedData);
      // Clean up
      localStorage.removeItem('previewData');
    }

    // Get logo data from localStorage
    const tempLogoData = localStorage.getItem("tempLogoData");
    if (tempLogoData) {
      setLogoUrl(tempLogoData);
      localStorage.removeItem("tempLogoData");
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <header className="relative z-30 w-full">
        <Navbar className="z-40" />
      </header>
      <div className="w-full max-w-4xl mx-auto bg-white shadow-md rounded-md p-6 mt-10">
        {/* Intro Section */}
        <div className="mb-6">
          <p className="text-lg font-semibold">
            {PAGE_TOP}
          </p>
          <h1 className="text-2xl font-bold mt-4">
            Outsource project: <em>{taskTitle || "N/A"}</em>
          </h1>
        </div>

        {/* Preview Block */}
        <div className="mb-6 p-4 border rounded-md shadow-sm bg-white-50">
          {/* company logo and name */}
          <div className="flex items-center gap-4 mb-4">
            {logoUrl && (
              <div className="relative w-10 h-10">
                <Image
                  src={logoUrl}
                  alt="Company Logo"
                  className="rounded-full object-cover"
                  width={40}
                  height={40}
                  unoptimized={logoUrl.startsWith('data:')} // For base64 images
                />
              </div>
            )}
            <div>
              <p className="text-sm font-bold">{companyName || "FlowerWork"}</p>
              <p className="text-xs text-gray-500">2,136 followers • 5h</p>
            </div>
          </div>

          {/* Job Description */}
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <div className="text-sm mb-2 whitespace-pre-wrap">
            {previewData.jobDescription || "N/A"}
            {previewData.mediaContent.map((media, index) => (
              <div key={index} className="mt-4">
                {renderMedia(media)}
              </div>
            ))}
            {/* Skills */}
            <h2 className="text-xl font-semibold mb-4" > Required Skills</h2>
            <p className="text-lg mb-6">{parsedSkills.join(", ") || "None"}</p>

            {/* Contact Info */}
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <p className="text-lg mb-2">Email: {email || "N/A"}</p>
            <p className="text-lg mb-2">Phone: {phone || "N/A"}</p>
            <p className="text-lg mb-6">Website: {website || "N/A"}</p>

            <div className="flex gap-2 mt-4 text-sm text-blue-500">
              <span>#ProjectManagement</span>
              <span>#WorkSmarter</span>
            </div>
          </div>




        </div>
        {/* Post Visibility Options */}
        <div className="mb-6">

          <div className="flex flex-col gap-2 mt-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Share on my personal LinkedIn account
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Share on FlowerWork's LinkedIn account
            </label>
          </div>
          <h2 className="text-lg font-semibold">Post Visibility</h2>
          <select className="mt-4 w-full p-2 border rounded-md">
            <option value="Public">Public</option>
            <option value="Connections Only">Connections Only</option>
          </select>
        </div>
        {/* Figma Link */}
        <div className="mt-6">
          <CustomInput
            placeholder="Figma Link"
            type="url"
            className="mt-2 flex items-center gap-2 text-black-500 
                  hover:text-black-700 
                  transition border border-black-500 px-4 py-2 
                  rounded-full shadow hover:shadow-md bg-gray-300"
          >
          </CustomInput>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            className="mt-2 bg-purple-500 hover:bg-purple-600 
              text-white flex items-center gap-2 
              px-4 py-2 rounded-full shadow hover:shadow-md
              sm:w-auto"
            onClick={() => window.history.back()}
          >
            Edit post
          </Button>
          <Button
            className="mt-2 bg-purple-500 hover:bg-purple-600 
              text-white flex items-center gap-2 
              px-4 py-2 rounded-full shadow hover:shadow-md
              sm:w-auto"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Post on your feed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPost;
