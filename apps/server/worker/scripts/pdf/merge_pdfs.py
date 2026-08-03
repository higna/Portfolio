"""Merge all PDFs in <input_dir> into a single file saved at <output_path>."""
import sys, os, logging
from PyPDF2 import PdfMerger

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("merge_pdfs")

def main():
    if len(sys.argv) < 3:
        logger.error("Missing arguments: input_dir output_path")
        sys.exit(1)

    input_dir = sys.argv[1]
    output_path = sys.argv[2]
    pdf_files = sorted([f for f in os.listdir(input_dir) if f.lower().endswith('.pdf')])

    if not pdf_files:
        logger.error("No PDF files found")
        sys.exit(1)

    logger.info(f"Merging {len(pdf_files)} files…")
    merger = PdfMerger()
    for f in pdf_files:
        merger.append(os.path.join(input_dir, f))
        logger.info(f"Appended: {f}")

    merger.write(output_path)
    merger.close()
    logger.info(f"Merged PDF saved to {output_path}")

if __name__ == "__main__":
    main()