import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../../auth/app_auth_scope.dart';
import '../../../data/patient_repository.dart';
import '../../../data/scheduled_reading_repository.dart';
import '../../../models/enums.dart';
import '../../../models/patient.dart';
import '../../../models/scheduled_reading.dart';

class ScheduledReadingForm extends StatefulWidget {
  const ScheduledReadingForm({
    super.key,
    this.onSaved,
  });

  final VoidCallback? onSaved;

  @override
  State<ScheduledReadingForm> createState() => _ScheduledReadingFormState();
}

class _ScheduledReadingFormState extends State<ScheduledReadingForm> {
  final _formKey = GlobalKey<FormState>();
  List<Patient> _patients = [];
  String? _selectedPatientId;
  ReadingType _readingType = ReadingType.random;
  DateTime _scheduledDate = DateTime.now();
  TimeOfDay _scheduledTime = TimeOfDay.now();
  final _notesController = TextEditingController();
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_loading) {
      _loadPatients();
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadPatients() async {
    final uid = AppAuthScope.of(context).userId;
    debugPrint('🔍 [ScheduledReadingForm] Loading patients for user: $uid');
    
    if (uid == null) {
      debugPrint('❌ [ScheduledReadingForm] User ID is null - not authenticated');
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Non connecté';
      });
      return;
    }

    try {
      // Try to get ALL patients to show in logs (may fail due to permissions)
      debugPrint('📋 [ScheduledReadingForm] Attempting to fetch ALL patients for logging...');
      try {
        final allPatients = await queryPatients((q) => q.where('isActive', isEqualTo: true))
            .timeout(
              const Duration(seconds: 10),
              onTimeout: () {
                throw TimeoutException('Timeout fetching all patients');
              },
            );
        
        debugPrint('📊 [ScheduledReadingForm] Total active patients: ${allPatients.length}');
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
        debugPrint('⚠️ [ScheduledReadingForm] Could not fetch all patients (permission denied or error): $e');
        debugPrint('   This is expected for nurses - they can only see assigned patients');
      }
      
      // Now query only assigned patients (this should work)
      debugPrint('🔍 [ScheduledReadingForm] Filtering patients assigned to current user ($uid)...');
      // Query without orderBy to avoid composite index requirement
      // We'll sort in memory instead
      // Add timeout to prevent infinite hanging (30 seconds)
      final patients = await queryPatients((q) => q
          .where('nurseId', isEqualTo: uid)
          .where('isActive', isEqualTo: true))
          .timeout(
            const Duration(seconds: 30),
            onTimeout: () {
              throw TimeoutException('Le chargement a pris trop de temps. Vérifiez votre connexion internet.');
            },
          );
      
      debugPrint('✅ [ScheduledReadingForm] Found ${patients.length} patients assigned to current user');
      for (final patient in patients) {
        debugPrint('  ✓ ${patient.firstName} ${patient.lastName} (${patient.fileNumber}) - ID: ${patient.id}');
      }

      // Sort by createdAt in memory (newest first)
      patients.sort((a, b) {
        final aTime = a.createdAt.toDate();
        final bTime = b.createdAt.toDate();
        return bTime.compareTo(aTime);
      });

      if (!mounted) return;
      setState(() {
        _patients = patients;
        _loading = false;
        _error = null;
        if (patients.isNotEmpty) {
          _selectedPatientId = patients.first.id;
        }
      });
    } on TimeoutException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Erreur lors du chargement des patients: ${e.toString()}';
      });
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _scheduledDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _scheduledDate = picked);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _scheduledTime,
    );
    if (picked != null) {
      setState(() => _scheduledTime = picked);
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

  String _formatDate(DateTime d) {
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  String _formatTime(TimeOfDay t) {
    return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final patientId = _selectedPatientId ?? (_patients.isNotEmpty ? _patients.first.id : null);
    if (patientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner un patient')),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final dateTs = Timestamp.fromDate(DateTime(
        _scheduledDate.year,
        _scheduledDate.month,
        _scheduledDate.day,
      ));
      final timeStr = _formatTime(_scheduledTime);

      final dto = CreateScheduledReadingDto(
        readingType: _readingType,
        scheduledDate: dateTs,
        scheduledTime: timeStr,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );

      await createScheduledReading(patientId, dto);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Planning créé')),
      );
      widget.onSaved?.call();
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  static Future<void> show(
    BuildContext context, {
    VoidCallback? onSaved,
  }) {
    return showDialog(
      context: context,
      builder: (context) => ScheduledReadingForm(onSaved: onSaved),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return AlertDialog(
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Chargement...'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
        ],
      );
    }

    if (_error != null) {
      return AlertDialog(
        title: const Text('Erreur'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
          FilledButton(
            onPressed: () {
              setState(() {
                _loading = true;
                _error = null;
              });
              _loadPatients();
            },
            child: const Text('Réessayer'),
          ),
        ],
      );
    }

    return AlertDialog(
      title: const Text('Nouveau planning'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DropdownButtonFormField<String>(
                value: _selectedPatientId,
                decoration: const InputDecoration(
                  labelText: 'Patient',
                  border: OutlineInputBorder(),
                ),
                items: _patients.map((p) {
                  final name = '${p.firstName} ${p.lastName}'.trim().isEmpty ? p.fileNumber : '${p.firstName} ${p.lastName}'.trim();
                  return DropdownMenuItem(
                    value: p.id,
                    child: Text(name),
                  );
                }).toList(),
                onChanged: (value) => setState(() => _selectedPatientId = value),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<ReadingType>(
                value: _readingType,
                decoration: const InputDecoration(
                  labelText: 'Type de mesure',
                  border: OutlineInputBorder(),
                ),
                items: ReadingType.values.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(_readingTypeLabel(type)),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _readingType = value);
                  }
                },
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date',
                        border: OutlineInputBorder(),
                      ),
                      child: InkWell(
                        onTap: _pickDate,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text(_formatDate(_scheduledDate)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Heure',
                        border: OutlineInputBorder(),
                      ),
                      child: InkWell(
                        onTap: _pickTime,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text(_formatTime(_scheduledTime)),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Notes (optionnel)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.pop(context),
          child: const Text('Annuler'),
        ),
        FilledButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Créer'),
        ),
      ],
    );
  }
}
