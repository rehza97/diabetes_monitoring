import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/medical_note.dart';
import 'firestore_paths.dart';

Future<List<MedicalNote>> getMedicalNotes(
  String patientId, [
  Query<MedicalNote> Function(Query<MedicalNote> base)? build,
]) async {
  var q = medicalNotesCollection(patientId).orderBy('createdAt', descending: true);
  if (build != null) q = build(q);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<String> createMedicalNote(
  String patientId,
  CreateMedicalNoteDto dto,
  String doctorId, [
  String? doctorName,
]) async {
  final col = medicalNotesCollectionRaw(patientId);
  final ref = col.doc();
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'doctorId': doctorId,
    if (doctorName != null) 'doctorName': doctorName,
    'isImportant': dto.isImportant ?? false,
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  return ref.id;
}

Future<void> updateMedicalNote(
  String patientId,
  String noteId,
  Map<String, dynamic> partial,
) async {
  final clean = <String, dynamic>{};
  for (final e in partial.entries) {
    if (e.value != null) clean[e.key] = e.value;
  }
  if (clean.isEmpty) return;
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await medicalNotesCollectionRaw(patientId).doc(noteId).update(clean);
}

Future<void> deleteMedicalNote(String patientId, String noteId) async {
  await medicalNotesCollectionRaw(patientId).doc(noteId).delete();
}
