// File generated manually. Same Firebase project as frontend (diabetes-monitoring-app-8e131).
// Android config from google-services.json; authDomain from frontend firebase.ts.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Web not supported in this app.');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError('iOS not configured; use Android.');
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
        throw UnsupportedError('Platform not supported.');
      default:
        throw UnsupportedError('DefaultFirebaseOptions not supported for this platform.');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBGXUG5YFWtMEHZWvqWmkpoa_XagZCJ5_Y',
    appId: '1:451244213129:android:aeb574a1bd458b9ab4d758',
    messagingSenderId: '451244213129',
    projectId: 'diabetes-monitoring-app-8e131',
    storageBucket: 'diabetes-monitoring-app-8e131.firebasestorage.app',
  );

}
