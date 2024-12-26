"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Slate, Editable, withReact, RenderElementProps, ReactEditor } from "slate-react";
import { Transforms, Editor, BaseEditor, createEditor, Descendant, Node } from "slate";
import { withHistory } from "slate-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "../components";

type CustomText = { text: string };
type CustomElement = { type: "paragraph" | "code" | "align-left" | "align-right" | "bulleted-list" | "numbered-list"; children: CustomText[] };

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}


export const FILE_DROP = "Drag & drop your company logo (format: .jpeg, .png). Max 25 MB.";
export const PAGE_TOP = "FlowerWork will help you to create an announcement for LinkedIn to " +
  "find the right talent. You can post in both Personal and FlowerWork's " +
  "LinkedIn accounts.";



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
      className={`w-full p-3 border ${isFocused ? "border-purple-500" : "border-gray-300"
        } rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${className}`}
      style={{
        backgroundColor: isFocused ? "#fff" : "#f9f9f9",
        resize: "vertical",
        boxShadow: isFocused ? "0px 0px 5px rgba(128, 0, 128, 0.2)" : "none",
        overflow: "auto", // Ensures scrollbar visibility when needed
        lineHeight: "1.5rem",
      }}
    />
  );
};




const JobDescriptionSection = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>([
    {
      type: "paragraph",
      children: [{ text: "Describe the job you are trying to outsource" }],
    },
  ]);
  const maxCharacters = 1000;

  const handleTextChange = (newValue: Descendant[]) => {
    const plainText = newValue.map((node) => Node.string(node)).join("\n");
    if (plainText.length <= maxCharacters) {
      setValue(newValue);
    }
  };

  const CodeElement = (props: RenderElementProps) => (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
  
  const DefaultElement = (props: RenderElementProps) => (
    <p {...props.attributes}>{props.children}</p>
  );

  const toggleMark = (editor: any, format: string) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const isMarkActive = (editor: any, format: string) => {
    const marks = Editor.marks(editor);
    return marks ? (marks as Record<string, any>)[format] === true : false;
  };

  const toggleBlock = (editor: Editor, format: string) => {
    const isActive = isBlockActive(editor, format);
    Transforms.setNodes(
      editor,
      { type: isActive ? "paragraph" : format as CustomElement['type'] },
      { match: (n: Node) => Editor.isBlock(editor, n) }
    );
  };

  const isBlockActive = (editor: Editor, format: string) => {
    const [match] = Editor.nodes(editor, {
      match: (n: Node) =>
        Editor.isBlock(editor, n) && isCustomElement(n) && n.type === format,
    });
    return !!match;
  };

  type CustomElement = {
    type: "paragraph" | "code" | "align-left" | "align-right" | "bulleted-list" | "numbered-list";
    children: CustomText[];
  };
  
  const isCustomElement = (node: Node): node is CustomElement => {
    return typeof (node as CustomElement).type === "string";
  };
  
  
  
  

  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case "code":
        return <CodeElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);


  return (
    <div className="mb-6">
      <label className="block text-sm font-bold text-gray-700 mb-2">
        Job description <span className="text-red-500">*</span>
      </label>
      <div className="border border-gray-300 rounded-md bg-white p-4">
        <Slate editor={editor} initialValue={value} onChange={handleTextChange}>
          {/* Full Toolbar */}
          <div className="flex flex-wrap gap-2 mb-2 border-b pb-2">
            {/* Text Formatting */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, "bold");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              B
            </button>
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, "italic");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              I
            </button>
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, "underline");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              U
            </button>
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, "strikethrough");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              S
            </button>

            {/* Text Alignment */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "align-left");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              Align Left
            </button>
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "align-center");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              Align Center
            </button>
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "align-right");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              Align Right
            </button>

            {/* Lists */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "bulleted-list");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              Bulleted List
            </button>
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "numbered-list");
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              Numbered List
            </button>

            {/* Link */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                const url = prompt("Enter the URL:");
                if (url) {
                  Editor.addMark(editor, "link", url);
                }
              }}
              className="p-2 hover:bg-gray-200 rounded"
            >
              Link
            </button>
          </div>

          {/* Editable Content */}
          <Editable
            renderElement={renderElement}
            placeholder="Describe the job you are trying to outsource"
            className="min-h-[200px] text-gray-700"
          />

          {/* Bottom Toolbar */}
          <div className="flex flex-wrap gap-2 mt-2 border-t pt-2">
            {/* Additional Symbols */}
            <button className="p-2 hover:bg-gray-200 rounded">Image</button>
            <button className="p-2 hover:bg-gray-200 rounded">Microphone</button>
            <button className="p-2 hover:bg-gray-200 rounded">Code Block</button>
            <button className="p-2 hover:bg-gray-200 rounded">Video</button>
          </div>
        </Slate>
      </div>


      
      {/* Character Counter */}
      <div className="flex justify-between mt-2">
      <span className="text-gray-500 text-sm">
          {maxCharacters - value.reduce((acc, node) => acc + Node.string(node).length, 0)} characters left
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        The more detail you provide, the better we can help you find the right person.
      </p>
    </div>
  );
};




