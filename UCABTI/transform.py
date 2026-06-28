import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))

REPLACEMENTS = [
    # DOCTYPE
    (r'<!DOCTYPE[^>]*>', '<!DOCTYPE html>'),
]

def safe_read(path):
    for enc in ('utf-8', 'latin-1'):
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read(), enc
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Cannot decode {path}")

def safe_write(path, content, encoding):
    with open(path, 'w', encoding=encoding) as f:
        f.write(content)

def add_viewport(content):
    if 'viewport' not in content:
        content = content.replace(
            '<head>',
            '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1">'
        )
    return content

def replace_stylesheet(content):
    return content.replace('styles/site.css', 'styles/ucabti.css')

def remove_google_translate_meta(content):
    return re.sub(
        r'<meta[^>]*google-translate-customization[^>]*>',
        '',
        content
    )

def remove_google_translate_widget(content):
    return re.sub(
        r'<div id="google_translate_element"></div>'
        r'<script[^>]*>.*?'
        r'function\s+googleTranslateElementInit\s*\([^)]*\)\s*\{.*?\}'
        r'\s*</script>'
        r'<script[^>]*src="//translate\.google\.com/translate_a/element\.js[^>]*>'
        r'\s*</script>',
        '',
        content,
        flags=re.DOTALL | re.IGNORECASE
    )

def remove_deprecated_attrs(content):
    for attr in ('bgcolor', 'cellpadding', 'cellspacing', 'valign', 'border'):
        content = re.sub(r'\s+' + attr + r'="[^"]*"', '', content)
        content = re.sub(r"\s+" + attr + r"='[^']*'", '', content)
    return content

def remove_font_tags(content):
    content = re.sub(r'<font[^>]*>', '', content)
    content = re.sub(r'</font>', '', content)
    return content

def remove_broken_background_urls(content):
    return re.sub(
        r'background="http://www\.suigeneris\.org:8280/[^"]*"',
        '',
        content
    )

def remove_confluence_footer(content):
    return re.sub(
        r'<table\s+border="0"[^>]*>\s*'
        r'<tr>\s*<td\s+height="12"[^>]*>.*?</tr>\s*'
        r'<tr>\s*<td\s+align="center">.*?'
        r'Document\s+generated\s+by\s+Confluence.*?'
        r'</td>\s*</tr>\s*</table>',
        '',
        content,
        flags=re.DOTALL | re.IGNORECASE
    )

def remove_forced_newline(content):
    return re.sub(
        r'<br[^>]*class="atl-forced-newline"[^>]*>',
        '',
        content,
        flags=re.IGNORECASE
    )

def strip_trailing_blank_lines(content):
    content = re.sub(r'\n\s*\n(\s*</body>)', r'\n\1', content)
    return content

def transform(content):
    content = re.sub(r'<!DOCTYPE[^>]*>', '<!DOCTYPE html>', content)
    content = add_viewport(content)
    content = replace_stylesheet(content)
    content = remove_google_translate_meta(content)
    content = remove_google_translate_widget(content)
    content = remove_deprecated_attrs(content)
    content = remove_font_tags(content)
    content = remove_broken_background_urls(content)
    content = remove_confluence_footer(content)
    content = remove_forced_newline(content)
    content = strip_trailing_blank_lines(content)
    return content

def main():
    count = 0
    for root, dirs, files in os.walk(BASE):
        for fname in files:
            if not fname.endswith('.html'):
                continue
            path = os.path.join(root, fname)
            try:
                content, enc = safe_read(path)
            except ValueError as e:
                print(f"SKIP  {path}: {e}")
                continue

            original = content
            content = transform(content)

            if content != original:
                safe_write(path, content, enc)
                count += 1
                print(f"FIXED {path}")
            else:
                print(f"OK    {path}")

    print(f"\nTransformed {count} files")

if __name__ == '__main__':
    main()
