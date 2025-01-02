"use client";

import React, { useMemo, useState, useCallback } from "react";
import Icon from '@mdi/react';
import { mdiFormatLetterCase, mdiFormatBold } from '@mdi/js';
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Slate, Editable, withReact, RenderElementProps, ReactEditor } from "slate-react";
import { Element, Transforms, Editor, BaseEditor, createEditor, Descendant, Node } from "slate";
import { withHistory } from "slate-history";


type CustomText = { text: string; bold?: boolean; uppercase?: boolean; italic?: boolean };
type CustomElement = { type: "paragraph" | "code" | "align-left" | "align-center" | "align-right" | "bulleted-list" | "numbered-list"; children: CustomText[] };

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const PLACEHOLDER_TEXT = "Describe the job you are trying to outsource";

const JobDescriptionSection = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>([
    {
      type: "paragraph",
      children: [{ text: "" }],
    },
  ]);

  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);

  const maxCharacters = 1000;

  const handleTextChange = (newValue: Descendant[]) => {
    const plainText = newValue.map((node) => Node.string(node)).join("\n");

    // Check if the content is empty or just whitespace
    if (plainText.trim() === "") {
      setIsPlaceholderVisible(true);
      setValue([{ type: "paragraph", children: [{ text: "" }] }]);
      return;
    }

    // If within character limit, update normally
    if (plainText.length <= maxCharacters) {
      setIsPlaceholderVisible(false);
      setValue(newValue);
      return;
    }

    // If we're over the limit, prevent the change
    const currentText = value.map((node) => Node.string(node)).join("\n");
    if (currentText.length >= maxCharacters) {
      // Don't update if we're already at or over the limit
      return;
    }

    // If this is a new change that would exceed the limit,
    // keep the current value
    setValue(value);
  };

  // Add this function to handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentLength = value.reduce((acc, node) => acc + Node.string(node).length, 0);

    // Allow deletion and navigation keys
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.metaKey ||
      event.ctrlKey
    ) {
      return;
    }

    // Prevent typing if at character limit
    if (currentLength >= maxCharacters) {
      event.preventDefault();
    }
  }, [value, maxCharacters]);  // Add dependencies

  const getRemainingCharacters = (maxCharacters: number, value: Descendant[]): number => {
    return maxCharacters - value.reduce((acc: number, node: Descendant) => acc + Node.string(node).length, 0);
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

  const isBlockActive = (editor: Editor, format: string) => {
    const [match] = Editor.nodes(editor, {
      match: (n) => isCustomElement(n) && n.type === format,
    });
    return !!match;
  };

  const toggleBlock = (editor: Editor, format: CustomElement['type']) => {
    const isActive = isBlockActive(editor, format);
    Transforms.setNodes(
      editor,
      { type: isActive ? "paragraph" : format }, // Use the defined union type
      { match: (n) => isCustomElement(n) }
    );
  };

  const toggleUppercase = (editor: Editor) => {
    const isActive = isMarkActive(editor, "uppercase");
    if (isActive) {
      Editor.removeMark(editor, "uppercase");
    } else {
      Editor.addMark(editor, "uppercase", true);
    }
  };





  type CustomElement = {
    type: "paragraph" | "code" | "align-left" | "align-center" | "align-right" | "bulleted-list" | "numbered-list";
    children: CustomText[];
  };

  const isCustomElement = (node: Node): node is CustomElement => {
    return Element.isElement(node) && "type" in node;
  };


  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false); // Toggle Emoji Picker

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    Transforms.insertText(editor, emojiData.emoji); // Insert emoji at cursor position
    setIsEmojiPickerVisible(false); // Close picker after selection
  };

  interface RenderLeafProps {
    attributes: any;
    children: any;
    leaf: {
      bold?: boolean;
      uppercase?: boolean;
      italic?: boolean;
    };
  }

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children } = props;

    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (props.leaf.uppercase) {
      children = <span style={{ textTransform: "uppercase" }}>{children}</span>;
    }
    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }

    return <span {...props.attributes}>{children}</span>;
  }, []);


  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case "code":
        return <CodeElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);


  return (
    <div className="mb-6 relative">
      <label className="block text-sm font-bold text-gray-700 mb-3">
        Job description <span className="text-red-500">*</span>
      </label>
      <div className="border border-gray-300 rounded-3xl bg-white p-4 ">
        <Slate editor={editor} initialValue={value} onChange={handleTextChange}>
          {/* Full Toolbar */}
          <div className="flex flex-wrap gap-2 mb-2 border-b pb-2">
            {/* Text Formatting */}

            {/* Uppercase */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleUppercase(editor);
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Uppercase"
            >
              <Icon path={mdiFormatLetterCase} size={1} />
            </button>

            {/* Bold */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, 'bold');
                console.log('Bold toggled');
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Bold"
            >
              <Icon path={mdiFormatBold} size={1} />
            </button>

            {/* Italic */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, "italic");
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Italic"
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
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>

            {/* Underline */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, "underline");
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Underline"
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
                <path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />
              </svg>
            </button>


            {/* Add Emoji */}
            <div className="relative">
              <button
                onMouseDown={(event) => {
                  event.preventDefault();
                  setIsEmojiPickerVisible((prev) => !prev); // Toggle picker visibility
                }}
                className="p-2 hover:bg-gray-200 rounded"
                title="Add Emoji"
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>
              {isEmojiPickerVisible && (
                <div className="absolute z-50 top-full left-0 mt-2 bg-white shadow-lg rounded-md p-2">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>


            {/* Align Right */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "align-right");
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Align Right"
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
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
            </button>

            {/* Align Center */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "align-center");
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Align Center"
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
                <line x1="21" y1="10" x2="3" y2="10" />
                <line x1="17" y1="6" x2="7" y2="6" />
                <line x1="17" y1="14" x2="7" y2="14" />
                <line x1="21" y1="18" x2="3" y2="18" />
              </svg>
            </button>


            {/* Align Left */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "align-left");
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Align Left"
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
                <line x1="21" y1="10" x2="7" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="7" y2="18" />
              </svg>
            </button>

            {/* Lists */}
            {/* Bulleted List */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "bulleted-list");
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Bulleted List"
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
                <circle cx="6" cy="6" r="2" />
                <circle cx="6" cy="12" r="2" />
                <circle cx="6" cy="18" r="2" />
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Numbered List */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "numbered-list");
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Numbered List"
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
                <path d="M4 6h4M4 12h4M4 18h4" />
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
              </svg>
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
              title="Add Link"
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
                <path d="M10 13a5 5 0 0 1 7-7l1-1a7 7 0 0 0-10 10l1-1z" />
                <path d="M14 11a5 5 0 0 1-7 7l-1 1a7 7 0 0 0 10-10l-1 1z" />
              </svg>
            </button>
          </div>

          {/* Editable Content */}
          <div className="relative">
            {isPlaceholderVisible && (
              <div className="absolute top-0 left-0 text-gray-400 pointer-events-none p-[1px]">
                {PLACEHOLDER_TEXT}
              </div>
            )}
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              className="min-h-[200px] text-gray-700"
              onChange={(newValue) => {
                handleTextChange(newValue as unknown as Descendant[]); // Additional processing for text
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsPlaceholderVisible(false)}
              onBlur={() => {
                const plainText = value.map((node) => Node.string(node)).join("\n");
                setIsPlaceholderVisible(plainText.trim() === "");
              }}
            />
          </div>




          {/* Bottom Toolbar */}
          <div className="flex flex-wrap gap-2 mt-2 border-t pt-2">
            {/* Image */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                // Add functionality for inserting an image
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Insert Image"
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </button>

            {/* Microphone */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                // Add functionality for microphone input
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Record Audio"
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
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            {/* Code Block */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "code");
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Insert Code Block"
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
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>

            {/* Video */}
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                // Add functionality for inserting a video
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Insert Video"
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
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
          </div>
        </Slate>
      </div>



      {/* Character Counter */}
      <div className="flex justify-between mt-2">
        <span className="text-gray-500 text-sm">
          {getRemainingCharacters(maxCharacters, value)} characters left
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        The more detail you provide, the better we can help you find the right person.
      </p>
    </div>
  );
};
export default JobDescriptionSection;