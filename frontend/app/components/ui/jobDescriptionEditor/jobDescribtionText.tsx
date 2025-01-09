"use client";

import React, { useMemo, useState, useCallback } from "react";
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
import { Slate, Editable, withReact, RenderElementProps } from "slate-react";
import {
  Transforms,
  Editor,
  createEditor,
  Descendant,
  Node,
  Element as SlateElement,
  Range
} from "slate";
import { withHistory } from "slate-history";
import {
  withInlines,
  LIST_TYPES,
  withLists,
  isLinkActive,
  unwrapLink,
  type CustomElement,
  type CustomText,
  type ElementType
} from './editorSetup';
import { TopToolbar, BottomToolbar } from './toolBar';

const PLACEHOLDER_TEXT = "Describe the job you are trying to outsource";


const JobDescriptionSection = () => {
  // const editor = useMemo(() => withLists(withHistory(withReact(createEditor()))), []);
  const editor = useMemo(
    () => withInlines(withLists(withHistory(withReact(createEditor())))),
    []
  );

  const [value, setValue] = useState<Descendant[]>([
    {
      type: "paragraph" as const,
      children: [{ text: "" }],
    },
  ]);

  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);

  const maxCharacters = 1000;

  const handleTextChange = (newValue: Descendant[]) => {
    // console.log('Current editor value:', JSON.stringify(newValue, null, 2)); // Debugging log
    const plainText = newValue.map((node) => Node.string(node)).join("\n");

    // Check if the content is empty or just whitespace
    if (plainText.trim() === "") {
      setIsPlaceholderVisible(true);
      setValue([{ type: "paragraph", children: [{ text: "" }] }] as Descendant[]);
      return;
    }

    // If within character limit, update normally
    if (plainText.length <= maxCharacters) {
      setIsPlaceholderVisible(false);
      setValue(newValue);
      return;
    }

    const currentText = value.map((node) => Node.string(node)).join("\n");
    if (currentText.length >= maxCharacters) {
      return;
    }

    setValue(value);
  };


  const isBlockActive = (editor: Editor, format: ElementType) => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: selection,
        match: n =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.type === format,
      })
    );
    console.log('Active block match:', match); // Debugging log
    return !!match;
  };

  const toggleBlock = (editor: Editor, format: ElementType) => {
    const isActive = isBlockActive(editor, format);
    const isList = LIST_TYPES.includes(format as typeof LIST_TYPES[number]);


    // Unwrap existing list if needed
    Transforms.unwrapNodes(editor, {
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        LIST_TYPES.includes(n.type as typeof LIST_TYPES[number]),
      split: true,
    });

    const newProperties: Partial<CustomElement> = {
      type: isActive ? 'paragraph' : format, // Toggle between paragraph and format
    };

    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
      const block = { type: format, children: [] };
      Transforms.wrapNodes(editor, block);
    }
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
    return maxCharacters - value.reduce((acc: number, node: Node) => acc + Node.string(node).length, 0);
  };




  const toggleMark = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const isMarkActive = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };



  const toggleUppercase = (editor: Editor) => {
    const isActive = isMarkActive(editor, "uppercase");
    if (isActive) {
      Editor.removeMark(editor, "uppercase");
    } else {
      Editor.addMark(editor, "uppercase", true);
    }
  };




  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false); // Toggle Emoji Picker

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    Transforms.insertText(editor, emojiData.emoji); // Insert emoji at cursor position
    setIsEmojiPickerVisible(false); // Close picker after selection
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        insertImage(editor, base64); // Insert the base64 image into the editor
      };
      reader.readAsDataURL(file); // Convert the image to a base64 string
    }
  };


  const insertImage = (editor: Editor, src: string) => {
    const image: CustomElement = {
      type: 'image',
      src, // Base64 string or URL
      children: [{ text: '' }], // Empty children to satisfy Slate's requirements
    };
    Transforms.insertNodes(editor, image);
  };

  const insertAudio = (editor: Editor, src: string) => {
    const audio: CustomElement = {
      type: 'audio',
      src,
      children: [{ text: '' }], // Empty children for Slate compatibility
    };
    Transforms.insertNodes(editor, audio);
  };

  const handleAudioRecord = () => {
    console.log("Audio recording started"); // Debug log
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support audio recording.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          console.log("Data available:", event.data); // Debug log
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          console.log("Recording stopped"); // Debug log
          const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log("Audio URL:", audioUrl); // Debug log
          insertAudio(editor, audioUrl); // Insert the audio into the editor
        };

        mediaRecorder.start();
        console.log("MediaRecorder started"); // Debug log

        // Stop recording after 5 seconds
        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach((track) => track.stop());
        }, 5000); // 5 seconds
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error); // Debug log
      });
  };

  const insertVideo = (editor: Editor, src: string) => {
    const video: CustomElement = {
      type: 'video',
      src,
      children: [{ text: '' }], // Empty children for Slate compatibility
    };
    Transforms.insertNodes(editor, video);
  };

  const handleVideoRecord = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support video recording.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const videoChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(videoChunks, { type: 'video/mp4' });
          const videoUrl = URL.createObjectURL(videoBlob);
          insertVideo(editor, videoUrl); // Insert the video into the editor
        };

        mediaRecorder.start();

        // Stop recording after 10 seconds or based on user action
        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach((track) => track.stop());
        }, 10000); // 10 seconds
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
      });
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      insertVideo(editor, videoUrl); // Insert the video into the editor
    }
  };

  const insertLink = (editor: Editor, url: string) => {
    if (isLinkActive(editor)) {
      unwrapLink(editor);
    }

    const { selection } = editor;
    if (!selection) return;

    // Normalize the URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    const isCollapsed = Range.isCollapsed(selection);

    if (isCollapsed) {
      Transforms.insertNodes(editor, {
        type: 'link',
        href: normalizedUrl,
        children: [{ text: url }],
      });
      // Move cursor after link and insert a space
      Transforms.move(editor);
      Transforms.insertText(editor, ' ');
    } else {
      Transforms.wrapNodes(
        editor,
        { type: 'link', href: normalizedUrl, children: [] },
        { split: true }
      );
      // Move cursor after selection and insert a space
      Transforms.collapse(editor, { edge: 'end' });
      Transforms.insertText(editor, ' ');
    }
  };












  interface RenderLeafProps {
    attributes: any;
    children: any;
    leaf: {
      bold?: boolean;
      uppercase?: boolean;
      italic?: boolean;
      underline?: boolean;
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
    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }

    return <span {...props.attributes}>{children}</span>;
  }, []);


  const renderElement = useCallback((props: RenderElementProps) => {
    // console.log('Rendering element:', props.element.type); // Debugging log
    const { element, attributes, children } = props;
    const el = element as CustomElement;

    switch (el.type) {
      case 'link':
        return (
          <a
            {...attributes}
            href={el.href}
            target="_blank"
            rel="noopener noreferrer"
            contentEditable={false}
            style={{
              color: '#0000EE',
              textDecoration: 'underline',
              cursor: 'pointer',
              pointerEvents: 'all'
            }}
            onClick={(e) => {
              e.preventDefault();
              window.open(el.href, '_blank');
            }}
          >
            {children}
          </a>
        );
      case 'code-block':
        return (
          <pre {...attributes}
            style={{
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '5px',
              fontFamily: 'monospace',
            }}
          >
            <code>{children}</code>
          </pre>
        );
      case 'video':
        return (
          <div {...attributes}>
            <video controls src={el.src} style={{ maxWidth: '100%' }} />
            {children /* Keep children for Slate compatibility */}
          </div>
        );
      case 'audio':
        return (
          <div {...attributes}>
            <audio controls src={el.src} style={{ width: '100%' }} />
            {children /* Keep children for Slate compatibility */}
          </div>
        );
      case 'image':
        return (
          <div {...attributes}>
            <img src={el.src} alt="Image" style={{ maxWidth: '100%' }} />
            {children /* Keep children for Slate compatibility */}
          </div>
        );
      case 'bulleted-list':
        return <ul style={{ listStyleType: 'disc', paddingLeft: '1em' }} {...attributes}>{children}</ul>;
      case 'numbered-list':
        return <ol style={{ listStyleType: 'decimal', paddingLeft: '1em' }} {...attributes}>{children}</ol>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      case 'align-left':
        return <p style={{ textAlign: 'left' }} {...attributes}>{children}</p>;
      case 'align-center':
        return <p style={{ textAlign: 'center' }} {...attributes}>{children}</p>;
      case 'align-right':
        return <p style={{ textAlign: 'right' }} {...attributes}>{children}</p>;
      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);





  return (
    <div className="mb-6 relative">
      <label className="block text-sm font-bold text-gray-700 mb-3">
        Job description <span className="text-red-500">*</span>
      </label>
      <div className="border border-gray-300 rounded-3xl bg-white p-4 ">
        {/* <Slate editor={editor} initialValue={value} onChange={handleTextChange}>
          {/* Full Toolbar 
          <div className="flex flex-wrap gap-2 mb-2 border-b pb-2">
            {/* Text Formatting *}

            {/* Uppercase *
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
         {/* <button
            onMouseDown={(event) => {
              event.preventDefault();
              toggleMark(editor, 'bold');
            }}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bold"
          >
            <Icon path={mdiFormatBold} size={1} />
          </button>

            {/* Italic *
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

            {/* Underline *
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


            {/* Add Emoji *
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


            {/* Align Left *
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

            {/* Align Center *
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



            {/* Align Right *
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


            {/* Lists *
            {/* Bulleted List *
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

            {/* Numbered List *
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

            {/* Link *
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
          </div> */}
        <Slate editor={editor} initialValue={value} onChange={handleTextChange}>
          <TopToolbar
            editor={editor}
            isEmojiPickerVisible={isEmojiPickerVisible}
            setIsEmojiPickerVisible={setIsEmojiPickerVisible}
            handleEmojiClick={handleEmojiClick}
            isLinkActive={isLinkActive}
            toggleUppercase={toggleUppercase}
            toggleMark={toggleMark}
            toggleBlock={toggleBlock}
            unwrapLink={unwrapLink}
            insertLink={insertLink}
          />
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




          {/* Bottom Toolbar*/}
          <div className="flex flex-wrap gap-2 mt-2 border-t pt-2">
            <BottomToolbar
              editor={editor}
              isEmojiPickerVisible={isEmojiPickerVisible}
              setIsEmojiPickerVisible={setIsEmojiPickerVisible}
              handleEmojiClick={handleEmojiClick}
              isLinkActive={isLinkActive}
              toggleBlock={toggleBlock}
              handleAudioRecord={handleAudioRecord}
              handleVideoRecord={handleVideoRecord}
              handleVideoUpload={handleVideoUpload}
              handleImageUpload={handleImageUpload}
            />
            {/* Image *
            {/* Insert Image *
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                document.getElementById("image-upload-input")?.click(); // Trigger file input click
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Insert Image"
            >
              <Icon path={mdiImage} size={1} />
            </button>
            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(event) => handleImageUpload(event)}
            />


            {/* Microphone *
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


            {/* Code Block *
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


            {/* Video *
            {/* Insert Video *
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
            </div>*/}

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