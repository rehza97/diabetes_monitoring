import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/medical_note_repository.dart';
import '../../data/medication_repository.dart';
import '../../data/patient_alert_repository.dart';
import '../../data/patient_repository.dart';
import '../../data/reading_repository.dart';
import '../../models/enums.dart';
import '../../models/medical_note.dart';
import '../../models/medication.dart';
import '../../models/patient.dart';
import '../../models/patient_alert.dart';
import '../../models/reading.dart';
import '../../widgets/charts/reading_chart.dart';
import '../../utils/pdf_export.dart';
import 'package:printing/printing.dart';
import 'widgets/medical_note_form.dart';
import 'widgets/medication_form.dart';

class DoctorPatientDetailPage extends StatefulWidget {
  const DoctorPatientDetailPage({super.key, this.patientId});

  final String? patientId;

  @override
  State<DoctorPatientDetailPage> createState() =>
      _DoctorPatientDetailPageState();
}

class _DoctorPatientDetailPageState extends State<DoctorPatientDetailPage> {
  Patient? _patient;
  List<Reading> _readings = [];
  List<MedicalNote> _notes = [];
  List<Medication> _medications = [];
  List<PatientAlert> _alerts = [];
  bool _loading = true;
  String? _error;
  bool _hasLoaded = false;
  ChartPeriod _chartPeriod = ChartPeriod.month;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_hasLoaded) return;
    if (widget.patientId == null) {
      _hasLoaded = true;
      setState(() => _loading = false);
      return;
    }
    _hasLoaded = true;
    _load();
  }

  Future<void> _load() async {
    final patientId = widget.patientId;
    final uid = AppAuthScope.of(context).userId;
    if (patientId == null || uid == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final patient = await getPatient(patientId);
      if (!mounted) return;
      if (patient == null) {
        setState(() {
          _loading = false;
          _error = 'Patient introuvable';
        });
        return;
      }
      if (patient.doctorId != uid) {
        setState(() {
          _loading = false;
          _error = 'Vous n\'avez pas accès à ce patient';
        });
        return;
      }

      final results = await Future.wait([
        getReadings(patientId, (q) => q.limit(20)),
        getMedicalNotes(patientId, (q) => q.limit(20)),
        getMedications(patientId),
        getPatientAlerts(patientId, limitCount: 20),
      ]);

      if (!mounted) return;
      setState(() {
        _patient = patient;
        _readings = results[0] as List<Reading>;
        _notes = results[1] as List<MedicalNote>;
        _medications = results[2] as List<Medication>;
        _alerts = results[3] as List<PatientAlert>;
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
    final theme = Theme.of(context);
    final patientId = widget.patientId;

    if (patientId == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détail patient')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Patient non spécifié',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () => Navigator.maybePop(context),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Retour'),
              ),
            ],
          ),
        ),
      );
    }

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détail patient')),
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
        appBar: AppBar(title: const Text('Détail patient')),
        body: Center(
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
                  onPressed: _load,
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final p = _patient!;
    final name = '${p.firstName} ${p.lastName}'.trim();

    return Scaffold(
      appBar: AppBar(
        title: Text(name),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf),
            onPressed: () async {
              if (_patient == null) return;
              try {
                final pdfBytes = await exportPatientReportToPDF(
                  patient: _patient!,
                  readings: _readings,
                  notes: _notes,
                  medications: _medications,
                );
                if (!mounted) return;
                await Printing.layoutPdf(
                  onLayout: (format) async => pdfBytes,
                );
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Erreur lors de l\'export: $e')),
                );
              }
            },
            tooltip: 'Exporter PDF',
          ),
          TextButton(
            onPressed: () => Navigator.pushNamed(
              context,
              '/doctor/patient-edit',
              arguments: {'patientId': patientId},
            ),
            child: const Text('Modifier'),
          ),
          TextButton(
            onPressed: () => Navigator.pushNamed(
              context,
              '/doctor/record-reading',
              arguments: {'patientId': patientId},
            ),
            child: const Text('Nouvelle mesure'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildHeader(theme, p),
              const SizedBox(height: 24),
              _buildReadingsSection(theme),
              const SizedBox(height: 24),
              _buildChartsSection(theme),
              const SizedBox(height: 24),
              _buildNotesSection(theme),
              const SizedBox(height: 24),
              _buildMedicationsSection(theme),
              const SizedBox(height: 24),
              _buildAlertsSection(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme, Patient p) {
    final name = '${p.firstName} ${p.lastName}'.trim();
    final diabetesLabel = _diabetesTypeLabel(p.diabetesType);
    final statusLabel = _patientStatusLabel(p.status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (p.avatar != null && p.avatar!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: CircleAvatar(
                  radius: 32,
                  backgroundImage: NetworkImage(p.avatar!),
                ),
              ),
            Text(name, style: theme.textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              p.fileNumber,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.phone, size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    p.phone.trim().isNotEmpty ? p.phone : 'Non renseigné',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: p.phone.trim().isNotEmpty
                          ? null
                          : theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.calendar_today, size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Année de diagnostic : ${p.diagnosisDate.toDate().year}',
                    style: theme.textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
            if (p.bloodType != null && p.bloodType!.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.bloodtype, size: 16, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Groupe sanguin : ${p.bloodType}',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 4),
            Text('$diabetesLabel · $statusLabel',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                )),
            if (p.lastReadingDate != null) ...[
              const SizedBox(height: 8),
              Text(
                _lastReadingSummary(p),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _lastReadingSummary(Patient p) {
    final parts = <String>['Dernière mesure: ${_formatDate(p.lastReadingDate!)}'];
    if (p.lastReadingValue != null) {
      parts.add('– ${p.lastReadingValue!.toStringAsFixed(0)}');
    }
    if (p.lastReadingStatus != null && p.lastReadingStatus!.isNotEmpty) {
      parts.add(p.lastReadingStatus!);
    }
    return parts.join(' ');
  }

  String _diabetesTypeLabel(DiabetesType t) {
    switch (t) {
      case DiabetesType.type1:
        return 'Type 1';
      case DiabetesType.type2:
        return 'Type 2';
      case DiabetesType.gestational:
        return 'Gestationnel';
    }
  }

  String _patientStatusLabel(PatientStatus s) {
    switch (s) {
      case PatientStatus.active:
        return 'Actif';
      case PatientStatus.inactive:
        return 'Inactif';
      case PatientStatus.critical:
        return 'Critique';
      case PatientStatus.needsFollowup:
        return 'Suivi requis';
    }
  }

  Widget _buildReadingsSection(ThemeData theme) {
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
        if (_readings.isEmpty)
          _emptyCard(theme, 'Aucune mesure')
        else
          Card(
            child: Column(
              children: [
                for (final r in _readings) _readingTile(theme, r),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildChartsSection(ThemeData theme) {
    if (_readings.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Graphiques',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SegmentedButton<ChartPeriod>(
                  segments: const [
                    ButtonSegment(
                      value: ChartPeriod.week,
                      label: Text('Semaine'),
                    ),
                    ButtonSegment(
                      value: ChartPeriod.month,
                      label: Text('Mois'),
                    ),
                    ButtonSegment(
                      value: ChartPeriod.threeMonths,
                      label: Text('3 mois'),
                    ),
                  ],
                  selected: {_chartPeriod},
                  onSelectionChanged: (Set<ChartPeriod> newSelection) {
                    setState(() {
                      _chartPeriod = newSelection.first;
                    });
                  },
                ),
                const SizedBox(height: 16),
                ReadingChart(
                  readings: _readings,
                  period: _chartPeriod,
                  height: 250,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _readingTile(ThemeData theme, Reading r) {
    final unitStr = r.unit == ReadingUnit.mgDl ? 'mg/dL' : 'mmol/L';
    return ListTile(
      title: Text('${r.value.toStringAsFixed(0)} $unitStr'),
      subtitle: Text(_formatDate(r.date)),
      trailing: _statusChip(theme, r.status.name),
    );
  }

  Widget _buildNotesSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Notes médicales',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
            TextButton.icon(
              onPressed: () {
                if (_patient?.id != null) {
                  MedicalNoteForm.show(
                    context,
                    patientId: _patient!.id,
                    onSaved: () => _load(),
                  );
                }
              },
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Ajouter'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_notes.isEmpty)
          _emptyCard(theme, 'Aucune note')
        else
          Card(
            child: Column(
              children: [
                for (final n in _notes) _noteTile(theme, n),
              ],
            ),
          ),
      ],
    );
  }

  Widget _noteTile(ThemeData theme, MedicalNote n) {
    final preview = n.content.length > 80 ? '${n.content.substring(0, 80)}…' : n.content;
    return ListTile(
      title: Row(
        children: [
          Text(_noteTypeLabel(n.noteType)),
          if (n.isImportant) ...[
            const SizedBox(width: 8),
            Icon(Icons.star, size: 16, color: theme.colorScheme.tertiary),
          ],
        ],
      ),
      subtitle: Text(preview),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _formatDate(n.createdAt),
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit, size: 18),
            onPressed: () {
              if (_patient?.id != null) {
                MedicalNoteForm.show(
                  context,
                  patientId: _patient!.id,
                  note: n,
                  onSaved: () => _load(),
                );
              }
            },
            tooltip: 'Modifier',
          ),
        ],
      ),
      onTap: () {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(_noteTypeLabel(n.noteType)),
            content: SingleChildScrollView(
              child: Text(n.content),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Fermer'),
              ),
            ],
          ),
        );
      },
    );
  }

  String _noteTypeLabel(MedicalNoteType t) {
    switch (t) {
      case MedicalNoteType.diagnosis:
        return 'Diagnostic';
      case MedicalNoteType.prescription:
        return 'Ordonnance';
      case MedicalNoteType.observation:
        return 'Observation';
      case MedicalNoteType.followup:
        return 'Suivi';
    }
  }

  Widget _buildMedicationsSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Traitements',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
            TextButton.icon(
              onPressed: () {
                if (_patient?.id != null) {
                  MedicationForm.show(
                    context,
                    patientId: _patient!.id,
                    onSaved: () => _load(),
                  );
                }
              },
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Prescrire'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_medications.isEmpty)
          _emptyCard(theme, 'Aucun traitement')
        else
          Card(
            child: Column(
              children: [
                for (final m in _medications) _medicationTile(theme, m),
              ],
            ),
          ),
      ],
    );
  }

  Widget _medicationTile(ThemeData theme, Medication m) {
    return ListTile(
      title: Text(m.medicationName),
      subtitle: Text('${m.dosage} · ${m.frequency}'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (m.isActive)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Actif',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          else
            Text(
              'Terminé',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          IconButton(
            icon: const Icon(Icons.edit, size: 18),
            onPressed: () {
              if (_patient?.id != null) {
                MedicationForm.show(
                  context,
                  patientId: _patient!.id,
                  medication: m,
                  onSaved: () => _load(),
                );
              }
            },
            tooltip: 'Modifier',
          ),
        ],
      ),
    );
  }

  Widget _buildAlertsSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Alertes',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 12),
        if (_alerts.isEmpty)
          _emptyCard(theme, 'Aucune alerte')
        else
          Card(
            child: Column(
              children: [
                for (final a in _alerts) _alertTile(theme, a),
              ],
            ),
          ),
      ],
    );
  }

  Widget _alertTile(ThemeData theme, PatientAlert a) {
    return ListTile(
      title: Text(a.title),
      subtitle: Text(a.message),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            a.priority.name,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: 8),
          Icon(
            a.isResolved ? Icons.check_circle : Icons.warning_amber,
            size: 20,
            color: a.isResolved
                ? theme.colorScheme.primary
                : theme.colorScheme.error,
          ),
        ],
      ),
    );
  }

  Widget _emptyCard(ThemeData theme, String message) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Text(
            message,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
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
