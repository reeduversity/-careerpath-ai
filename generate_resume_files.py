from zipfile import ZipFile

pdf_text = """John Doe
Software Engineer

Education
Bachelor of Science in Computer Science, Example University, 2020

Skills
Python, TypeScript, Node.js, SQL, React

Experience
Software Engineer at Example Corp (2021-2024)
- Built backend services and automation tools

Projects
Resume Parser Prototype
- Created file upload and extraction pipeline

Certifications
Certified Kubernetes Administrator
"""

lines = [
    "%PDF-1.4\n",
    "1 0 obj<< /Type /Catalog /Pages 2 0 R>>\nendobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    "4 0 obj<< /Length {length} >>\nstream\n{stream}\nendstream\nendobj\n",
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica>>\nendobj\n",
]

stream_lines = ["BT", "/F1 12 Tf", "72 720 Td"]
for line in pdf_text.splitlines():
    sanitized = line.replace("(", "\\(").replace(")", "\\)")
    stream_lines.append(f"({sanitized}) Tj")
    stream_lines.append("0 -16 Td")
stream = "\n".join(stream_lines)
content = lines[4].format(length=len(stream), stream=stream)
pdf_data = "".join(lines[:4]) + content
xref_pos = len(pdf_data.encode("latin1"))
pdf_data += (
    f"xref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000110 00000 n \n"
    f"0000000200 00000 n \n0000000300 00000 n \ntrailer<< /Size 6 /Root 1 0 R>>\nstartxref\n{xref_pos}\n%%EOF\n"
)
with open("sample_resume.pdf", "wb") as f:
    f.write(pdf_data.encode("latin1"))

word_xml = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n'
    '  <w:body>\n'
    + "".join(
        f'    <w:p><w:r><w:t>{line}</w:t></w:r></w:p>\n' for line in pdf_text.splitlines()
    )
    + '  </w:body>\n'
    + '</w:document>\n'
)
with ZipFile("sample_resume.docx", "w") as zf:
    zf.writestr(
        "[Content_Types].xml",
        """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
""",
    )
    zf.writestr(
        "_rels/.rels",
        """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
""",
    )
    zf.writestr("word/document.xml", word_xml)

print("created sample_resume.pdf and sample_resume.docx")
