import PyPDF2
import os

pdf_path = r"f:\Download\smart-doc-qa\smart-doc-qa\backend-python\uploads\2988cb40-99c1-4033-9520-ed3fc0beb33e.pdf"

def extract_text(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    
    try:
        with open(path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    try:
        text = extract_text(pdf_path)
        with open(r"f:\Download\smart-doc-qa\smart-doc-qa\scratch\extracted_text.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print("Successfully extracted to extracted_text.txt")
    except Exception as e:
        print(f"Failed: {e}")
