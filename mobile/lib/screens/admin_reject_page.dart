import 'package:flutter/material.dart';

import '../auth/app_auth_scope.dart';

class AdminRejectPage extends StatelessWidget {
  const AdminRejectPage({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AppAuthScope.of(context);
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Application réservée'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.block,
                size: 64,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(height: 24),
              Text(
                'App réservée aux médecins et infirmiers',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => auth.logout(),
                child: const Text('Déconnexion'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
