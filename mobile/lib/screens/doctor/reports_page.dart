import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/patient_repository.dart';
import '../../data/report_repository.dart';
import '../../data/reading_repository.dart';
import '../../data/medical_note_repository.dart';
import '../../data/medication_repository.dart';
import '../../models/enums.dart';
import '../../models/patient.dart';
import '../../models/reading.dart';
import '../../models/report.dart';
import '../../utils/pdf_export.dart';
import 'package:printing/printing.dart';

class DoctorReportsPage extends StatefulWidget {
  const DoctorReportsPage({super.key});

  @override
  State<DoctorReportsPage> createState() => _DoctorReportsPageState();
}

class _DoctorReportsPageState extends State<DoctorReportsPage> {
  List<Report> _reports = [];
  List<Patient> _patients = [];
  bool _loading = true;
  String? _error;
  bool _hasLoaded = false;
  bool _saving = false;

  String _searchQuery = '';
  final _nameController = TextEditingController();
  ReportType _reportType = ReportType.patientSummary;
  DateTime? _dateFrom;
  DateTime? _dateTo;
  final Set<String> _selectedPatientIds = {};

  @override
  void dispose() {
    _nameController.dispose();
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
      final reports = await queryReports((q) => q
          .where('createdById', isEqualTo: uid)
          .orderBy('createdAt', descending: true));
      final patients = await queryPatients((q) => q
          .where('doctorId', isEqualTo: uid)
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true));

