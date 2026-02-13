"use client";

import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Tag, Image as ImageIcon } from 'lucide-react';

export default function Toolbar({ editor }) {
    if (!editor) {
        return null;
    }

    const uploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('이미지 업로드 실패');
        }
    };

    return (
        <div className="toolbar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                title="굵게"
            >
                <Bold size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                title="기울임"
            >
                <Italic size={18} />
            </button>
            <div className="divider"></div>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                title="제목 1"
            >
                <Heading1 size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                title="제목 2"
            >
                <Heading2 size={18} />
            </button>
            <div className="divider"></div>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
                title="글머리 기호"
            >
                <List size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
                title="번호 매기기"
            >
                <ListOrdered size={18} />
            </button>
            <div className="divider"></div>
            <button
                onClick={() => editor.chain().focus().insertContent('<price-tag price=""></price-tag>').run()}
                title="가격 태그 삽입"
            >
                <Tag size={18} />
            </button>
            <div className="divider"></div>
            <label className="image-upload-btn" title="이미지 업로드">
                <input type="file" accept="image/*" onChange={uploadImage} hidden />
                <ImageIcon size={18} />
            </label>

            <style jsx>{`
        .toolbar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background-color: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin-bottom: 1rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        button {
          padding: 0.4rem;
          border-radius: 4px;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        button:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        button.is-active {
          background-color: #e3f2fd;
          color: var(--accent-color);
        }

        .image-upload-btn {
            padding: 0.4rem;
            border-radius: 4px;
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
        }

        .image-upload-btn:hover {
            background-color: var(--bg-primary);
            color: var(--text-primary);
        }

        .divider {
          width: 1px;
          height: 20px;
          background-color: var(--border-color);
          margin: 0 0.2rem;
        }
      `}</style>
        </div>
    );
}
