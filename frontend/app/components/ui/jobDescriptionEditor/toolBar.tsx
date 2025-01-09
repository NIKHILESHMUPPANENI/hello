"use client";

import React from 'react';
import Icon from '@mdi/react';
import {
    mdiFormatLetterCase,
    mdiFormatBold,
    mdiFormatItalic,
    mdiFormatUnderline,
    mdiFormatAlignRight,
    mdiFormatAlignCenter,
    mdiFormatAlignLeft,
    mdiFormatListBulleted,
    mdiFormatListNumbered,
    mdiImage,
    mdiMicrophone,
    mdiVideo,
    mdiUpload,
    mdiCodeBraces as mdiCodeBlock,
    mdiLink
} from '@mdi/js';
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { ReactEditor } from 'slate-react';
// import { handleAudioRecord, handleVideoRecord, handleVideoUpload } from './mediaHandlers';
import {
    Editor,
    BaseEditor,
    Element as SlateElement
  } from "slate";
import {
    type CustomText,
    type ElementType,
    isLinkActive,
    unwrapLink,
  } from './editorSetup';

  interface BaseToolbarProps {
    editor: BaseEditor & ReactEditor;
    isEmojiPickerVisible: boolean;
    setIsEmojiPickerVisible: React.Dispatch<React.SetStateAction<boolean>>;
    handleEmojiClick: (emojiData: EmojiClickData) => void;
    isLinkActive: (editor: BaseEditor & ReactEditor) => boolean;
  }

interface EditorButtonProps {
    onMouseDown: (event: React.MouseEvent) => void;
    title: string;
    icon: string;
    className?: string;
}



const EditorButton: React.FC<EditorButtonProps> = ({ onMouseDown, title, icon, className = "" }) => (
    <button
        onMouseDown={onMouseDown}
        className={`p-2 hover:bg-gray-200 rounded ${className}`}
        title={title}
    >
        <Icon path={icon} size={1} />
    </button>
);

interface TopToolbarProps extends BaseToolbarProps {
  toggleUppercase: (editor: BaseEditor & ReactEditor) => void;
  toggleMark: (editor: BaseEditor & ReactEditor, format: keyof Omit<CustomText, 'text'>) => void;
  toggleBlock: (editor: BaseEditor & ReactEditor, format: ElementType) => void;
  unwrapLink: (editor: BaseEditor & ReactEditor) => void;
  insertLink: (editor: BaseEditor & ReactEditor, url: string) => void;
}

interface BottomToolbarProps extends BaseToolbarProps {
    toggleBlock: (editor: BaseEditor & ReactEditor, format: ElementType) => void;
    handleAudioRecord: () => void;
    handleVideoRecord: () => void;
    handleVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }

const TopToolbar: React.FC<TopToolbarProps> = ({
    editor,
    isEmojiPickerVisible,
    setIsEmojiPickerVisible,
    handleEmojiClick,
    isLinkActive,
    toggleUppercase,
    toggleMark,
    toggleBlock,
    unwrapLink,
    insertLink,
}) => (
    <div className="flex flex-wrap gap-2 mb-2 border-b pb-2">
        <EditorButton
            onMouseDown={(e) => {
                e.preventDefault();
                toggleUppercase(editor);
            }}
            title="Uppercase"
            icon={mdiFormatLetterCase}
        />
        {/* Bold */}
        <button
            onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, 'bold');
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
            <Icon path={mdiFormatItalic} size={1} />
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
            <Icon path={mdiFormatUnderline} size={1} />
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


        {/* Align Left */}
        <button
            onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "align-left");
            }}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Left"
        >
            <Icon path={mdiFormatAlignLeft} size={1} />
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
            <Icon path={mdiFormatAlignCenter} size={1} />
        </button>



        {/* Align Right */}
        <button
            onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "align-right");
            }}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Right"
        >
            <Icon path={mdiFormatAlignRight} size={1} />
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
            <Icon path={mdiFormatListBulleted} size={1} />
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
            <Icon path={mdiFormatListNumbered} size={1} />
        </button>

        {/* Link */}
        <button
            onMouseDown={(event) => {
                event.preventDefault();
                if (isLinkActive(editor)) {
                    unwrapLink(editor);
                } else {
                    const url = window.prompt('Enter the URL:');
                    if (!url) return;
                    insertLink(editor, url);
                }
            }}
            className={`p-2 hover:bg-gray-200 rounded ${isLinkActive(editor) ? 'bg-gray-200' : ''}`}
            title="Add Link"
        >
            <Icon path={mdiLink} size={1} />
        </button>

    </div>
);

const BottomToolbar: React.FC<BottomToolbarProps> = ({
    editor,
    toggleBlock,
    handleAudioRecord,
    handleVideoRecord,
    handleVideoUpload,
}) => (
    <div className="flex flex-wrap gap-2 mt-2 border-t pt-2">
        <EditorButton
            onMouseDown={(e) => {
                e.preventDefault();
                document.getElementById("image-upload-input")?.click();
            }}
            title="Insert Image"
            icon={mdiImage}
        />
        {/* Microphone */}
        <button
            onMouseDown={(event) => {
                event.preventDefault();
                handleAudioRecord(); // Start audio recording
            }}
            className="p-2 hover:bg-gray-200 rounded"
            title="Record Audio"
        >
            <Icon path={mdiMicrophone} size={1} />
        </button>


        {/* Code Block */}
        <button
            onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, "code-block"); // Use "code-block" type
            }}
            className="p-2 hover:bg-gray-200 rounded"
            title="Insert Code Block"
        >
            <Icon path={mdiCodeBlock} size={1} />
        </button>


        {/* Video */}
        {/* Insert Video */}
        <div>
            <button
                onMouseDown={(event) => {
                    event.preventDefault();
                    handleVideoRecord(); // Start video recording
                }}
                className="p-2 hover:bg-gray-200 rounded"
                title="Record Video"
            >
                <Icon path={mdiVideo} size={1} />
            </button>
            <input
                id="video-upload-input"
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={(event) => handleVideoUpload(event)}
            />
            <button
                onMouseDown={(event) => {
                    event.preventDefault();
                    document.getElementById('video-upload-input')?.click(); // Trigger file input
                }}
                className="p-2 hover:bg-gray-200 rounded"
                title="Upload Video"
            >
                <Icon path={mdiUpload} size={1} />
            </button>
        </div>
    </div>
);


export {
    EditorButton,
    TopToolbar,
    BottomToolbar,
    type TopToolbarProps,
    type BottomToolbarProps
};