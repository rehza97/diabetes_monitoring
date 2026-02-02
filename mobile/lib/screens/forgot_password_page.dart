import 'package:flutter/material.dart';

import '../auth/app_auth_scope.dart';
import '../utils/validators.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isSubmitting = false;
  bool _resetStateCleared = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_resetStateCleared) {
      _resetStateCleared = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        AppAuthScope.of(context).clearResetState();
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendResetEmail() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    final auth = AppAuthScope.of(context);

    try {
      await auth.sendPasswordResetEmail(_emailController.text.trim());
      // resetEmailSent set in auth
    } catch (_) {
      // Error stored in auth.resetError
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = AppAuthScope.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mot de passe oublié'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => FocusScope.of(context).unfocus(),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: auth.resetEmailSent ? _buildSuccess(context, auth) : _buildForm(context, auth),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSuccess(BuildContext context, AppAuthState auth) {
    return Semantics(
      label: 'Email de réinitialisation envoyé',
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(Icons.mark_email_read_outlined, size: 64, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 24),
          Text(
            'Email envoyé',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Un lien de réinitialisation a été envoyé à ${_emailController.text.trim()}. '
            'Ouvrez l\'email et suivez les instructions.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Retour à la connexion'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () {
              auth.clearResetState();
              setState(() {});
            },
            child: const Text('Renvoyer un autre email'),
          ),
        ],
      ),
    );
  }

  Widget _buildForm(BuildContext context, AppAuthState auth) {
    return Form(
      key: _formKey,
      child: IgnorePointer(
        ignoring: _isSubmitting,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
          Text(
            'Entrez votre email pour recevoir un lien de réinitialisation.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          if (auth.resetError != null) ...[
            Semantics(
              liveRegion: true,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Theme.of(context).colorScheme.onErrorContainer),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        auth.resetError!,
                        style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(
              labelText: 'Email',
              hintText: 'votre@email.com',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.email_outlined),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Email requis.';
              if (!isValidEmail(v)) return 'Email invalide.';
              return null;
            },
            onChanged: (_) => auth.clearResetState(),
            enabled: !_isSubmitting,
          ),
          const SizedBox(height: 24),
          Semantics(
            label: _isSubmitting ? 'Envoi en cours' : 'Envoyer le lien de réinitialisation',
            child: FilledButton(
              onPressed: _isSubmitting ? null : _sendResetEmail,
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Envoyer le lien de réinitialisation'),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: _isSubmitting ? null : () => Navigator.pop(context),
            child: const Text('Retour à la connexion'),
          ),
        ],
        ),
      ),
    );
  }
}
