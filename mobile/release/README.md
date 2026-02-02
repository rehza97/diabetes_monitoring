# Release APK

This folder contains the built Android APK that can be committed to the repository.

- **app-release.apk** – Release build of the Diabetes Monitoring mobile app (install on Android devices).

To rebuild: from the `mobile/` directory run:

```bash
flutter pub get
flutter build apk --release
cp build/app/outputs/flutter-apk/app-release.apk release/
```
