#!/bin/bash

# package_extension.sh - Script to package Kindle Chrome Extension for the Chrome Web Store
# Created: April 12, 2025

# Set variables
EXTENSION_NAME="kindle_library_extension"
VERSION=$(grep -oP '"version":\s*"\K[^"]+' manifest.json)
OUTPUT_DIR="dist"
TEMP_DIR="temp_build"
CURRENT_DIR=$(pwd)
DATE=$(date +"%Y%m%d")

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Packaging Kindle Chrome Extension v${VERSION}${NC}"
echo -e "${GREEN}======================================${NC}"

# Create output directory if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${YELLOW}Creating output directory: ${OUTPUT_DIR}${NC}"
    mkdir -p "$OUTPUT_DIR"
fi

# Create temp directory for build
echo -e "${YELLOW}Setting up temporary build directory...${NC}"
rm -rf "$TEMP_DIR" 2>/dev/null
mkdir -p "$TEMP_DIR"

# Copy required files to build directory
echo -e "${YELLOW}Copying extension files...${NC}"
cp manifest.json "$TEMP_DIR/"
cp background.js "$TEMP_DIR/"
cp content.js "$TEMP_DIR/"
cp popup.html "$TEMP_DIR/"
cp popup.css "$TEMP_DIR/"
cp popup.js "$TEMP_DIR/"
cp goodreads-search.html "$TEMP_DIR/"
cp goodreads-search.js "$TEMP_DIR/"
cp stats.html "$TEMP_DIR/"
cp stats.css "$TEMP_DIR/"
cp LICENSE "$TEMP_DIR/"
cp privacy_policy.md "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"

# Copy directories
echo -e "${YELLOW}Copying directories...${NC}"
cp -r icons "$TEMP_DIR/"
cp -r js "$TEMP_DIR/"
cp -r vendors "$TEMP_DIR/"

# Remove any existing zip file with the same name
ZIP_FILE="${OUTPUT_DIR}/${EXTENSION_NAME}_v${VERSION}_${DATE}.zip"
if [ -f "$ZIP_FILE" ]; then
    echo -e "${YELLOW}Removing existing package: ${ZIP_FILE}${NC}"
    rm "$ZIP_FILE"
fi

# Create zip file
echo -e "${YELLOW}Creating package...${NC}"
cd "$TEMP_DIR"
zip -r "../${ZIP_FILE}" ./* -x "*.git*" -x "*.DS_Store" -x "*__MACOSX*"
cd "$CURRENT_DIR"

# Check if zip was created successfully
if [ -f "$ZIP_FILE" ]; then
    SIZE=$(du -h "$ZIP_FILE" | cut -f1)
    echo -e "${GREEN}Package created successfully: ${ZIP_FILE} (${SIZE})${NC}"
    
    # Cleanup
    echo -e "${YELLOW}Cleaning up temporary files...${NC}"
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}Extension is ready for submission to the Chrome Web Store!${NC}"
    echo -e "${GREEN}File: ${ZIP_FILE}${NC}"
    echo -e "${GREEN}======================================${NC}"
else
    echo -e "${RED}Error: Failed to create package${NC}"
    exit 1
fi

# Optional: Provide instructions for submission
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Go to https://chrome.google.com/webstore/devconsole/"
echo -e "2. Click 'Add new item'"
echo -e "3. Upload the ZIP file: ${ZIP_FILE}"
echo -e "4. Fill out the store listing information"
echo -e "5. Include a link to the privacy policy in the Privacy practices section"
echo -e "6. Submit for review"
echo -e "${YELLOW}======================================${NC}"

exit 0