import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/patient_repository.dart';
import '../../data/reading_repository.dart';
import '../../models/enums.dart';
import '../../models/patient.dart';
import '../../models/reading.dart';

class DoctorDashboardPage extends StatefulWidget {
  const DoctorDashboardPage({super.key});

  @override
  State<DoctorDashboardPage> createState() => _DoctorDashboardPageState();
}

class _DoctorDashboardPageState extends State<DoctorDashboardPage> {
  List<Patient> _patients = [];
  List<ReadingWithPatientId>? _recentReadings;
  bool _useFallback = false;
  bool _loading = true;
  String? _error;
  bool _hasLoaded = false;

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
          .where('isActive', isEqualTo: true));
      if (!mounted) return;

      List<ReadingWithPatientId>? recent;
      bool useFallback = false;
      try {
        recent = await queryAllReadings((q) => q.limit(30));
      } catch (_) {
        useFallback = true;
      }
      if (!mounted) return;

      final ids = patients.map((p) => p.id).toSet();
      List<ReadingWithPatientId>? filtered;
      if (recent != null) {
        filtered = recent.where((r) => ids.contains(r.patientId)).toList();
      }

      setState(() {
        _patients = patients;
        _recentReadings = filtered;
        _useFallback = useFallback;
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

  @override
  Widget build(BuildContext context) {
    final auth = AppAuthScope.of(context);
    final theme = Theme.of(context);
    final uid = auth.userId;

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
                onPressed: uid != null ? () => _load(uid) : null,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    final patientMap = {for (final p in _patients) p.id: p};
    final criticalCount = _patients
        .where((p) => p.lastReadingStatus == 'critical')
        .length;

    return RefreshIndicator(
      onRefresh: () async {
        if (uid != null) await _load(uid);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildSummaryCards(theme, criticalCount),
            const SizedBox(height: 24),
            _buildRecentReadingsSection(theme, patientMap),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCards(ThemeData theme, int criticalCount) {
    return Row(
      children: [
        Expanded(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Patients suivis',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_patients.length}',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'En alerte',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$criticalCount',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: criticalCount > 0
                          ? theme.colorScheme.error
                          : theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentReadingsSection(
    ThemeData theme,
    Map<String, Patient> patientMap,
  ) {
    if (_patients.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Text(
              'Aucun patient',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Dernières mesures',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 12),
        _buildRecentReadingsList(theme, patientMap),
      ],
    );
  }

  Widget _buildRecentReadingsList(
    ThemeData theme,
    Map<String, Patient> patientMap,
  ) {
    if (_useFallback) {
      final withLast = _patients
          .where((p) =>
              p.lastReadingDate != null &&
              p.lastReadingValue != null &&
              p.lastReadingStatus != null)
          .toList();
      withLast.sort((a, b) {
        final da = a.lastReadingDate!;
        final db = b.lastReadingDate!;
        return db.compareTo(da);
      });
      if (withLast.isEmpty) {
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Text(
                'Aucune mesure récente',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
        );
      }
      return Card(
        child: Column(
          children: [
            for (final p in withLast)
              _buildFallbackReadingTile(theme, p),
          ],
        ),
      );
    }

    final list = _recentReadings ?? [];
    if (list.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Text(
              'Aucune mesure récente',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      );
    }

    return Card(
      child: Column(
        children: [
          for (final rw in list) _buildReadingTile(theme, rw, patientMap),
        ],
      ),
    );
  }

  Widget _buildFallbackReadingTile(ThemeData theme, Patient p) {
    final name = '${p.firstName} ${p.lastName}'.trim();
    final value = p.lastReadingValue!;
    final date = p.lastReadingDate!;
    final status = p.lastReadingStatus!;
    return ListTile(
      title: Text(name),
      subtitle: Text(_formatDate(date)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _statusChip(theme, status),
          const SizedBox(width: 8),
          Text(
            '${value.toStringAsFixed(0)} mg/dL',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      onTap: () => _navigateToPatientDetail(p.id),
    );
  }

  Widget _buildReadingTile(
    ThemeData theme,
    ReadingWithPatientId rw,
    Map<String, Patient> patientMap,
  ) {
    final p = patientMap[rw.patientId];
    final name = p != null
        ? '${p.firstName} ${p.lastName}'.trim()
        : 'Patient ${rw.patientId}';
    final r = rw.reading;
    final unitStr = r.unit == ReadingUnit.mgDl ? 'mg/dL' : 'mmol/L';
    return ListTile(
      title: Text(name),
      subtitle: Text(_formatDate(r.date)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _statusChip(theme, r.status.name),
          const SizedBox(width: 8),
          Text(
            '${r.value.toStringAsFixed(0)} $unitStr',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      onTap: () => _navigateToPatientDetail(rw.patientId),
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

  String _formatDate(Timestamp ts) {
    final d = ts.toDate();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  void _navigateToPatientDetail(String patientId) {
    Navigator.pushNamed(
      context,
      '/doctor/patient-detail',
      arguments: {'patientId': patientId},
    );
  }
}
