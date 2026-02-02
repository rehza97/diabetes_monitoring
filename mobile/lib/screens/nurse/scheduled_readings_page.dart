import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/patient_repository.dart';
import '../../data/scheduled_reading_repository.dart';
import '../../models/enums.dart';
import '../../models/patient.dart';
import '../../models/scheduled_reading.dart';
import 'widgets/scheduled_reading_form.dart';

class NurseScheduledReadingsPage extends StatefulWidget {
  const NurseScheduledReadingsPage({super.key});

  @override
  State<NurseScheduledReadingsPage> createState() => _NurseScheduledReadingsPageState();
}

class _NurseScheduledReadingsPageState extends State<NurseScheduledReadingsPage> {
  List<({ScheduledReading scheduled, String patientId})> _scheduledReadings = [];
  Map<String, Patient> _patientsMap = {};
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
    debugPrint('🔍 [ScheduledReadingsPage] Loading scheduled readings for user: $uid');
    
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Try to get ALL patients to show in logs (may fail due to permissions)
      debugPrint('📋 [ScheduledReadingsPage] Attempting to fetch ALL patients for logging...');
      try {
        final allPatients = await queryPatients((q) => q.where('isActive', isEqualTo: true))
            .timeout(
              const Duration(seconds: 10),
              onTimeout: () {
                throw TimeoutException('Timeout fetching all patients');
              },
            );
        
        debugPrint('📊 [ScheduledReadingsPage] Total active patients: ${allPatients.length}');
        for (final patient in allPatients) {
          final assignedTo = patient.nurseId ?? 'NONE';
          final isAssigned = assignedTo == uid;
          debugPrint('  - Patient: ${patient.firstName} ${patient.lastName} (${patient.fileNumber})');
          debugPrint('    ID: ${patient.id}');
          debugPrint('    Assigned to nurseId: $assignedTo');
          debugPrint('    Is assigned to current user ($uid): $isAssigned');
          debugPrint('    Doctor ID: ${patient.doctorId}');
        }
      } catch (e) {
        debugPrint('⚠️ [ScheduledReadingsPage] Could not fetch all patients (permission denied or error): $e');
        debugPrint('   This is expected for nurses - they can only see assigned patients');
      }
      
      // Get assigned patients (this should work)
      debugPrint('🔍 [ScheduledReadingsPage] Query details:');
      debugPrint('   User ID: $uid');
      debugPrint('   Query: where(nurseId == $uid) && where(isActive == true)');
      debugPrint('   Field type: nurseId is String?');
      debugPrint('   Comparison: Exact string match');
      debugPrint('🔍 [ScheduledReadingsPage] Filtering patients assigned to current user ($uid)...');
      
      final patients = await queryPatients((q) => q
          .where('nurseId', isEqualTo: uid)
          .where('isActive', isEqualTo: true))
          .timeout(
            const Duration(seconds: 30),
            onTimeout: () {
              throw TimeoutException('Query timeout - patient assignment check took too long');
            },
          );
      
      debugPrint('✅ [ScheduledReadingsPage] Found ${patients.length} patients assigned to current user');
      if (patients.isEmpty) {
        debugPrint('⚠️ [ScheduledReadingsPage] NO PATIENTS ASSIGNED!');
        debugPrint('   This nurse account has no patients assigned.');
        debugPrint('   Nurse ID: $uid');
        debugPrint('   To assign patients:');
        debugPrint('   1. Login as admin/doctor in web dashboard');
        debugPrint('   2. Go to Patients Management');
        debugPrint('   3. Edit a patient');
        debugPrint('   4. Set nurseId field to: $uid');
        debugPrint('   5. Save and refresh this app');
      } else {
        for (final patient in patients) {
          debugPrint('  ✓ ${patient.firstName} ${patient.lastName} (${patient.fileNumber}) - ID: ${patient.id}');
        }
      }

      // Get scheduled readings for all assigned patients
      final allScheduled = <({ScheduledReading scheduled, String patientId})>[];
      final patientsMap = <String, Patient>{};