      if (!mounted) return;
      setState(() {
        _reports = reports;
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

  List<Report> get _filteredReports {
    if (_searchQuery.trim().isEmpty) return _reports;
    final q = _searchQuery.trim().toLowerCase();
    return _reports.where((r) => r.name.toLowerCase().contains(q)).toList();
  }

  String _reportTypeLabel(ReportType t) {
    switch (t) {
      case ReportType.patientSummary:
        return 'Rapport patient';
      case ReportType.periodSummary:
        return 'Rapport période';
      case ReportType.comparison:
        return 'Comparatif';
      case ReportType.custom:
        return 'Personnalisé';
    }
  }

  String _formatDate(Timestamp ts) {
    final d = ts.toDate();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: now,
      initialDateRange: _dateFrom != null && _dateTo != null
          ? DateTimeRange(start: _dateFrom!, end: _dateTo!)
          : DateTimeRange(start: now.subtract(const Duration(days: 30)), end: now),
    );
    if (picked != null && mounted) {
      setState(() {
        _dateFrom = picked.start;
        _dateTo = picked.end;
      });
    }
  }

  Future<void> _saveReport() async {
    final uid = AppAuthScope.of(context).userId;
    if (uid == null) return;

    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nom du rapport requis')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final filters = ReportFilter(
        patientIds: _selectedPatientIds.isEmpty ? null : _selectedPatientIds.toList(),
        dateFrom: _dateFrom != null ? Timestamp.fromDate(_dateFrom!) : null,
        dateTo: _dateTo != null ? Timestamp.fromDate(_dateTo!) : null,
      );
      final dto = CreateReportDto(
        name: name,
        type: _reportType,
        filters: filters,
        isScheduled: false,
      );
      await createReport(dto, uid);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rapport sauvegardé')),
      );
      _nameController.clear();
      setState(() {
        _dateFrom = null;
        _dateTo = null;
        _selectedPatientIds.clear();
      });
      await _load(uid);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteReport(String reportId) async {
    try {
      await deleteReport(reportId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rapport supprimé')),
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

  void _runReport(Report r) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Génération non implémentée')),
    );
  }

  Future<void> _generatePDF(Report report) async {
    try {
      // Show loading
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Génération du PDF...'),
                ],
              ),
            ),
          ),
        ),
      );

      // Fetch data based on report filters
      final patientIds = report.filters.patientIds ?? [];
      if (patientIds.isEmpty) {
        if (!mounted) return;
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Aucun patient sélectionné dans le rapport')),
        );
        return;
      }

      // For now, generate PDF for first patient (can be enhanced to generate for all)
      final patientId = patientIds.first;
      final patient = await getPatient(patientId);
      if (patient == null) {
        if (!mounted) return;
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Patient introuvable')),
        );
        return;
      }

      // Fetch readings with filters
      List<Reading> readings = await getReadings(patientId, (q) {
        var query = q;
        if (report.filters.dateFrom != null) {
          query = query.where('date', isGreaterThanOrEqualTo: report.filters.dateFrom!);
        }
        if (report.filters.dateTo != null) {
          query = query.where('date', isLessThanOrEqualTo: report.filters.dateTo!);
        }
        return query.orderBy('date', descending: true).limit(100);
      });

      // Fetch notes and medications
      final notes = await getMedicalNotes(patientId, (q) => q.limit(50));
      final medications = await getMedications(patientId);

      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog

      // Generate PDF
      final pdfBytes = await exportPatientReportToPDF(
        patient: patient,
        readings: readings,
        notes: notes,
        medications: medications,
      );

      if (!mounted) return;

      // Show PDF
      await Printing.layoutPdf(
        onLayout: (format) async => pdfBytes,
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog if still open
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur lors de la génération: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final uid = AppAuthScope.of(context).userId;

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
            _buildSavedSection(theme),
            const SizedBox(height: 32),
            _buildCreateSection(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Rapports sauvegardés',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          decoration: InputDecoration(
            hintText: 'Rechercher par nom',
            prefixIcon: const Icon(Icons.search),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            filled: true,
          ),
          onChanged: (v) => setState(() => _searchQuery = v),
        ),
        const SizedBox(height: 12),
        _buildReportsList(theme),
      ],
    );
  }

  Widget _buildReportsList(ThemeData theme) {
    final list = _filteredReports;
    if (list.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Text(
              'Aucun rapport sauvegardé',
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
          for (final r in list)
            ListTile(
              title: Text(r.name),
              subtitle: Text('${_reportTypeLabel(r.type)} · ${_formatDate(r.createdAt)}'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.picture_as_pdf),
                    onPressed: () => _generatePDF(r),
                    tooltip: 'Générer PDF',
                  ),
                  TextButton(
                    onPressed: () => _runReport(r),
                    child: const Text('Exécuter'),
                  ),
                  IconButton(
                    icon: Icon(Icons.delete_outline, color: theme.colorScheme.error),
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Supprimer le rapport'),
                          content: Text('Supprimer « ${r.name} » ?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: const Text('Annuler'),
                            ),
                            FilledButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              child: const Text('Supprimer'),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) await _deleteReport(r.id);
                    },
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCreateSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Créer un rapport',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            labelText: 'Nom du rapport *',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        InputDecorator(
          decoration: const InputDecoration(
            labelText: 'Type',
            border: OutlineInputBorder(),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<ReportType>(
              value: _reportType,
              isExpanded: true,
              items: ReportType.values
                  .map((t) => DropdownMenuItem<ReportType>(
                        value: t,
                        child: Text(_reportTypeLabel(t)),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _reportType = v ?? ReportType.patientSummary),
            ),
          ),
        ),
        const SizedBox(height: 16),
        InkWell(
          onTap: _pickDateRange,
          child: InputDecorator(
            decoration: const InputDecoration(
              labelText: 'Période (optionnel)',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.calendar_today),
            ),
            child: Text(
              _dateFrom != null && _dateTo != null
                  ? '${_formatDate(Timestamp.fromDate(_dateFrom!))} – ${_formatDate(Timestamp.fromDate(_dateTo!))}'
                  : 'Sélectionner une période',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: _dateFrom != null ? theme.colorScheme.onSurface : theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Patients (optionnel)',
          style: theme.textTheme.labelLarge,
        ),
        const SizedBox(height: 8),
        if (_patients.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(
              'Aucun patient',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          )
        else
          Card(
            child: Column(
              children: [
                for (final p in _patients)
                  CheckboxListTile(
                    title: Text('${p.firstName} ${p.lastName}'.trim().isEmpty ? p.fileNumber : '${p.firstName} ${p.lastName}'.trim()),
                    value: _selectedPatientIds.contains(p.id),
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          _selectedPatientIds.add(p.id);
                        } else {
                          _selectedPatientIds.remove(p.id);
                        }
                      });
                    },
                  ),
              ],
            ),
          ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _saving ? null : _saveReport,
          child: _saving
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Sauvegarder le rapport'),
        ),
      ],
    );
  }
}
