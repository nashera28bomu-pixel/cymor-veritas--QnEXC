FROM node:20-slim

# System dependencies:
# - libreoffice: Word/Excel/PowerPoint -> PDF, PDF -> JPG
# - tesseract-ocr: OCR text extraction
# ffmpeg is NOT installed here — ffmpeg-static bundles its own binary via npm.
RUN apt-get update && apt-get install -y \
    libreoffice \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "src/bot.js"]