const PostTask = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>(["UX/UI", "Illustration", "HTML", "Web design"]);
  const [experienceRequirements, setExperienceRequirements] = useState<string[]>(["UX/UI", "Illustration", "HTML"]);


  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      setSkills([...skills, e.currentTarget.value.trim()]);
      e.currentTarget.value = "";
    }
  };


  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addExperienceRequirement = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      setExperienceRequirements([
        ...experienceRequirements,
        e.currentTarget.value.trim(),
      ]);
      e.currentTarget.value = "";
    }
  };

  const removeExperienceRequirement = (index: number) => {
    setExperienceRequirements(
      experienceRequirements.filter((_, i) => i !== index)
    );
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
    <div className="bg-gray-50 min-h-screen">
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
            Edit title of outsourced task (Current title: "Design a logo for a
            bakery")
          </label>
          <CustomTextarea
            placeholder="Edit the title of the task here"
            rows={2}
            className="border-gray-300 rounded-md"
          />
        </div>

        {/* Company Title */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Title of your company
          </label>
          <CustomTextarea
            placeholder="Type your company name here"
            rows={2}
            className="border-gray-300 rounded-md" />
        </div>

        {/* Logo Upload */}

        <div className="flex flex-col">
          <label className="lock text-sm font-bold text-gray-700 mb-2">Company logo file</label>
          <div
            onDrop={(e) => handleDrop(e, setLogoFile)}
            onDragOver={handleDragOver}
            className="p-4 border border-gray-400 rounded-md bg-white text-black flex flex-row items-center"
          >
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              id="resume"
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
                const LogoInput = document.getElementById("resume") as HTMLInputElement;
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
            <p className="mt-2 text-gray-500 text-sm text-center">{FILE_DROP}</p>
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
            What skills are required?
          </label>
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

        {/* Experience Requirements */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Preferred years of experience, requirements
          </label>
          <div className="flex flex-wrap gap-2">
            {experienceRequirements.map((requirement, index) => (
              <span
                key={index}
                className="bg-gray-200 text-sm rounded-full px-3 py-1 flex items-center space-x-2"
              >
                {requirement}
                <button
                  onClick={() => removeExperienceRequirement(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <Input
            placeholder="Add requirements and press Enter"
            className="mt-2"
            onKeyDown={addExperienceRequirement}
          />
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Contact information
          </label>
          <Input placeholder="Enter contact email" className="mb-2" />
          <Input placeholder="Enter contact phone number" className="mb-2" />
          <Input placeholder="Company website URL" className="mb-2" />
          <Button variant="outline" className="mt-2 text-sm">
            + Add another contact method
          </Button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline">Save post as draft</Button>
          <Button className="bg-purple-500 hover:bg-purple-600 text-white">
            Preview Post
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostTask;
