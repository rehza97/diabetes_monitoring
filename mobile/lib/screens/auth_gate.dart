import 'package:flutter/material.dart';

import '../auth/app_auth_scope.dart';
import 'login_page.dart';

/// Shows loading until auth state is ready, then Login.
/// If user is already signed in, auth listener navigates to /doctor|/nurse|/admin-reject.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AppAuthScope.of(context);

    if (auth.authLoading) {
      final theme = Theme.of(context);
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                color: theme.colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                'Chargement...',
                style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return const LoginPage();
  }
}
