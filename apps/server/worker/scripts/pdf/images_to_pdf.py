"""Convert all images in a folder into a single PDF."""
import sys, os, logging
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("convert_images_to_pdf")

def main():
    if len(sys.argv) < 3:
        logger.error("Missing arguments: input_dir output_path")
        sys.exit(1)

    input_dir = sys.argv[1]
    output_path = sys.argv[2]

    image_files = sorted([
        f for f in os.listdir(input_dir)
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))
    ])

    if not image_files:
        logger.error("No image files found")
        sys.exit(1)

    logger.info(f"Converting {len(image_files)} images to PDF")
    images = []
    for file in image_files:
        img_path = os.path.join(input_dir, file)
        img = Image.open(img_path).convert('RGB')
        images.append(img)
        logger.info(f"Loaded: {file}")

    # Save all images as a single PDF
    images[0].save(output_path, save_all=True, append_images=images[1:])
    logger.info(f"PDF saved to {output_path}")

if __name__ == "__main__":
    main()