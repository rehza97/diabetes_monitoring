import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/medication.dart';
import 'firestore_paths.dart';

Future<List<Medication>> getMedications(
  String patientId, [
  Query<Medication> Function(Query<Medication> base)? build,
]) async {
  var q = medicationsCollection(patientId).orderBy('createdAt', descending: true);
  if (build != null) q = build(q);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<String> createMedication(
  String patientId,
  CreateMedicationDto dto,
  String prescribedById, [
  String? prescribedByName,
]) async {
  final col = medicationsCollectionRaw(patientId);
  final ref = col.doc();
  final endDate = dto.endDate;
  final isActive = endDate == null ||
      endDate.millisecondsSinceEpoch > DateTime.now().millisecondsSinceEpoch;
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'prescribedById': prescribedById,
    if (prescribedByName != null) 'prescribedByName': prescribedByName,
    'isActive': isActive,
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  return ref.id;
}

Future<void> updateMedication(
  String patientId,
  String medicationId,
  Map<String, dynamic> partial,
) async {
  final clean = <String, dynamic>{};
  for (final e in partial.entries) {
    if (e.value != null) clean[e.key] = e.value;
  }
  if (clean.isEmpty) return;
  
  // Recalculate isActive if endDate is being updated
  if (clean.containsKey('endDate')) {
    final endDate = clean['endDate'] as Timestamp?;
    clean['isActive'] = endDate == null ||
        endDate.millisecondsSinceEpoch > DateTime.now().millisecondsSinceEpoch;
  }
  
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await medicationsCollectionRaw(patientId).doc(medicationId).update(clean);
}

Future<void> deleteMedication(String patientId, String medicationId) async {
  await medicationsCollectionRaw(patientId).doc(medicationId).delete();
}
