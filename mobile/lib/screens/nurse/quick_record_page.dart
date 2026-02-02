import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/patient_repository.dart';
import '../../data/reading_repository.dart';
import '../../data/reading_template_repository.dart';
import '../../data/user_repository.dart';
import '../../models/enums.dart';
import '../../models/patient.dart';
import '../../models/reading.dart';
import '../../models/reading_template.dart';
import '../../models/user.dart';
import '../../utils/validators.dart';

class NurseQuickRecordPage extends StatefulWidget {
  const NurseQuickRecordPage({super.key, this.patientId});

  final String? patientId;

  @override
  State<NurseQuickRecordPage> createState() => _NurseQuickRecordPageState();
}

class _NurseQuickRecordPageState extends State<NurseQuickRecordPage> {
  final _formKey = GlobalKey<FormState>();
  final _valueController = TextEditingController();
  final _timeController = TextEditingController();
  final _notesController = TextEditingController();

  List<Patient> _patients = [];
  List<ReadingTemplate> _templates = [];
  bool _loading = true;
  String? _error;
  bool _hasLoaded = false;
  bool _submitting = false;

  String? _selectedPatientId;
  Set<String> _selectedPatientIds = {};
  String? _selectedTemplateId;
  ReadingUnit _unit = ReadingUnit.mgDl;
  ReadingType _readingType = ReadingType.random;
  DateTime _date = DateTime.now();
  bool _multiPatientMode = false;

  static const _noneTemplateId = 'none';

  @override
  void initState() {
    super.initState();
    _timeController.text = _formatTime(DateTime.now());
  }

