import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PriceComponent from './PriceComponent';

export default Node.create({
    name: 'priceTag',

    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            price: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'price-tag',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['price-tag', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PriceComponent);
    },
});
