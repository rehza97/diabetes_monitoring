import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/patient.dart';
import 'firestore_paths.dart';

Future<Patient?> getPatient(String patientId) async {
  final ref = patientRef(patientId);
  final snap = await ref.get();
  if (!snap.exists || snap.data() == null) return null;
  return snap.data();
}

/// Query patients. [build] receives the base collection; add where/orderBy/limit
/// as needed (e.g. doctorId, nurseId, isActive).
Future<List<Patient>> queryPatients(
  Query<Patient> Function(Query<Patient> base) build,
) async {
  final base = patientsCollection();
  final q = build(base);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<String> createPatient(CreatePatientDto dto) async {
  final col = patientsCollectionRaw();
  final ref = col.doc();
  final clean = <String, dynamic>{};
  for (final e in dto.toMap().entries) {
    if (e.value != null) clean[e.key] = e.value;
  }
  clean['fileNumber'] = 'PAT-${DateTime.now().millisecondsSinceEpoch}';
  clean['isActive'] = true;
  clean['status'] = 'active';
  clean['createdAt'] = FieldValue.serverTimestamp();
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await ref.set(clean);
  return ref.id;
}

Future<void> updatePatient(String patientId, Map<String, dynamic> partial) async {
  final clean = <String, dynamic>{};
  for (final e in partial.entries) {
    if (e.value != null) clean[e.key] = e.value;
  }
  if (clean.isEmpty) return;
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await patientsCollectionRaw().doc(patientId).update(clean);
}
