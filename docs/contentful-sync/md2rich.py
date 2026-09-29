"""Markdown (small subset) -> Contentful rich-text JSON, per the content map's conventions.

Subset: `## h2`, `### h3`, paragraphs, `- ` / `1. ` lists (4-space nesting), ``` fences
(lang -> `// @lang <lang>` directive line), `> ` blockquotes, `|` tables, `---` hr.
Inline: `code` (single or double backticks), **bold**, _italic_ / *italic*, [text](href).
"""
import re
import sys
import json


def text_node(value, marks=()):
    return {
        'nodeType': 'text',
        'value': value,
        'marks': [{'type': mark} for mark in marks],
        'data': {}
    }


def block(node_type, content, data=None):
    return {'nodeType': node_type, 'data': data or {}, 'content': content}


INLINE_RE = re.compile(
    r'(?P<code>``.+?``|`[^`]+`)'
    r'|(?P<bold>\*\*(?P<bold_text>.+?)\*\*)'
    r'|(?P<link>\[(?P<link_text>[^\]]+)\]\((?P<href>[^)]+)\))'
    r'|(?P<italic>(?<![A-Za-z0-9`])[_*](?P<italic_text>[^_*`]+?)[_*](?![A-Za-z0-9]))'
)


def parse_inline(source, marks=()):
    nodes = []
    cursor = 0
    for match in INLINE_RE.finditer(source):
        if match.start() > cursor:
            nodes.append(text_node(source[cursor:match.start()], marks))
        if match.group('code'):
            raw = match.group('code')
            code_text = raw[2:-2].strip() if raw.startswith('``') else raw[1:-1]
            nodes.append(text_node(code_text, (*marks, 'code')))
        elif match.group('bold'):
            nodes.extend(parse_inline(match.group('bold_text'), (*marks, 'bold')))
        elif match.group('link'):
            nodes.append(block(
                'hyperlink',
                parse_inline(match.group('link_text'), marks),
                {'uri': match.group('href')}
            ))
        elif match.group('italic'):
            nodes.extend(parse_inline(match.group('italic_text'), (*marks, 'italic')))
        cursor = match.end()
    if cursor < len(source):
        nodes.append(text_node(source[cursor:], marks))
    return nodes or [text_node('', marks)]


def paragraph(source):
    return block('paragraph', parse_inline(source))


# The README is authored at prettier's 4-space indent; the docs' code panels are
# ~680px wide, so samples ship at 2 spaces to fit more before scrolling.
SOURCE_INDENT = 4
DOCS_INDENT = 2


def reindent(code):
    lines = []
    for line in code.split('\n'):
        stripped = line.lstrip(' ')
        # Whole indent levels scale; any remainder (e.g. the single space
        # aligning ` *` block-comment lines) is kept as-is.
        levels, remainder = divmod(len(line) - len(stripped), SOURCE_INDENT)
        lines.append(' ' * (levels * DOCS_INDENT + remainder) + stripped)
    return '\n'.join(lines)


def code_paragraph(code, lang):
    directive = f'// @lang {lang}\n' if lang else ''
    return block('paragraph', [text_node(directive + reindent(code), ('code',))])


LIST_RE = re.compile(r'^(?P<indent> *)(?P<marker>-|\d+\.) (?P<text>.*)$')


def parse_list(lines, start):
    """Parse a (possibly nested) list beginning at lines[start]; returns (node, next_index)."""
    first = LIST_RE.match(lines[start])
    base_indent = len(first.group('indent'))
    ordered = first.group('marker') != '-'
    items = []
    index = start
    while index < len(lines):
        match = LIST_RE.match(lines[index])
        if not match or len(match.group('indent')) < base_indent:
            break
        if len(match.group('indent')) > base_indent:
            nested, index = parse_list(lines, index)
            items[-1]['content'].append(nested)
            continue
        if (match.group('marker') != '-') != ordered:
            break
        item_text = match.group('text')
        index += 1
        # Continuation lines (indented, non-list, non-blank) fold into the item paragraph.
        while index < len(lines) and lines[index].strip() and not LIST_RE.match(lines[index]) \
                and len(lines[index]) - len(lines[index].lstrip(' ')) > base_indent:
            item_text += ' ' + lines[index].strip()
            index += 1
        items.append(block('list-item', [paragraph(item_text)]))
        # A blank line followed by a deeper list still belongs to this item.
        if index < len(lines) and not lines[index].strip() and index + 1 < len(lines):
            nxt = LIST_RE.match(lines[index + 1])
            if nxt and len(nxt.group('indent')) > base_indent:
                index += 1
    return block('ordered-list' if ordered else 'unordered-list', items), index


def parse_table(lines, start):
    rows = []
    index = start
    while index < len(lines) and lines[index].lstrip().startswith('|'):
        row = lines[index].strip()
        if re.fullmatch(r'\|(?:\s*:?-+:?\s*\|)+', row):
            index += 1
            continue
        cells = [cell.strip().replace('\x00', '|') for cell in row.strip('|').replace('\\|', '\x00').split('|')]
        rows.append(cells)
        index += 1
    header, *body = rows
    table_rows = [block('table-row', [
        block('table-header-cell', [paragraph(cell)]) for cell in header])]
    for cells in body:
        table_rows.append(block('table-row', [
            block('table-cell', [paragraph(cell)]) for cell in cells]))
    return block('table', table_rows), index


def convert(markdown):
    lines = markdown.split('\n')
    content = []
    index = 0
    while index < len(lines):
        line = lines[index]
        stripped = line.strip()
        if not stripped:
            index += 1
        elif stripped.startswith('```'):
            lang = stripped[3:].strip() or None
            index += 1
            code_lines = []
            while index < len(lines) and not lines[index].strip().startswith('```'):
                code_lines.append(lines[index])
                index += 1
            index += 1
            content.append(code_paragraph('\n'.join(code_lines), lang))
        elif stripped.startswith('## '):
            content.append(block('heading-2', [text_node(stripped[3:])]))
            index += 1
        elif stripped.startswith('### '):
            content.append(block('heading-3', parse_inline(stripped[4:])))
            index += 1
        elif stripped == '---':
            content.append(block('hr', []))
            index += 1
        elif stripped.startswith('> '):
            quote_lines = []
            while index < len(lines) and lines[index].strip().startswith('>'):
                quote_lines.append(lines[index].strip()[1:].strip())
                index += 1
            paragraphs = [chunk for chunk in '\n'.join(quote_lines).split('\n\n') if chunk.strip()]
            content.append(block('blockquote', [paragraph(' '.join(chunk.split('\n'))) for chunk in paragraphs]))
        elif stripped.startswith('|'):
            node, index = parse_table(lines, index)
            content.append(node)
        elif LIST_RE.match(line):
            node, index = parse_list(lines, index)
            content.append(node)
        else:
            para_lines = []
            while index < len(lines) and lines[index].strip() and not re.match(
                    r'^(\s*(```|## |### |> |\||---$)|\s*(-|\d+\.) )', lines[index]):
                para_lines.append(lines[index].strip())
                index += 1
            content.append(paragraph(' '.join(para_lines)))
    return block('document', content)


FRONT_RE = re.compile(r'^---\n(.*?)\n---\n', re.S)


def load_topic(path):
    source = open(path, encoding='utf-8').read()
    front = FRONT_RE.match(source)
    meta = dict(line.split(': ', 1) for line in front.group(1).split('\n'))
    return meta, convert(source[front.end():])


if __name__ == '__main__':
    meta, doc = load_topic(sys.argv[1])
    print(json.dumps({'meta': meta, 'document': doc}, indent=1))
