import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/patient_alert.dart';
import 'firestore_paths.dart';

Future<List<PatientAlert>> getPatientAlerts(
  String patientId, {
  bool? resolved,
  int? limitCount,
}) async {
  Query<PatientAlert> q = patientAlertsCollection(patientId);
  if (resolved != null) {
    q = q.where('isResolved', isEqualTo: resolved);
  }
  q = q.orderBy('createdAt', descending: true);
  if (limitCount != null) {
    q = q.limit(limitCount);
  }
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<String> createPatientAlert(
  String patientId,
  CreatePatientAlertDto dto,
) async {
  final col = patientAlertsCollectionRaw(patientId);
  final ref = col.doc();
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'isResolved': false,
    'acknowledgedBy': <String>[],
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  return ref.id;
}

Future<void> resolvePatientAlert(
  String patientId,
  String alertId,
  String resolvedById,
) async {
  await patientAlertsCollectionRaw(patientId).doc(alertId).update({
    'isResolved': true,
    'resolvedById': resolvedById,
    'resolvedAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  });
}

Future<void> acknowledgePatientAlert(
  String patientId,
  String alertId,
  String userId,
) async {
  final ref = patientAlertsCollectionRaw(patientId).doc(alertId);
  final snap = await ref.get();
  if (!snap.exists || snap.data() == null) {
    throw StateError('Alert not found');
  }
  final data = snap.data()!;
  final list = (data['acknowledgedBy'] as List<dynamic>?)?.cast<String>() ?? <String>[];
  if (!list.contains(userId)) {
    list.add(userId);
    await ref.update({
      'acknowledgedBy': list,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
