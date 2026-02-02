import 'package:flutter/material.dart';

/// Provides [ThemeMode] notifier so Settings can update app theme on save.
class AppThemeScope extends InheritedWidget {
  const AppThemeScope({
    super.key,
    required this.themeModeNotifier,
    required super.child,
  });

  final ValueNotifier<ThemeMode> themeModeNotifier;

  static ValueNotifier<ThemeMode> of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppThemeScope>();
    assert(scope != null, 'AppThemeScope not found');
    return scope!.themeModeNotifier;
  }

  @override
  bool updateShouldNotify(AppThemeScope oldWidget) =>
      themeModeNotifier != oldWidget.themeModeNotifier;
}
