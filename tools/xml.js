'use strict';

/**
 * Minimal XML parser sufficient for the kobool string resources.
 * Handles: elements, attributes, CDATA, comments, self-closing tags,
 * XML declaration, and entity decoding. No DTD/namespace support.
 */

const ENTITIES = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00a0'
};

function decodeEntities(text) {
    return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
        if (body[0] === '#') {
            const isHex = body[1] === 'x' || body[1] === 'X';
            const code = parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        return Object.prototype.hasOwnProperty.call(ENTITIES, body) ? ENTITIES[body] : match;
    });
}

function parseXml(source) {
    let pos = 0;
    const len = source.length;

    function error(message) {
        const line = source.slice(0, pos).split('\n').length;
        throw new Error(`XML parse error at line ${line}: ${message}`);
    }

    function skipMisc() {
        for (;;) {
            while (pos < len && /\s/.test(source[pos])) pos++;
            if (source.startsWith('<?', pos)) {
                const end = source.indexOf('?>', pos);
                if (end === -1) error('unterminated processing instruction');
                pos = end + 2;
            } else if (source.startsWith('<!--', pos)) {
                const end = source.indexOf('-->', pos);
                if (end === -1) error('unterminated comment');
                pos = end + 3;
            } else if (source.startsWith('<!DOCTYPE', pos) || source.startsWith('<!doctype', pos)) {
                const end = source.indexOf('>', pos);
                if (end === -1) error('unterminated doctype');
                pos = end + 1;
            } else {
                return;
            }
        }
    }

    function parseName() {
        const start = pos;
        while (pos < len && /[^\s/>=]/.test(source[pos])) pos++;
        if (start === pos) error('expected a name');
        return source.slice(start, pos);
    }

    function parseAttributes() {
        const attrs = {};
        for (;;) {
            while (pos < len && /\s/.test(source[pos])) pos++;
            if (pos >= len) error('unterminated tag');
            if (source[pos] === '>' || source.startsWith('/>', pos)) return attrs;
            const name = parseName();
            while (pos < len && /\s/.test(source[pos])) pos++;
            if (source[pos] !== '=') error(`attribute "${name}" is missing a value`);
            pos++;
            while (pos < len && /\s/.test(source[pos])) pos++;
            const quote = source[pos];
            if (quote !== '"' && quote !== "'") error(`attribute "${name}" value must be quoted`);
            pos++;
            const start = pos;
            while (pos < len && source[pos] !== quote) pos++;
            if (pos >= len) error(`unterminated value for attribute "${name}"`);
            attrs[name] = decodeEntities(source.slice(start, pos));
            pos++;
        }
    }

    function parseElement() {
        if (source[pos] !== '<') error('expected "<"');
        pos++;
        const name = parseName();
        const attrs = parseAttributes();

        if (source.startsWith('/>', pos)) {
            pos += 2;
            return { name, attrs, children: [], text: '' };
        }
        if (source[pos] !== '>') error(`malformed start tag <${name}>`);
        pos++;

        const node = { name, attrs, children: [], text: '' };
        let text = '';

        for (;;) {
            if (pos >= len) error(`unclosed element <${name}>`);

            if (source.startsWith('<![CDATA[', pos)) {
                const end = source.indexOf(']]>', pos);
                if (end === -1) error('unterminated CDATA section');
                text += source.slice(pos + 9, end);
                pos = end + 3;
            } else if (source.startsWith('<!--', pos)) {
                const end = source.indexOf('-->', pos);
                if (end === -1) error('unterminated comment');
                pos = end + 3;
            } else if (source.startsWith('</', pos)) {
                pos += 2;
                const closeName = parseName();
                while (pos < len && /\s/.test(source[pos])) pos++;
                if (source[pos] !== '>') error(`malformed end tag </${closeName}>`);
                pos++;
                if (closeName !== name) error(`mismatched tag: <${name}> closed by </${closeName}>`);
                node.text = text;
                return node;
            } else if (source[pos] === '<') {
                node.children.push(parseElement());
            } else {
                const start = pos;
                while (pos < len && source[pos] !== '<') pos++;
                text += decodeEntities(source.slice(start, pos));
            }
        }
    }

    skipMisc();
    if (pos >= len) error('empty document');
    const root = parseElement();
    skipMisc();
    if (pos < len) error('unexpected content after root element');
    return root;
}

/**
 * Convert a parsed XML tree into a plain object.
 * Leaf elements become strings; elements with children become objects.
 * Repeated sibling names become arrays.
 *
 * When `preserveAttrs` is set, a leaf that carries attributes becomes
 * `{ $attrs: {...}, $text: "..." }` instead of a bare string.
 */
function toObject(node, preserveAttrs) {
    const hasAttrs = node.attrs && Object.keys(node.attrs).length > 0;

    if (node.children.length === 0) {
        if (preserveAttrs && hasAttrs) {
            return { $attrs: node.attrs, $text: node.text };
        }
        return node.text;
    }
    const out = {};
    if (preserveAttrs && hasAttrs) {
        out.$attrs = node.attrs;
    }
    for (const child of node.children) {
        const value = toObject(child, preserveAttrs);
        if (Object.prototype.hasOwnProperty.call(out, child.name)) {
            if (!Array.isArray(out[child.name])) {
                out[child.name] = [out[child.name]];
            }
            out[child.name].push(value);
        } else {
            out[child.name] = value;
        }
    }
    return out;
}

function parseXmlToObject(source, options) {
    const root = parseXml(source);
    return toObject(root, options && options.preserveAttrs);
}

module.exports = { parseXml, parseXmlToObject, toObject, decodeEntities };
