import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/patient_repository.dart';
import '../../models/enums.dart';
import '../../models/patient.dart';

class NurseAssignedPatientsPage extends StatefulWidget {
  const NurseAssignedPatientsPage({super.key});

  @override
  State<NurseAssignedPatientsPage> createState() => _NurseAssignedPatientsPageState();
}

class _NurseAssignedPatientsPageState extends State<NurseAssignedPatientsPage> {
  List<Patient> _patients = [];
  bool _loading = true;
  String? _error;
  bool _hasLoaded = false;

  String _search = '';
  PatientStatus? _statusFilter;

  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() => _search = _searchController.text.trim());
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
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
          .where('nurseId', isEqualTo: uid)
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true));
      if (!mounted) return;
      setState(() {
        _patients = patients;
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

  List<Patient> get _filteredPatients {
    var list = _patients;
    if (_statusFilter != null) {
      list = list.where((p) => p.status == _statusFilter).toList();
    }
    if (_search.isNotEmpty) {
      final lower = _search.toLowerCase();
      list = list.where((p) {
        final name =
            '${p.firstName} ${p.lastName}'.trim().toLowerCase();
        final file = (p.fileNumber).toLowerCase();
        return name.contains(lower) || file.contains(lower);
      }).toList();
    }
    return list;
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
              Text(_error ?? '', textAlign: TextAlign.center),
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

    final filtered = _filteredPatients;

    return RefreshIndicator(
      onRefresh: () async {
        if (uid != null) await _load(uid);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Rechercher (nom, n° dossier)',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _FilterChip(
                          label: 'Tous',
                          selected: _statusFilter == null,
                          onTap: () =>
                              setState(() => _statusFilter = null),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Actif',
                          selected: _statusFilter == PatientStatus.active,
                          onTap: () =>
                              setState(() => _statusFilter = PatientStatus.active),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Inactif',
                          selected: _statusFilter == PatientStatus.inactive,
                          onTap: () => setState(
                              () => _statusFilter = PatientStatus.inactive),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Critique',
                          selected: _statusFilter == PatientStatus.critical,
                          onTap: () => setState(
                              () => _statusFilter = PatientStatus.critical),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Suivi requis',
                          selected: _statusFilter == PatientStatus.needsFollowup,
                          onTap: () => setState(
                              () => _statusFilter = PatientStatus.needsFollowup),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (filtered.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Text(
                  'Aucun patient',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final p = filtered[index];
                    return _PatientTile(
                      theme: theme,
                      patient: p,
                      onTap: () => _navigateToDetail(p.id),
                    );
                  },
                  childCount: filtered.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _navigateToDetail(String patientId) {
    Navigator.pushNamed(
      context,
      '/nurse/patient-detail',
      arguments: {'patientId': patientId},
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    );
  }
}

class _PatientTile extends StatelessWidget {
  const _PatientTile({
    required this.theme,
    required this.patient,
    required this.onTap,
  });

  final ThemeData theme;
  final Patient patient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = '${patient.firstName} ${patient.lastName}'.trim();
    final status = patient.lastReadingStatus;
    final date = patient.lastReadingDate;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(name),
        subtitle: Text(
          patient.fileNumber,
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
            if (date != null)
              Text(
                _formatDate(date),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
          ],
        ),
        onTap: onTap,
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

  String _formatDate(Timestamp ts) {
    final d = ts.toDate();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }
}
