import 'package:flutter/material.dart';

import '../auth/app_auth_scope.dart';
import '../data/user_repository.dart';
import '../models/user.dart';
import '../theme/theme_scope.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _avatarController = TextEditingController();

  User? _user;
  bool _loading = true;
  String? _error;
  bool _userLoaded = false;
  bool _saving = false;

  // Preferences (defaults when user.preferences == null)
  String _language = 'fr';
  String _theme = 'light';
  String _dateFormat = 'DD/MM/YYYY';
  String _measurementUnit = 'mg/dL';
  bool _criticalReadings = true;
  bool _reminders = true;
  bool _messages = true;
  bool _system = true;

  static const _languageOptions = ['fr', 'en'];
  static const _themeOptions = ['light', 'dark', 'system'];
  static const _dateFormatOptions = ['DD/MM/YYYY', 'MM/DD/YYYY'];
  static const _unitOptions = ['mg/dL', 'mmol/L'];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_userLoaded) return;
    final auth = AppAuthScope.of(context);
    final userId = auth.userId;
    if (userId == null) {
      _userLoaded = true;
      _loading = false;
      _error = 'Non connecté';
      setState(() {});
      return;
    }
    _userLoaded = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadUser(userId));
  }

  Future<void> _loadUser(String userId) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = await getUser(userId);
      if (!mounted) return;
      setState(() {
        _user = user;
        _loading = false;
        _error = user == null ? 'Profil introuvable' : null;
      });
      if (user != null) {
        _applyUserToForm(user);
        setState(() {});
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  void _applyUserToForm(User user) {
    _firstNameController.text = user.firstName;
    _lastNameController.text = user.lastName;
    _phoneController.text = user.phone ?? '';
    _avatarController.text = user.avatar ?? '';
    final p = user.preferences;
    if (p != null) {
      _language = _languageOptions.contains(p.language) ? p.language : 'fr';
      _theme = _themeOptions.contains(p.theme) ? p.theme : 'light';
      _dateFormat =
          _dateFormatOptions.contains(p.dateFormat) ? p.dateFormat : 'DD/MM/YYYY';
      _measurementUnit =
          _unitOptions.contains(p.measurementUnit) ? p.measurementUnit : 'mg/dL';
      _criticalReadings = p.notifications.criticalReadings;
      _reminders = p.notifications.reminders;
      _messages = p.notifications.messages;
      _system = p.notifications.system;
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _avatarController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AppAuthScope.of(context);
    final userId = auth.userId;
    if (userId == null) return;

    setState(() => _saving = true);
    try {
      final prefs = UserPreferences(
        language: _language,
        theme: _theme,
        timezone: _user?.preferences?.timezone ?? 'UTC',
        dateFormat: _dateFormat,
        measurementUnit: _measurementUnit,
        notifications: NotificationPreferences(
          criticalReadings: _criticalReadings,
          reminders: _reminders,
          messages: _messages,
          system: _system,
        ),
      );
      await updateUser(userId, {
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'avatar': _avatarController.text.trim(),
        'preferences': prefs.toMap(),
      });
      if (!mounted) return;

      final notifier = AppThemeScope.of(context);
      final mode = _theme == 'dark'
          ? ThemeMode.dark
          : _theme == 'system'
              ? ThemeMode.system
              : ThemeMode.light;
      notifier.value = mode;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Paramètres enregistrés')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = AppAuthScope.of(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Paramètres'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _buildBody(theme, auth),
    );
  }

  Widget _buildBody(ThemeData theme, AppAuthState auth) {
    if (_loading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'Chargement...',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ],
        ),
      );
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: auth.userId != null
                    ? () => _loadUser(auth.userId!)
                    : null,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => FocusScope.of(context).unfocus(),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: IgnorePointer(
              ignoring: _saving,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildProfileSection(theme),
                  const SizedBox(height: 24),
                  _buildPreferencesSection(theme),
                  const SizedBox(height: 32),
                  FilledButton(
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Enregistrer'),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: _saving ? null : () => auth.logout(),
                    child: const Text('Déconnexion'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Profil',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: _buildAvatar(theme),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _firstNameController,
          decoration: const InputDecoration(
            labelText: 'Prénom',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.person_outline),
          ),
          validator: (_) => null,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _lastNameController,
          decoration: const InputDecoration(
            labelText: 'Nom',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.person_outline),
          ),
          validator: (_) => null,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Téléphone',
            hintText: 'Optionnel',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.phone_outlined),
          ),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _avatarController,
          keyboardType: TextInputType.url,
          decoration: const InputDecoration(
            labelText: 'URL avatar',
            hintText: 'Optionnel',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.image_outlined),
          ),
          onChanged: (_) => setState(() {}),
        ),
      ],
    );
  }

  Widget _buildAvatar(ThemeData theme) {
    final url = _avatarController.text.trim();
    final first = _firstNameController.text.trim().isNotEmpty
        ? _firstNameController.text.trim()[0]
        : '';
    final last = _lastNameController.text.trim().isNotEmpty
        ? _lastNameController.text.trim()[0]
        : '';
    final initials = '$first$last'.toUpperCase();

    if (url.isNotEmpty) {
      return CircleAvatar(
        radius: 40,
        backgroundImage: NetworkImage(url),
        onBackgroundImageError: (_, __) {},
      );
    }
    return CircleAvatar(
      radius: 40,
      backgroundColor: theme.colorScheme.primaryContainer,
      child: Text(
        initials.isEmpty ? '?' : initials,
        style: theme.textTheme.headlineSmall?.copyWith(
          color: theme.colorScheme.onPrimaryContainer,
        ),
      ),
    );
  }

  Widget _buildPreferencesSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Préférences',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 16),
        InputDecorator(
          decoration: const InputDecoration(
            labelText: 'Langue',
            border: OutlineInputBorder(),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _language,
              isExpanded: true,
              items: _languageOptions
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (v) => setState(() => _language = v ?? 'fr'),
            ),
          ),
        ),
        const SizedBox(height: 16),
        InputDecorator(
          decoration: const InputDecoration(
            labelText: 'Thème',
            border: OutlineInputBorder(),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _theme,
              isExpanded: true,
              items: _themeOptions
                  .map((e) => DropdownMenuItem(
                        value: e,
                        child: Text(e == 'light'
                            ? 'Clair'
                            : e == 'dark'
                                ? 'Sombre'
                                : 'Système'),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _theme = v ?? 'light'),
            ),
          ),
        ),
        const SizedBox(height: 16),
        InputDecorator(
          decoration: const InputDecoration(
            labelText: 'Format de date',
            border: OutlineInputBorder(),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _dateFormat,
              isExpanded: true,
              items: _dateFormatOptions
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (v) => setState(() => _dateFormat = v ?? 'DD/MM/YYYY'),
            ),
          ),
        ),
        const SizedBox(height: 16),
        InputDecorator(
          decoration: const InputDecoration(
            labelText: 'Unité de mesure',
            border: OutlineInputBorder(),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _measurementUnit,
              isExpanded: true,
              items: _unitOptions
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (v) => setState(() => _measurementUnit = v ?? 'mg/dL'),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Notifications',
          style: theme.textTheme.titleSmall,
        ),
        SwitchListTile(
          title: const Text('Lectures critiques'),
          value: _criticalReadings,
          onChanged: (v) => setState(() => _criticalReadings = v),
        ),
        SwitchListTile(
          title: const Text('Rappels'),
          value: _reminders,
          onChanged: (v) => setState(() => _reminders = v),
        ),
        SwitchListTile(
          title: const Text('Messages'),
          value: _messages,
          onChanged: (v) => setState(() => _messages = v),
        ),
        SwitchListTile(
          title: const Text('Système'),
          value: _system,
          onChanged: (v) => setState(() => _system = v),
        ),
      ],
    );
  }
}
