import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../../auth/app_auth_scope.dart';
import '../../../data/medication_repository.dart';
import '../../../data/user_repository.dart';
import '../../../models/medication.dart';

class MedicationForm extends StatefulWidget {
  const MedicationForm({
    super.key,
    required this.patientId,
    this.medication,
    this.onSaved,
  });

  final String patientId;
  final Medication? medication;
  final VoidCallback? onSaved;

  static Future<void> show(
    BuildContext context, {
    required String patientId,
    Medication? medication,
    VoidCallback? onSaved,
  }) {
    return showDialog(
      context: context,
      builder: (context) => MedicationForm(
        patientId: patientId,
        medication: medication,
        onSaved: onSaved,
      ),
    );
  }

  @override
  State<MedicationForm> createState() => _MedicationFormState();
}

class _MedicationFormState extends State<MedicationForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _dosageController = TextEditingController();
  final _frequencyController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime _startDate = DateTime.now();
  DateTime? _endDate;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.medication != null) {
      _nameController.text = widget.medication!.medicationName;
      _dosageController.text = widget.medication!.dosage;
      _frequencyController.text = widget.medication!.frequency;
      _notesController.text = widget.medication!.notes ?? '';
      _startDate = widget.medication!.startDate.toDate();
      _endDate = widget.medication!.endDate?.toDate();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _dosageController.dispose();
    _frequencyController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(BuildContext context, bool isStartDate) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStartDate ? _startDate : (_endDate ?? DateTime.now()),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        if (isStartDate) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final uid = AppAuthScope.of(context).userId;
    if (uid == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Non connecté')),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final dto = CreateMedicationDto(
        medicationName: _nameController.text.trim(),
        dosage: _dosageController.text.trim(),
        frequency: _frequencyController.text.trim(),
        startDate: Timestamp.fromDate(_startDate),
        endDate: _endDate != null ? Timestamp.fromDate(_endDate!) : null,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );

      // Get doctor name
      String? doctorName;
      try {
        final user = await getUser(uid);
        if (user != null && (user.firstName.isNotEmpty || user.lastName.isNotEmpty)) {
          doctorName = '${user.firstName} ${user.lastName}'.trim();
        }
      } catch (e) {
        // Ignore error, doctorName will be null
      }

      if (widget.medication == null) {
        // Create new medication
        await createMedication(widget.patientId, dto, uid, doctorName);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Médicament prescrit')),
        );
        widget.onSaved?.call();
        Navigator.pop(context);
      } else {
        // Update existing medication
        await updateMedication(widget.patientId, widget.medication!.id, {
          'medicationName': dto.medicationName,
          'dosage': dto.dosage,
          'frequency': dto.frequency,
          'startDate': dto.startDate,
          'endDate': dto.endDate,
          'notes': dto.notes,
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Médicament modifié')),
        );
        widget.onSaved?.call();
        Navigator.pop(context);
      }
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

  String _formatDate(DateTime d) {
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.medication == null ? 'Prescrire un médicament' : 'Modifier le médicament'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Nom du médicament *',
                  border: OutlineInputBorder(),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Le nom est requis';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _dosageController,
                decoration: const InputDecoration(
                  labelText: 'Dosage *',
                  hintText: 'Ex: 500mg',
                  border: OutlineInputBorder(),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Le dosage est requis';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _frequencyController,
                decoration: const InputDecoration(
                  labelText: 'Fréquence *',
                  hintText: 'Ex: Quotidien, Deux fois par jour',
                  border: OutlineInputBorder(),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'La fréquence est requise';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date de début *',
                        border: OutlineInputBorder(),
                      ),
                      child: InkWell(
                        onTap: () => _pickDate(context, true),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text(_formatDate(_startDate)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date de fin (optionnel)',
                        border: OutlineInputBorder(),
                      ),
                      child: InkWell(
                        onTap: () => _pickDate(context, false),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text(_endDate != null ? _formatDate(_endDate!) : 'Non définie'),
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
              : Text(widget.medication == null ? 'Prescrire' : 'Modifier'),
        ),
      ],
    );
  }
}
