"use client";

import { NodeViewWrapper } from '@tiptap/react';
import { Tag } from 'lucide-react';

export default function PriceComponent(props) {
    return (
        <NodeViewWrapper className="price-tag-component inline-flex">
            <div className="price-tag">
                <Tag size={14} />
                <span className="label">가격:</span>
                <input
                    type="text"
                    value={props.node.attrs.price}
                    onChange={(e) => props.updateAttributes({ price: e.target.value })}
                    placeholder="금액 입력"
                    className="price-input"
                />
            </div>
            <style jsx>{`
        .price-tag {
          display: inline-flex;
          align-items: center;
          background-color: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 20px;
          padding: 2px 10px;
          margin: 0 4px;
          color: #1565c0;
          font-size: 0.9em;
          gap: 6px;
          vertical-align: middle;
        }

        .label {
          font-weight: 600;
          font-size: 0.8em;
          user-select: none;
        }

        .price-input {
          border: none;
          background: transparent;
          outline: none;
          color: #1565c0;
          font-weight: 600;
          width: 80px;
          font-size: inherit;
        }

        .price-input::placeholder {
          color: #90caf9;
        }
      `}</style>
        </NodeViewWrapper>
    );
}
