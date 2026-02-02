import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/patient_document.dart';
import 'firestore_paths.dart';

Future<List<PatientDocument>> getPatientDocuments(String patientId) async {
  final q = patientDocumentsCollection(patientId)
      .orderBy('createdAt', descending: true);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<String> createPatientDocument(
  String patientId,
  CreatePatientDocumentDto dto,
  String uploadedById,
) async {
  final col = patientDocumentsCollectionRaw(patientId);
  final ref = col.doc();
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'uploadedById': uploadedById,
    'createdAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  return ref.id;
}
