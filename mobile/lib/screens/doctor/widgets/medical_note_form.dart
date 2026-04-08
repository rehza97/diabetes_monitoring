import 'package:flutter/material.dart';

import '../../../auth/app_auth_scope.dart';
import '../../../data/medical_note_repository.dart';
import '../../../data/user_repository.dart';
import '../../../models/enums.dart';
import '../../../models/medical_note.dart';

class MedicalNoteForm extends StatefulWidget {
  const MedicalNoteForm({
    super.key,
    required this.patientId,
    this.note,
    this.onSaved,
  });

  final String patientId;
  final MedicalNote? note;
  final VoidCallback? onSaved;

  static Future<void> show(
    BuildContext context, {
    required String patientId,
    MedicalNote? note,
    VoidCallback? onSaved,
  }) {
    return showDialog(
      context: context,
      builder: (context) => MedicalNoteForm(
        patientId: patientId,
        note: note,
        onSaved: onSaved,
      ),
    );
  }

  @override
  State<MedicalNoteForm> createState() => _MedicalNoteFormState();
}

class _MedicalNoteFormState extends State<MedicalNoteForm> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  MedicalNoteType _noteType = MedicalNoteType.observation;
  bool _isImportant = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.note != null) {
      _contentController.text = widget.note!.content;
      _noteType = widget.note!.noteType;
      _isImportant = widget.note!.isImportant;
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
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
      final dto = CreateMedicalNoteDto(
        noteType: _noteType,
        content: _contentController.text.trim(),
        isImportant: _isImportant,
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

      if (widget.note == null) {
        // Create new note
        await createMedicalNote(widget.patientId, dto, uid, doctorName);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Note créée')),
        );
        widget.onSaved?.call();
        Navigator.pop(context);
      } else {
        // Update existing note
        await updateMedicalNote(widget.patientId, widget.note!.id, {
          'noteType': dto.noteType.name,
          'content': dto.content,
          'isImportant': dto.isImportant ?? false,
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Note modifiée')),
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

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.note == null ? 'Ajouter une note' : 'Modifier la note'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DropdownButtonFormField<MedicalNoteType>(
                value: _noteType,
                decoration: const InputDecoration(
                  labelText: 'Type de note',
                  border: OutlineInputBorder(),
                ),
                items: MedicalNoteType.values.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(_noteTypeLabel(type)),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _noteType = value);
                  }
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _contentController,
                decoration: const InputDecoration(
                  labelText: 'Contenu',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
                maxLines: 6,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null;
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                title: const Text('Note importante'),
                value: _isImportant,
                onChanged: (value) {
                  setState(() => _isImportant = value ?? false);
                },
                controlAffinity: ListTileControlAffinity.leading,
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
              : Text(widget.note == null ? 'Enregistrer' : 'Modifier'),
        ),
      ],
    );
  }
}
