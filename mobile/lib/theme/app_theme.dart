import 'package:flutter/material.dart';

// Medical-oriented colors from plan / pricing.
// Primary #3498db, secondary #2980b9, success #27ae60, warning #f39c12, danger #e74c3c, background #f8f9fa.
final Color _primary = const Color(0xFF3498DB);
final Color _secondary = const Color(0xFF2980B9);
final Color _surface = const Color(0xFFF8F9FA);

ThemeData get appTheme => ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _primary,
        primary: _primary,
        secondary: _secondary,
        surface: _surface,
        brightness: Brightness.light,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
      scaffoldBackgroundColor: _surface,
    );

ThemeData get appThemeDark => ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _primary,
        primary: _primary,
        secondary: _secondary,
        surface: _surface,
        brightness: Brightness.dark,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
      scaffoldBackgroundColor: _surface,
    );
