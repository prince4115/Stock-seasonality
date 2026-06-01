"""
Post-process pandoc-generated paper.docx:
  1. Set body font to Times New Roman 11pt (via docDefaults).
  2. Add a footer with page number.

Run from stock-seasonality/. Reads docs/paper-unpacked/, writes
docs/paper.docx.
"""

from __future__ import annotations

import os
import re
import shutil
import zipfile

UNPACKED = "docs/paper-unpacked"
OUT_DOCX = "docs/paper.docx"

# --------------------------------------------------------------------------
# 1. styles.xml — body font + size
# --------------------------------------------------------------------------
styles_path = os.path.join(UNPACKED, "word", "styles.xml")
with open(styles_path, encoding="utf-8") as f:
    styles = f.read()

# Replace the theme-font reference in docDefaults with explicit Times New Roman.
styles = re.sub(
    r'<w:rFonts w:asciiTheme="minorHAnsi"[^/]*/>',
    '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" '
    'w:cs="Times New Roman" w:eastAsia="Times New Roman"/>',
    styles,
    count=1,
)
# Change default body size from 12pt (24 half-points) to 11pt (22).
styles = re.sub(r'<w:sz w:val="24" ?/>', '<w:sz w:val="22"/>', styles, count=1)
styles = re.sub(r'<w:szCs w:val="24" ?/>', '<w:szCs w:val="22"/>', styles, count=1)
with open(styles_path, "w", encoding="utf-8") as f:
    f.write(styles)
print("✓ styles.xml: body set to Times New Roman 11pt")

# --------------------------------------------------------------------------
# 2. Create word/footer1.xml with centered "Page X" field
# --------------------------------------------------------------------------
footer_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="20"/>
      </w:rPr>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="20"/>
      </w:rPr>
      <w:fldChar w:fldCharType="begin"/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="20"/>
      </w:rPr>
      <w:instrText xml:space="preserve"> PAGE </w:instrText>
    </w:r>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="20"/>
      </w:rPr>
      <w:fldChar w:fldCharType="end"/>
    </w:r>
  </w:p>
</w:ftr>
"""
with open(os.path.join(UNPACKED, "word", "footer1.xml"), "w", encoding="utf-8") as f:
    f.write(footer_xml)
print("✓ word/footer1.xml: created")

# --------------------------------------------------------------------------
# 3. Add the footer relationship in word/_rels/document.xml.rels
# --------------------------------------------------------------------------
rels_path = os.path.join(UNPACKED, "word", "_rels", "document.xml.rels")
with open(rels_path, encoding="utf-8") as f:
    rels = f.read()

# Pick a relationship ID not currently in use.
used_ids = set(re.findall(r'Id="(rId\d+)"', rels))
next_id = 1
while f"rId{next_id}" in used_ids:
    next_id += 1
new_rel_id = f"rId{next_id}"

footer_rel = (
    f'<Relationship Id="{new_rel_id}" '
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" '
    'Target="footer1.xml"/>'
)
rels = rels.replace("</Relationships>", footer_rel + "</Relationships>")
with open(rels_path, "w", encoding="utf-8") as f:
    f.write(rels)
print(f"✓ document.xml.rels: footer relationship added as {new_rel_id}")

# --------------------------------------------------------------------------
# 4. Register the footer override in [Content_Types].xml
# --------------------------------------------------------------------------
ct_path = os.path.join(UNPACKED, "[Content_Types].xml")
with open(ct_path, encoding="utf-8") as f:
    ct = f.read()
footer_ct = (
    '<Override PartName="/word/footer1.xml" '
    'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
)
if footer_ct not in ct:
    ct = ct.replace("</Types>", footer_ct + "</Types>")
    with open(ct_path, "w", encoding="utf-8") as f:
        f.write(ct)
    print("✓ [Content_Types].xml: footer override registered")

# --------------------------------------------------------------------------
# 5. Reference the footer inside document.xml's sectPr
# --------------------------------------------------------------------------
doc_path = os.path.join(UNPACKED, "word", "document.xml")
with open(doc_path, encoding="utf-8") as f:
    doc = f.read()
footer_ref = f'<w:footerReference w:type="default" r:id="{new_rel_id}"/>'
if footer_ref not in doc:
    # Insert right after the opening <w:sectPr> tag.
    doc = doc.replace("<w:sectPr>", "<w:sectPr>" + footer_ref, 1)
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(doc)
    print("✓ document.xml: footer referenced inside sectPr")

# --------------------------------------------------------------------------
# 6. Repack as a new docx (overwrite the original)
# --------------------------------------------------------------------------
if os.path.exists(OUT_DOCX):
    os.remove(OUT_DOCX)

with zipfile.ZipFile(OUT_DOCX, "w", zipfile.ZIP_DEFLATED) as out:
    for root, _, files in os.walk(UNPACKED):
        for filename in files:
            abspath = os.path.join(root, filename)
            arcname = os.path.relpath(abspath, UNPACKED).replace(os.sep, "/")
            out.write(abspath, arcname)
print(f"✓ repacked to {OUT_DOCX} ({os.path.getsize(OUT_DOCX):,} bytes)")
