
<h1> This Is my badly vibe coded app 
please feel free to edit this and commit changes <h1>


#### 

My initial idea was to create an android app that would benefit autistic pepole like myself in day to day life 




# Autism support app




This project is now structured as a local Android app using a native wrapper, so it runs as an app on Android rather than as a web page in a browser. It stays close to the MVP direction in docs1.txt: task breakdown, sensory check-ins, energy budgeting, and recovery mode.

## Run locally on Android

1. Install dependencies
   - npm install
2. Build the web app assets
   - npm run build
3. Sync the Android app wrapper
   - npm run build:android
4. Open the Android project
   - npm run android

This will open the Android project in Android Studio, where you can run it on an emulator or connected device.

## Notes

- The app is now designed to run as a locally installed Android app and does not depend on opening it in a browser.
- Recovery mode, task support, sensory logging, and energy tracking are implemented as local modules that can be expanded later.
