"""
Barcode / QR Code Interpreter.
Usage: python interpret.py <image_path>
Outputs JSON with decoded text or error.
"""
import sys, json, logging
import cv2

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("interpreter")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing image path"}))
        sys.exit(1)

    image_path = sys.argv[1]
    try:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image")

        # First try QR code detector
        qr_detector = cv2.QRCodeDetector()
        data, vertices, _ = qr_detector.detectAndDecode(img)
        if data:
            logger.info(f"Decoded QR: {data}")
            print(json.dumps({"data": data}))
            return

        # If QR fails, try 1D barcode detector (OpenCV 4.5.1+)
        barcode_detector = cv2.barcode_BarcodeDetector()
        retval, decoded_info, decoded_type, points = barcode_detector.detectAndDecode(img)
        if retval and decoded_info:
            logger.info(f"Decoded barcode: {decoded_info[0]}")
            print(json.dumps({"data": decoded_info[0]}))
            return

        logger.warning("No barcode or QR code found")
        print(json.dumps({"error": "No code found"}))
        sys.exit(1)
    except Exception as e:
        logger.error(f"Interpretation failed: {e}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()