      for (final patient in patients) {
        patientsMap[patient.id] = patient;
        try {
          // Filter by status first, then sort in memory to avoid Firestore index requirements
          // Note: getScheduledReadings applies orderBy('scheduledDate'), but when combined with
          // where('status'), Firestore requires a composite index. We'll filter and sort in memory instead.
          final allScheduledForPatient = await getScheduledReadings(patient.id);
          final pendingScheduled = allScheduledForPatient
              .where((s) => s.status == ScheduledReadingStatus.pending)
              .toList();
          // Sort by scheduledDate (already sorted by getScheduledReadings, but re-sort to be safe)
          pendingScheduled.sort((a, b) => a.scheduledDate.compareTo(b.scheduledDate));
          for (final s in pendingScheduled) {
            allScheduled.add((scheduled: s, patientId: patient.id));
          }
        } catch (e) {
          debugPrint('⚠️ [ScheduledReadingsPage] Error loading scheduled readings for patient ${patient.id}: $e');
          // Continue with other patients even if one fails
        }
      }

      if (!mounted) return;
      setState(() {
        _scheduledReadings = allScheduled;
        _patientsMap = patientsMap;
        _loading = false;
        _error = null;
      });
    } on TimeoutException catch (e) {
      debugPrint('⏱️ [ScheduledReadingsPage] Query timeout: $e');
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Le chargement a pris trop de temps. Vérifiez votre connexion internet.';
      });
    } catch (e) {
      debugPrint('❌ [ScheduledReadingsPage] Error loading patients: $e');
      debugPrint('   Error type: ${e.runtimeType}');
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Erreur lors du chargement: ${e.toString()}';
      });
    }
  }

  Map<String, List<({ScheduledReading scheduled, String patientId})>> _groupByDate() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));
    final nextWeek = today.add(const Duration(days: 7));

    final grouped = <String, List<({ScheduledReading scheduled, String patientId})>>{
      'Aujourd\'hui': [],
      'Demain': [],
      'Cette semaine': [],
      'Plus tard': [],
    };

    for (final item in _scheduledReadings) {
      final scheduledDate = item.scheduled.scheduledDate.toDate();
      final dateOnly = DateTime(scheduledDate.year, scheduledDate.month, scheduledDate.day);

      if (dateOnly == today) {
        grouped['Aujourd\'hui']!.add(item);
      } else if (dateOnly == tomorrow) {
        grouped['Demain']!.add(item);
      } else if (dateOnly.isBefore(nextWeek) && dateOnly.isAfter(tomorrow)) {
        grouped['Cette semaine']!.add(item);
      } else {
        grouped['Plus tard']!.add(item);
      }
    }

    // Remove empty groups
    grouped.removeWhere((key, value) => value.isEmpty);
    return grouped;
  }

  Future<void> _markAsCompleted(({ScheduledReading scheduled, String patientId}) item) async {
    final patient = _patientsMap[item.patientId];
    if (patient == null) return;

    // Show dialog to create reading
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Marquer comme complété'),
        content: const Text('Voulez-vous créer une mesure pour ce patient ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, {'create': false}),
            child: const Text('Non'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, {'create': true}),
            child: const Text('Oui'),
          ),
        ],
      ),
    );

    if (result == null || result['create'] != true) {
      // Just mark as completed without creating reading
      try {
        await updateScheduledReading(patient.id, item.scheduled.id, {'status': 'completed'});
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Marqué comme complété')),
        );
        final uid = AppAuthScope.of(context).userId;
        if (uid != null) await _load(uid);
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
      return;
    }

    // Navigate to record reading page
    if (!mounted) return;
    Navigator.pushNamed(
      context,
      '/nurse/quick-record',
      arguments: {'patientId': patient.id},
    );
  }

  Future<void> _markAsMissed(({ScheduledReading scheduled, String patientId}) item) async {
    final patient = _patientsMap[item.patientId];
    if (patient == null) return;
    
    final scheduled = item.scheduled;

    try {
      await updateScheduledReading(patient.id, scheduled.id, {'status': 'missed'});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Marqué comme manqué')),
      );
      final uid = AppAuthScope.of(context).userId;
      if (uid != null) await _load(uid);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  String _readingTypeLabel(ReadingType type) {
    switch (type) {
      case ReadingType.fasting:
        return 'À jeun';
      case ReadingType.postBreakfast:
        return 'Après petit-déj';
      case ReadingType.preLunch:
        return 'Avant déj';
      case ReadingType.postLunch:
        return 'Après déj';
      case ReadingType.preDinner:
        return 'Avant dîner';
      case ReadingType.postDinner:
        return 'Après dîner';
      case ReadingType.bedtime:
        return 'Au coucher';
      case ReadingType.midnight:
        return 'Minuit';
      case ReadingType.random:
        return 'Aléatoire';
    }
  }

  String _formatDate(Timestamp ts) {
    final d = ts.toDate();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  String _formatTime(String time) {
    return time; // Already in HH:mm format
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final uid = AppAuthScope.of(context).userId;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Planning des mesures')),
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
        appBar: AppBar(title: const Text('Planning des mesures')),
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

    final grouped = _groupByDate();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Planning des mesures'),
        actions: [
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () async {
                await showDialog(
                  context: context,
                  builder: (context) => ScheduledReadingForm(
                    onSaved: () {
                      if (uid != null) _load(uid);
                    },
                  ),
                );
              },
              tooltip: 'Nouveau planning',
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (uid != null) await _load(uid);
        },
        child: grouped.isEmpty
            ? Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.calendar_today, size: 64, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(height: 16),
                      Text(
                        _patientsMap.isEmpty ? 'Aucun patient assigné' : 'Aucun planning',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _patientsMap.isEmpty 
                          ? 'Aucune mesure planifiée car aucun patient n\'est assigné à votre compte.'
                          : 'Aucune mesure planifiée',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (_patientsMap.isEmpty && uid != null) ...[
                        const SizedBox(height: 24),
                        Card(
                          color: theme.colorScheme.surfaceContainerHighest,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.info_outline, size: 20, color: theme.colorScheme.primary),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Information',
                                      style: theme.textTheme.titleSmall?.copyWith(
                                        color: theme.colorScheme.primary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Pour recevoir des patients assignés:',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '1. Contactez un administrateur ou un médecin\n'
                                  '2. Demandez-leur d\'assigner des patients à votre compte\n'
                                  '3. Votre ID de compte:',
                                  style: theme.textTheme.bodySmall,
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.surface,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: SelectableText(
                                    uid,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Les patients peuvent être assignés via le tableau de bord web (Gestion des patients).',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: grouped.entries.map((entry) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          entry.key,
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      ...entry.value.map((item) {
                        final patient = _patientsMap[item.patientId];
                        if (patient == null) return const SizedBox.shrink();
                        final patientName = '${patient.firstName} ${patient.lastName}'.trim();
                        final scheduled = item.scheduled;

                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            title: Text(patientName),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${_readingTypeLabel(scheduled.readingType)} · ${_formatDate(scheduled.scheduledDate)} ${_formatTime(scheduled.scheduledTime)}'),
                                if (scheduled.notes != null && scheduled.notes!.isNotEmpty)
                                  Text(
                                    scheduled.notes!,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                              ],
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.check_circle_outline),
                                  color: Colors.green,
                                  onPressed: () => _markAsCompleted(item),
                                  tooltip: 'Marquer comme complété',
                                ),
                                IconButton(
                                  icon: const Icon(Icons.cancel_outlined),
                                  color: Colors.orange,
                                  onPressed: () => _markAsMissed(item),
                                  tooltip: 'Marquer comme manqué',
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                      const SizedBox(height: 24),
                    ],
                  );
                }).toList(),
              ),
      ),
    );
  }
}
