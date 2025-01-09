"use client";

import {
  Editor,
  Transforms,
  Element as SlateElement,
  Range,
  Point,
  Node,
  BaseEditor
} from "slate";
import { ReactEditor } from "slate-react";

// Define types
type ElementType =
  | 'paragraph'
  | 'bulleted-list'
  | 'numbered-list'
  | 'list-item'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'image'
  | 'audio'
  | 'video'
  | 'code-block'
  | 'link';

interface CustomText {
  text: string;
  bold?: boolean;
  uppercase?: boolean;
  italic?: boolean;
  underline?: boolean;
}

interface CustomElement {
  type: ElementType;
  children: CustomText[];
  href?: string;
  align?: 'left' | 'center' | 'right';
  src?: string;
}

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const LIST_TYPES = ['numbered-list', 'bulleted-list'] as const;

const withInlines = (editor: Editor) => {
  const { isInline, isVoid, insertBreak } = editor;

  editor.isInline = element =>
    element.type === 'link' ? true : isInline(element);

  editor.isVoid = element =>
    ['image', 'video', 'audio'].includes(element.type) || isVoid(element);

  editor.insertBreak = () => {
    const { selection } = editor;
    if (selection && isLinkActive(editor)) {
      // Insert break after link
      Transforms.move(editor);
    }
    insertBreak();
  };

  return editor;
};

const withLists = (editor: Editor) => {
  const { deleteBackward, insertBreak, normalizeNode } = editor;

  editor.normalizeNode = ([node, path]) => {
    if (SlateElement.isElement(node) && LIST_TYPES.includes(node.type as typeof LIST_TYPES[number])) {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (SlateElement.isElement(child) && child.type !== 'list-item') {
          Transforms.setNodes(editor, { type: 'list-item' }, { at: childPath });
          return;
        }
      }
    }
    normalizeNode([node, path]);
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.type === 'list-item',
      });

      if (match) {
        const [, path] = match;
        const start = Editor.start(editor, path);

        if (Point.equals(selection.anchor, start)) {
          const newProperties: Partial<CustomElement> = { type: 'paragraph' };
          Transforms.setNodes(editor, newProperties);

          // Unwrap the list if this is the last item
          const [parent] = Editor.parent(editor, path);
          if (SlateElement.isElement(parent) && parent.children.length === 1) {
            Transforms.unwrapNodes(editor, {
              match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                LIST_TYPES.includes(n.type as typeof LIST_TYPES[number]),
            });
          }
          return;
        }
      }
    }

    deleteBackward(...args);
  };

  editor.insertBreak = () => {
    const { selection } = editor;

    if (selection) {
      const [list] = Editor.nodes(editor, {
        match: n =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.type === 'list-item',
      });

      if (list) {
        const [node] = list;
        if (Node.string(node).length === 0) {
          Transforms.unwrapNodes(editor, {
            match: n =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              LIST_TYPES.includes(n.type as typeof LIST_TYPES[number]),
            split: true,
          });
          const newProperties: Partial<CustomElement> = { type: 'paragraph' };
          Transforms.setNodes(editor, newProperties);
          return;
        }

        // Insert new list item
        const listItem: CustomElement = {
          type: 'list-item',
          children: [{ text: '' }]
        };

        Transforms.insertNodes(editor, listItem);
        return;
      }
    }

    insertBreak();
  };

  return editor;
};

const isLinkActive = (editor: Editor) => {
  const [link] = Editor.nodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      n.type === 'link',
  });
  return !!link;
};

const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
    split: true,
  });
};


export {
    withInlines,
    LIST_TYPES,
    withLists,
    isLinkActive,
    unwrapLink,
    type CustomElement,
    type CustomText,
    type ElementType
  };