import 'package:flutter/material.dart';

import '../../../auth/app_auth_scope.dart';
import '../../../data/medical_note_repository.dart';
import '../../../data/user_repository.dart';
import '../../../models/enums.dart';
import '../../../models/medical_note.dart';

class QuickNoteForm extends StatefulWidget {
  const QuickNoteForm({
    super.key,
    required this.patientId,
    this.onSaved,
  });

  final String patientId;
  final VoidCallback? onSaved;

  static Future<void> show(
    BuildContext context, {
    required String patientId,
    VoidCallback? onSaved,
  }) {
    return showDialog(
      context: context,
      builder: (context) => QuickNoteForm(
        patientId: patientId,
        onSaved: onSaved,
      ),
    );
  }

  @override
  State<QuickNoteForm> createState() => _QuickNoteFormState();
}

class _QuickNoteFormState extends State<QuickNoteForm> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
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
        noteType: MedicalNoteType.observation, // Default to observation for quick notes
        content: _contentController.text.trim(),
        isImportant: false,
      );

      // Get nurse name
      String? nurseName;
      try {
        final user = await getUser(uid);
        if (user != null && (user.firstName.isNotEmpty || user.lastName.isNotEmpty)) {
          nurseName = '${user.firstName} ${user.lastName}'.trim();
        }
      } catch (e) {
        // Ignore error, nurseName will be null
      }

      await createMedicalNote(widget.patientId, dto, uid, nurseName);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Note ajoutée')),
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

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Note rapide'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: TextFormField(
            controller: _contentController,
            decoration: const InputDecoration(
              labelText: 'Contenu',
              border: OutlineInputBorder(),
              hintText: 'Saisissez votre note...',
            ),
            maxLines: 5,
            autofocus: true,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return null;
              return null;
            },
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
              : const Text('Ajouter'),
        ),
      ],
    );
  }
}
