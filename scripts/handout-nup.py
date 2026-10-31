#!/usr/bin/env python3
"""Turn a one-slide-per-page PDF (DeckTape's export) into an A4 handout:
N slides to a page, each framed with its number beneath, and the page
number at the foot, as the export page's handout (inc/export.js) and
PowerPoint's handout print lay them out. The slides stay vector.

usage: handout-nup.py slides.pdf slides-handout.pdf [1|2|3|6]   (default 2)

Used by .github/workflows/slides-pdf.yml; needs pypdf and reportlab."""
import io
import sys

from pypdf import PageObject, PdfReader, PdfWriter, Transformation
from reportlab.pdfgen import canvas

MM = 72 / 25.4


def plan(n, ratio):
    """Slide boxes on one sheet, in mm from the top left (as sheetPlan in
    inc/export.js, without lines)."""
    landscape = n == 1
    pw, ph = (297, 210) if landscape else (210, 297)
    left, top, bottom, num = 14, 14, 20, 6
    aw, ah = pw - 2 * left, ph - top - bottom
    cells = []
    if n == 6:
        col_w, row_h = (aw - 8) / 2, (ah - 16) / 3
        h = col_w * ratio
        for r in range(3):
            for k in range(2):
                cells.append((left + k * (col_w + 8), top + r * (row_h + 8) + (row_h - h - num) / 2, col_w, h))
    else:
        rows, gap = {1: (1, 0), 2: (2, 10), 3: (3, 8)}[n]
        row_h = (ah - (rows - 1) * gap) / rows
        h = min(aw * ratio, row_h - num)
        w = h / ratio
        for r in range(rows):
            cells.append((left + (aw - w) / 2, top + r * (row_h + gap) + (row_h - h - num) / 2, w, h))
    return pw, ph, left, bottom, cells


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    per = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    if per not in (1, 2, 3, 6):
        sys.exit('slides per page: 1, 2, 3 or 6')
    pages = PdfReader(src).pages
    if not len(pages):
        sys.exit('no pages in ' + src)
    first = pages[0].mediabox
    ratio = float(first.height) / float(first.width)
    pw, ph, left, bottom, cells = plan(per, ratio)
    W, H = pw * MM, ph * MM
    out = PdfWriter()
    for start in range(0, len(pages), per):
        sheet = PageObject.create_blank_page(width=W, height=H)
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=(W, H))
        c.setLineWidth(0.25 * MM)
        c.setFont('Helvetica', 8.5)
        for k, pg in enumerate(pages[start:start + per]):
            x, y, w, h = cells[k]
            sw, sh = float(pg.mediabox.width), float(pg.mediabox.height)
            s = w * MM / sw
            px, py = x * MM, H - (y + h) * MM          # PDF origin: bottom left
            sheet.merge_transformed_page(pg, Transformation().translate(-float(pg.mediabox.left), -float(pg.mediabox.bottom)).scale(s).translate(px, py))
            c.rect(px, py, w * MM, h * MM)
            c.drawString(px, py - 4.2 * MM, str(start + k + 1))
        c.drawRightString(W - left * MM, (bottom / 2 - 2) * MM, str(start // per + 1))
        c.save()
        buf.seek(0)
        sheet.merge_page(PdfReader(buf).pages[0])
        out.add_page(sheet)
    out.write(dst)
    print(len(pages), 'slides ->', len(out.pages), 'pages')


if __name__ == '__main__':
    main()