  @override
  void dispose() {
    _valueController.dispose();
    _timeController.dispose();
    _notesController.dispose();
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
      final templates = await getReadingTemplates(uid);

      if (!mounted) return;

      final contextPatientId = widget.patientId;
      String? initialPatient;
      if (contextPatientId != null) {
        final inList = patients.any((p) => p.id == contextPatientId);
        if (!inList) {
          setState(() {
            _loading = false;
            _error = 'Patient introuvable ou non assigné';
          });
          return;
        }
        initialPatient = contextPatientId;
      } else if (patients.isNotEmpty) {
        initialPatient = patients.first.id;
      }

      setState(() {
        _selectedPatientId = initialPatient;
        _patients = patients;
        _templates = templates;
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

  String _formatTime(DateTime d) {
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }

  void _onTemplateSelected(String? id) {
    if (id == null || id == _noneTemplateId) return;
    ReadingTemplate? t;
    for (final x in _templates) {
      if (x.id == id) {
        t = x;
        break;
      }
    }
    if (t == null) return;
    final template = t;
    setState(() {
      _selectedTemplateId = id;
      if (template.readingTypes.isNotEmpty) _readingType = template.readingTypes.first;
      _notesController.text = template.defaultNotes ?? '';
    });
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null && mounted) setState(() => _date = picked);
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final uid = AppAuthScope.of(context).userId;
    if (uid == null) return;

    // Get patient IDs based on mode
    List<String> patientIds = [];
    if (_multiPatientMode) {
      if (_selectedPatientIds.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Veuillez sélectionner au moins un patient')),
        );
        return;
      }
      patientIds = _selectedPatientIds.toList();
    } else {
      final patientId = _selectedPatientId ?? widget.patientId;
      if (patientId == null || patientId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Veuillez sélectionner un patient')),
        );
        return;
      }
      patientIds = [patientId];
    }

    final value = double.tryParse(_valueController.text.trim());
    if (value == null || value < 0 || value > 600) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Valeur entre 0 et 600')),
      );
      return;
    }

    final timeStr = _timeController.text.trim();
    if (!isValidTimeHHmm(timeStr)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Heure invalide (HH:mm)')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final dateTs = Timestamp.fromDate(DateTime(_date.year, _date.month, _date.day));
      User? user;
      try {
        user = await getUser(uid);
      } catch (_) {}
      final name = user != null ? '${user.firstName} ${user.lastName}'.trim() : null;
      final recordedByName = name != null && name.isNotEmpty ? name : null;

      final dto = CreateReadingDto(
        value: value,
        unit: _unit,
        readingType: _readingType,
        date: dateTs,
        time: timeStr,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );

      // Create reading for each selected patient
      int successCount = 0;
      int errorCount = 0;
      for (final patientId in patientIds) {
        try {
          await createReading(patientId, dto, uid, recordedByName);
          successCount++;
        } catch (e) {
          errorCount++;
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Erreur pour patient $patientId: $e')),
          );
        }
      }

      if (!mounted) return;

      if (successCount > 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _multiPatientMode
                  ? '$successCount mesure(s) créée(s)${errorCount > 0 ? ' ($errorCount erreur(s))' : ''}'
                  : 'Mesure créée',
            ),
          ),
        );
      }

      if (widget.patientId != null) {
        Navigator.pop(context);
      } else {
        _valueController.clear();
        _notesController.clear();
        _timeController.text = _formatTime(DateTime.now());
        setState(() {
          _date = DateTime.now();
          if (_multiPatientMode) {
            _selectedPatientIds.clear();
          }
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final uid = AppAuthScope.of(context).userId;
    final fromContext = widget.patientId != null;

    if (_loading) {
      final body = Center(
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
      if (fromContext) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Nouvelle mesure'),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: body,
        );
      }
      return body;
    }

    if (_error != null) {
      final body = Center(
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
      if (fromContext) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Nouvelle mesure'),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: body,
        );
      }
      return body;
    }

    final form = GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => FocusScope.of(context).unfocus(),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: IgnorePointer(
              ignoring: _submitting,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (!fromContext) ...[
                    SwitchListTile(
                      title: const Text('Enregistrement multiple'),
                      subtitle: const Text('Enregistrer la même mesure pour plusieurs patients'),
                      value: _multiPatientMode,
                      onChanged: (value) {
                        setState(() {
                          _multiPatientMode = value;
                          if (value) {
                            _selectedPatientId = null;
                          } else {
                            _selectedPatientIds.clear();
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 8),
                    if (!_multiPatientMode)
                      InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Patient *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedPatientId ?? (_patients.isNotEmpty ? _patients.first.id : null),
                            isExpanded: true,
                            hint: const Text('Sélectionner'),
                            items: _patients
                                .map((p) => DropdownMenuItem<String>(
                                      value: p.id,
                                      child: Text('${p.firstName} ${p.lastName}'.trim().isEmpty ? p.fileNumber : '${p.firstName} ${p.lastName}'.trim()),
                                    ))
                                .toList(),
                            onChanged: (v) => setState(() => _selectedPatientId = v),
                          ),
                        ),
                      )
                    else ...[
                      const Text(
                        'Sélectionner les patients:',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 8),
                      Card(
                        child: Column(
                          children: _patients.map((p) {
                            final name = '${p.firstName} ${p.lastName}'.trim().isEmpty ? p.fileNumber : '${p.firstName} ${p.lastName}'.trim();
                            return CheckboxListTile(
                              title: Text(name),
                              value: _selectedPatientIds.contains(p.id),
                              onChanged: (checked) {
                                setState(() {
                                  if (checked == true) {
                                    _selectedPatientIds.add(p.id);
                                  } else {
                                    _selectedPatientIds.remove(p.id);
                                  }
                                });
                              },
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                  ] else
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Patient',
                          border: OutlineInputBorder(),
                        ),
                        child: Text(
                          _patients
                                  .where((p) => p.id == widget.patientId)
                                  .map((p) => '${p.firstName} ${p.lastName}'.trim())
                                  .firstOrNull ??
                              (widget.patientId ?? ''),
                        ),
                      ),
                    ),
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Modèle (optionnel)',
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedTemplateId ?? _noneTemplateId,
                        isExpanded: true,
                        items: [
                          const DropdownMenuItem(value: _noneTemplateId, child: Text('Aucun')),
                          ..._templates.map((t) => DropdownMenuItem<String>(
                                value: t.id,
                                child: Text(t.name),
                              )),
                        ],
                        onChanged: (v) {
                          setState(() => _selectedTemplateId = v == _noneTemplateId ? null : v);
                          if (v != null && v != _noneTemplateId) _onTemplateSelected(v);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _valueController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Valeur *',
                      hintText: '0–600',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.analytics_outlined),
                    ),
                    validator: (v) {
                      final n = double.tryParse(v ?? '');
                      if (n == null) return 'Valeur requise.';
                      if (n < 0 || n > 600) return 'Entre 0 et 600.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Unité *',
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<ReadingUnit>(
                        value: _unit,
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(value: ReadingUnit.mgDl, child: Text('mg/dL')),
                          DropdownMenuItem(value: ReadingUnit.mmolL, child: Text('mmol/L')),
                        ],
                        onChanged: (v) => setState(() => _unit = v ?? ReadingUnit.mgDl),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Type *',
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<ReadingType>(
                        value: _readingType,
                        isExpanded: true,
                        items: ReadingType.values
                            .map((t) => DropdownMenuItem<ReadingType>(
                                  value: t,
                                  child: Text(_readingTypeLabel(t)),
                                ))
                            .toList(),
                        onChanged: (v) => setState(() => _readingType = v ?? ReadingType.random),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    onTap: _pickDate,
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(_formatDate(_date)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _timeController,
                    decoration: const InputDecoration(
                      labelText: 'Heure *',
                      hintText: 'HH:mm',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.access_time),
                    ),
                    validator: (v) =>
                        isValidTimeHHmm(v) ? null : 'Format HH:mm requis.',
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Notes (optionnel)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Enregistrer la mesure'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    if (fromContext) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Nouvelle mesure'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: form,
      );
    }
    return form;
  }

  String _formatDate(DateTime d) {
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  String _readingTypeLabel(ReadingType t) {
    switch (t) {
      case ReadingType.fasting:
        return 'À jeun';
      case ReadingType.postBreakfast:
        return 'Après petit-déjeuner';
      case ReadingType.preLunch:
        return 'Avant déjeuner';
      case ReadingType.postLunch:
        return 'Après déjeuner';
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
}
