# Install
npm install

# Build
npm run build

# Run 
npm start

# Distribute

## All Platforms: 
electron-packager . --all

## Mac:
electron-packager . --overwrite --platform=darwin --arch=x64 --icon=assets/icons/mac/icon.icns --prune=true --out=release-builds