# App Forge

App Forge is an AI-powered application generator that creates apps, websites, and online games using the Gemini API. This project was developed for the Gemini API developer competition.

## Features

- Generate PWA apps, websites, or online games
- Offline functionality: Install generated apps on your device
- Built-in code editor
- Collaborative app creation with session sharing
- Local file saving and loading

## Quick Start

1. Open the source folder in your command line.
2. Run the following commands:
   ```
   npm i http-server
   npm run start
   ```
3. Navigate to `http://127.0.0.1:8080/` in your browser.
4. In the input field, describe your desired app (e.g., "create app similar to twitter, use firebase").
5. Wait approximately 10 seconds for the app generation to begin.

Note: If the process appears stuck, refresh the page (F5) and try again.

## Usage

1. Type your app description in the input field.
2. Wait for the AI to generate your app.
3. Use the built-in code editor to modify the generated code if needed.
4. To collaborate, click "Share" in the menu to start a shared session.
5. To save your project locally, go to Menu -> File -> Save Folder.
6. For optimal performance, change the model to Gemini Pro from the navbar.

To install a generated app for offline use:
1. Open the app in your browser.
2. Click "Install..." in the menu.

## Online Demo

You can also test App Forge online at https://beta.gptcall.net/

## App Demonstration

Watch our demo video: https://www.youtube.com/watch?v=P-wWIpqe2CM

## To use your own API key:

Locate the localsettings.js file in the project directory.
Uncomment the relevant section in this file.
Replace the placeholder with your actual API key.

## Compatibility

Tested on:
- Windows
- Android 12
