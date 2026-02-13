"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useState, useEffect } from 'react';
import Toolbar from './Toolbar';
import PriceExtension from './extensions/PriceExtension';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function Editor({ listingId }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('active');
  const [lastSaved, setLastSaved] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '여기에 매물 정보를 자유롭게 작성하세요...\n예: 특징, 학군, 주변 시설 등',
      }),
      Image,
      PriceExtension,
    ],
    content: '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      saveListing();
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    },
  });

  const extractPrice = (html) => {
    const match = html.match(/price="([^"]*)"/);
    return match ? match[1] : '';
  };

  const saveListing = async (newTitle, newStatus) => {
    if (!listingId || !editor) return;

    const currentTitle = newTitle !== undefined ? newTitle : title;
    const currentStatus = newStatus !== undefined ? newStatus : status;

    try {
      await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTitle,
          content: editor.getHTML(),
          status: currentStatus,
          price: extractPrice(editor.getHTML())
        }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const deleteListing = async () => {
    if (!confirm('정말로 이 매물을 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  useEffect(() => {
    if (listingId && editor) {
      const fetchListing = async () => {
        try {
          const res = await fetch(`/api/listings/${listingId}`);
          if (res.ok) {
            const data = await res.json();
            setTitle(data.title);
            setStatus(data.status);
            editor.commands.setContent(data.content || '');
          }
        } catch (error) {
          console.error('Failed to load listing:', error);
        }
      };
      fetchListing();
    }
  }, [listingId, editor]);

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="flex justify-between items-center mb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              const newVal = e.target.value;
              setTitle(newVal);
              saveListing(newVal);
            }}
            className="title-input"
            placeholder="매물 제목을 입력하세요"
          />
          <button onClick={deleteListing} className="delete-btn" title="매물 삭제">
            <Trash2 size={20} />
          </button>
        </div>
        <div className="editor-meta">
          <span>{lastSaved ? `저장됨: ${lastSaved.toLocaleTimeString()}` : '저장되지 않음'}</span>
          <select
            value={status}
            onChange={(e) => {
              const newVal = e.target.value;
              setStatus(newVal);
              saveListing(undefined, newVal);
            }}
            className="status-select"
          >
            <option value="active">판매중</option>
            <option value="pending">보류중</option>
            <option value="sold">판매완료</option>
          </select>
        </div>
      </div>

      <div className="editor-content-wrapper">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      <style jsx>{`
        .editor-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 4rem;
          background: white;
          min-height: 100vh;
          box-shadow: 0 0 20px rgba(0,0,0,0.02);
        }

        .editor-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .title-input {
          font-size: 2.0rem;
          font-weight: 700;
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text-primary);
        }

        .delete-btn {
            color: #ff6b6b;
            padding: 0.5rem;
            border-radius: 4px;
        }
        
        .delete-btn:hover {
            background-color: #fff5f5;
        }

        .editor-meta {
          font-size: 0.85rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .status-select {
            padding: 2px 5px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 0.8rem;
        }

        .editor-content-wrapper {
          font-size: 1.1rem;
          line-height: 1.7;
          color: var(--text-primary);
          min-height: 500px;
        }

        /* Tiptap Styles */
        :global(.ProseMirror) {
          outline: none;
        }

        :global(.ProseMirror p.is-editor-empty:first-child::before) {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        :global(.ProseMirror h1) { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
        :global(.ProseMirror h2) { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
        :global(.ProseMirror ul) { list-style: disc; padding-left: 1.5em; margin-bottom: 1em; }
        :global(.ProseMirror ol) { list-style: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        :global(.ProseMirror blockquote) { border-left: 3px solid #dfe6e9; padding-left: 1rem; color: var(--text-secondary); }
        :global(.ProseMirror img) { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
      `}</style>
    </div>
  );
}
