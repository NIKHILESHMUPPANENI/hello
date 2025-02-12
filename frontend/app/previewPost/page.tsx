"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getLinkedInToken, getLinkedInUserInfo, shareLinkedInPost } from "../components/outsource/utils/api";
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
  const router = useRouter();
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
  const [hashtags, setHashtags] = useState<string[]>(['ProjectManagement', 'WorkSmarter']);
  const [newHashtag, setNewHashtag] = useState<string>('');

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

  const handleFigmaLinkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFigmaLink(e.target.value);
  };

  const handleAddHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newHashtag.trim()) {
      e.preventDefault();
      setHashtags([...hashtags, newHashtag.trim().replace(/^#/, '')]);
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (indexToRemove: number) => {
    setHashtags(hashtags.filter((_, index) => index !== indexToRemove));
  };

  const handleEditPost = () => {
    try {
      // Store all form data
      localStorage.setItem('editFormData', JSON.stringify({
        taskTitle,
        companyName,
        skills,
        email,
        phone,
        website,
        jobDescription: previewData.jobDescription,
        mediaContent: previewData.mediaContent
      }));
  
      // Store logo separately
      if (logoUrl) {
        localStorage.setItem('editLogoData', logoUrl);
      }
  
      // Use router to navigate back
      router.push('/post-task');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handlePostToLinkedIn = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let code = urlParams.get("code");
  
      if (!code) {
        startLinkedInAuth(); // Redirect user to LinkedIn OAuth
        return;
      }
  
      // Exchange authorization code for access token
      const tokenResponse = await getLinkedInToken(code);
      if (!tokenResponse?.access_token) {
        alert("Failed to authenticate with LinkedIn");
        return;
      }
  
      // Post to LinkedIn
      const postText = previewData.jobDescription;
      const visibility = "PUBLIC"; // Change this if needed
      const postResponse = await shareLinkedInPost(code, postText, visibility);
  
      if (postResponse) {
        alert("Successfully posted to LinkedIn!");
        localStorage.removeItem("formData");
        localStorage.removeItem("previewData");
        localStorage.removeItem("tempLogoData");
        localStorage.removeItem("editorContent");
      } else {
        alert("Failed to post on LinkedIn");
      }
    } catch (error) {
      console.error("Error posting to LinkedIn:", error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <header className="relative z-30 w-full">
        <Navbar className="z-40" />
      </header>
      <div className="w-full max-w-4xl mx-auto bg-white shadow-md rounded-md p-6 mt-10">
        {/* Intro Section */}
        <div className="mb-6">
          <h1 className="font-montserrat text-3xl sm:text-4xl font-bold mb-6">
            {PAGE_TOP}
          </h1>
          <h1 className="text-3xl font-bold mb-4">
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

            <div className="flex flex-wrap gap-2 mt-4 text-sm">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveHashtag(index)}
                    className="ml-2 hover:text-purple-600"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={handleAddHashtag}
                placeholder="Add hashtag..."
                className="px-3 py-1 text-sm border rounded-full focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>




        </div>
        {/* Post Visibility Options */}
        <div className="mb-8 p-6 border rounded-xl bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Sharing Options</h2>
          
          <div className="space-y-4">
            {/* LinkedIn sharing options */}
            <div className="flex flex-col gap-3 mb-6">
              <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <input type="checkbox" className="w-4 h-4 text-purple-500 rounded border-gray-300 focus:ring-purple-500" />
                <span className="text-gray-700">Share on my personal LinkedIn account</span>
              </label>
              <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <input type="checkbox" className="w-4 h-4 text-purple-500 rounded border-gray-300 focus:ring-purple-500" />
                <span className="text-gray-700">Share on FlowerWork's LinkedIn account</span>
              </label>
            </div>
        
            {/* Visibility dropdown */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-700">Post Visibility</h3>
              <div className="relative w-full max-w-xs">
                <select
                  className="appearance-none w-full px-6 py-3 border-2 rounded-full 
                    bg-white text-gray-700 font-medium
                    shadow-sm hover:border-purple-400
                    focus:outline-none focus:border-purple-500 focus:ring-2 
                    focus:ring-purple-200 focus:ring-opacity-50
                    transition-all duration-200 ease-in-out
                    cursor-pointer"
                >
                  <option value="Public" className="py-2">🌎 Public</option>
                  <option value="Connections Only" className="py-2">👥 Connections Only</option>
                  <option value="Private" className="py-2">🔒 Private</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-purple-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Figma Link */}
        <div className="mt-6">
          <CustomInput
            placeholder="Figma Link"
            type="url"
            value={figmaLink}
            onChange={handleFigmaLinkChange}
            className="mt-2 flex items-center gap-2 text-black-500 
                  hover:text-black-700 
                  transition border border-black-500 px-4 py-2 
                  rounded-full shadow hover:shadow-md bg-gray-300"
          >
          </CustomInput>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-4 mt-4">
          <Button
            className="mt-2 bg-purple-500 hover:bg-purple-600 
              text-white flex items-center gap-2 
              px-4 py-2 rounded-full shadow hover:shadow-md
              sm:w-auto"
            onClick={handleEditPost}
          >
            <svg
              className="h-5 w-5"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.293.207l-4 2a1 1 0 01-1.316-1.316l2-4a1 1 0 01.207-.293l9.9-9.9a2 2 0 012.828 0zM15.586 4L12 7.586 14.414 10 18 6.414 15.586 4zM11 9.414L6.414 14 4 11.586 8.586 7 11 9.414zM5 15h.01L5 15zm0 0l1.586-1.586L4.414 14.414 5 15z" />
            </svg>
            Edit post
          </Button>
          <Button
            className="mt-2 bg-purple-500 hover:bg-purple-600 
              text-white flex items-center gap-2 
              px-4 py-2 rounded-full shadow hover:shadow-md
              sm:w-auto"
            onClick={handlePostToLinkedIn}
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
