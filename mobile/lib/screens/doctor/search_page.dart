import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/patient_repository.dart';
import '../../data/user_repository.dart';
import '../../models/patient.dart';
import '../../models/user.dart';

class DoctorSearchPage extends StatefulWidget {
  const DoctorSearchPage({super.key});

  @override
  State<DoctorSearchPage> createState() => _DoctorSearchPageState();
}

class _DoctorSearchPageState extends State<DoctorSearchPage> {
  List<Patient> _patients = [];
  List<User> _nurses = [];
  bool _loading = true;
  String? _error;
  bool _hasLoaded = false;

  String _name = '';
  String _fileNumber = '';
  String _phone = '';
  String _ageMin = '';
  String _ageMax = '';
  String _diabetesType = 'all';
  String _status = 'all';
  String _lastReadingDateFrom = '';
  String _lastReadingDateTo = '';
  String _readingValueMin = '';
  String _readingValueMax = '';
  String _nurseId = 'all';
  String _registrationDateFrom = '';
  String _registrationDateTo = '';

  final _nameController = TextEditingController();
  final _fileNumberController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ageMinController = TextEditingController();
  final _ageMaxController = TextEditingController();
  final _lastReadingDateFromController = TextEditingController();
  final _lastReadingDateToController = TextEditingController();
  final _readingValueMinController = TextEditingController();
  final _readingValueMaxController = TextEditingController();
  final _registrationDateFromController = TextEditingController();
  final _registrationDateToController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _fileNumberController.dispose();
    _phoneController.dispose();
    _ageMinController.dispose();
    _ageMaxController.dispose();
    _lastReadingDateFromController.dispose();
    _lastReadingDateToController.dispose();
    _readingValueMinController.dispose();
    _readingValueMaxController.dispose();
    _registrationDateFromController.dispose();
    _registrationDateToController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_hasLoaded) return;
    final uid = AppAuthScope.of(context).userId;
    if (uid == null) {
      _hasLoaded = true;
      setState(() {
        _loading = false;
        _error = 'Non connecté';
      });
      return;
    }
    _hasLoaded = true;
    _load(uid);
  }

  Future<void> _load(String uid) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final patients = await queryPatients((q) => q
          .where('doctorId', isEqualTo: uid)
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true));
      final nurses = await queryUsers((q) => q
          .where('role', isEqualTo: 'nurse')
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true));

      if (!mounted) return;
      setState(() {
        _patients = patients;
        _nurses = nurses;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  void _applyCriteriaToControllers() {
    _name = _nameController.text.trim();
    _fileNumber = _fileNumberController.text.trim();
    _phone = _phoneController.text.trim();
    _ageMin = _ageMinController.text.trim();
    _ageMax = _ageMaxController.text.trim();
    _lastReadingDateFrom = _lastReadingDateFromController.text.trim();
    _lastReadingDateTo = _lastReadingDateToController.text.trim();
    _readingValueMin = _readingValueMinController.text.trim();
    _readingValueMax = _readingValueMaxController.text.trim();
    _registrationDateFrom = _registrationDateFromController.text.trim();
    _registrationDateTo = _registrationDateToController.text.trim();
  }

  List<Patient> get _filteredPatients {
    _applyCriteriaToControllers();
    final now = DateTime.now();
    return _patients.where((p) {
      if (_name.isNotEmpty) {
        final full = '${p.firstName} ${p.lastName}'.trim().toLowerCase();
        if (!full.contains(_name.toLowerCase())) return false;
      }
      if (_fileNumber.isNotEmpty && p.fileNumber.isNotEmpty) {
        if (!p.fileNumber.toLowerCase().contains(_fileNumber.toLowerCase())) return false;
      }
      if (_phone.isNotEmpty && p.phone.isNotEmpty) {
        if (!p.phone.contains(_phone)) return false;
      }
      if (_ageMin.isNotEmpty || _ageMax.isNotEmpty) {
        final dob = p.dateOfBirth.toDate();
        final age = (now.difference(dob).inDays / 365.25).floor();
        final min = int.tryParse(_ageMin);
        final max = int.tryParse(_ageMax);
        if (min != null && age < min) return false;
        if (max != null && age > max) return false;
      }
      if (_diabetesType != 'all' && p.diabetesType.name != _diabetesType) return false;
      if (_status != 'all' && (p.lastReadingStatus ?? '') != _status) return false;
      if (_lastReadingDateFrom.isNotEmpty && p.lastReadingDate != null) {
        final from = DateTime.tryParse(_lastReadingDateFrom);
        if (from != null && p.lastReadingDate!.toDate().isBefore(from)) return false;
      }
      if (_lastReadingDateTo.isNotEmpty && p.lastReadingDate != null) {
        final to = DateTime.tryParse(_lastReadingDateTo);
        if (to != null) {
          final end = DateTime(to.year, to.month, to.day, 23, 59, 59);
          if (p.lastReadingDate!.toDate().isAfter(end)) return false;
        }
      }
      if (_readingValueMin.isNotEmpty || _readingValueMax.isNotEmpty) {
        final v = p.lastReadingValue;
        if (v == null) return false;
        final min = double.tryParse(_readingValueMin);
        final max = double.tryParse(_readingValueMax);
        if (min != null && v < min) return false;
        if (max != null && v > max) return false;
      }
      if (_nurseId != 'all' && (p.nurseId ?? '') != _nurseId) return false;
      if (_registrationDateFrom.isNotEmpty) {
        final from = DateTime.tryParse(_registrationDateFrom);
        if (from != null && p.createdAt.toDate().isBefore(from)) return false;
      }
      if (_registrationDateTo.isNotEmpty) {
        final to = DateTime.tryParse(_registrationDateTo);
        if (to != null) {
          final end = DateTime(to.year, to.month, to.day, 23, 59, 59);
          if (p.createdAt.toDate().isAfter(end)) return false;
        }
      }
      return true;
    }).toList();
  }

  bool get _hasActiveFilters {
    _applyCriteriaToControllers();
    return _name.isNotEmpty ||
        _fileNumber.isNotEmpty ||
        _phone.isNotEmpty ||
        _ageMin.isNotEmpty ||
        _ageMax.isNotEmpty ||
        _diabetesType != 'all' ||
        _status != 'all' ||
        _lastReadingDateFrom.isNotEmpty ||
        _lastReadingDateTo.isNotEmpty ||
        _readingValueMin.isNotEmpty ||
        _readingValueMax.isNotEmpty ||
        _nurseId != 'all' ||
        _registrationDateFrom.isNotEmpty ||
        _registrationDateTo.isNotEmpty;
  }

  void _clearFilters() {
    _nameController.clear();
    _fileNumberController.clear();
    _phoneController.clear();
    _ageMinController.clear();
    _ageMaxController.clear();
    _lastReadingDateFromController.clear();
    _lastReadingDateToController.clear();
    _readingValueMinController.clear();
    _readingValueMaxController.clear();
    _registrationDateFromController.clear();
    _registrationDateToController.clear();
    setState(() {
      _diabetesType = 'all';
      _status = 'all';
      _nurseId = 'all';
    });
  }

  String _formatDate(Timestamp ts) {
    final d = ts.toDate();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  void _navigateToDetail(String patientId) {
    Navigator.pushNamed(
      context,
      '/doctor/patient-detail',
      arguments: {'patientId': patientId},
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final uid = AppAuthScope.of(context).userId;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Recherche avancée'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
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
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Recherche avancée'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
                const SizedBox(height: 16),
                Text(_error ?? '', textAlign: TextAlign.center),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: uid != null ? () => _load(uid) : null,
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final filtered = _filteredPatients;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recherche avancée'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_hasActiveFilters)
            TextButton(
              onPressed: _clearFilters,
              child: const Text('Réinitialiser'),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (uid != null) await _load(uid);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildFiltersSection(theme),
              const SizedBox(height: 24),
              Text(
                'Résultats (${filtered.length})',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(height: 12),
              _buildResults(theme, filtered),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFiltersSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Critères',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 2.2,
          children: [
            _textFilter('Nom', _nameController),
            _textFilter('N° dossier', _fileNumberController),
            _textFilter('Téléphone', _phoneController),
            _textFilter('Âge min', _ageMinController, keyboardType: TextInputType.number),
            _textFilter('Âge max', _ageMaxController, keyboardType: TextInputType.number),
            _dropdownFilter('Diabète', _diabetesType, [
              ('all', 'Tous'),
              ('type1', 'Type 1'),
              ('type2', 'Type 2'),
              ('gestational', 'Gestationnel'),
            ], (v) => setState(() => _diabetesType = v)),
            _dropdownFilter('État', _status, [
              ('all', 'Tous'),
              ('normal', 'Normal'),
              ('warning', 'Attention'),
              ('critical', 'Critique'),
            ], (v) => setState(() => _status = v)),
            _textFilter('Mesure min', _readingValueMinController, keyboardType: TextInputType.number),
            _textFilter('Mesure max', _readingValueMaxController, keyboardType: TextInputType.number),
            _textFilter('Dernière mesure du', _lastReadingDateFromController),
            _textFilter('Dernière mesure au', _lastReadingDateToController),
            _dropdownFilter('Infirmier(ère)', _nurseId, [
              ('all', 'Tous'),
              ..._nurses.map((u) => (u.id, '${u.firstName} ${u.lastName}'.trim().isEmpty ? u.email : '${u.firstName} ${u.lastName}'.trim())),
            ], (v) => setState(() => _nurseId = v)),
            _textFilter('Inscription du', _registrationDateFromController),
            _textFilter('Inscription au', _registrationDateToController),
          ],
        ),
      ],
    );
  }

  Widget _textFilter(String label, TextEditingController c, {TextInputType? keyboardType}) {
    return TextField(
      controller: c,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
      onChanged: (_) => setState(() {}),
    );
  }

  Widget _dropdownFilter(
    String label,
    String value,
    List<(String, String)> options,
    void Function(String) onChanged,
  ) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: options.any((e) => e.$1 == value) ? value : (options.isNotEmpty ? options.first.$1 : null),
          isExpanded: true,
          items: options
              .map((e) => DropdownMenuItem<String>(
                    value: e.$1,
                    child: Text(e.$2, overflow: TextOverflow.ellipsis),
                  ))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }

  Widget _buildResults(ThemeData theme, List<Patient> filtered) {
    if (filtered.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Text(
              _hasActiveFilters ? 'Aucun résultat' : 'Aucun patient',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      );
    }
    return Column(
      children: [
        for (final p in filtered) _buildPatientTile(theme, p),
      ],
    );
  }

  Widget _buildPatientTile(ThemeData theme, Patient p) {
    final name = '${p.firstName} ${p.lastName}'.trim();
    final status = p.lastReadingStatus;
    final date = p.lastReadingDate;
    final value = p.lastReadingValue;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(name),
        subtitle: Text(
          p.fileNumber,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (status != null && status.isNotEmpty) ...[
              _statusChip(theme, status),
              const SizedBox(width: 8),
            ],
            if (value != null)
              Text(
                value.toStringAsFixed(0),
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            if (date != null) ...[
              const SizedBox(width: 8),
              Text(
                _formatDate(date),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
        onTap: () => _navigateToDetail(p.id),
      ),
    );
  }

  Widget _statusChip(ThemeData theme, String status) {
    Color color;
    switch (status) {
      case 'critical':
        color = theme.colorScheme.error;
        break;
      case 'warning':
        color = theme.colorScheme.tertiary;
        break;
      default:
        color = theme.colorScheme.primary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status == 'critical'
            ? 'Critique'
            : status == 'warning'
                ? 'Attention'
                : 'Normal',
        style: theme.textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
