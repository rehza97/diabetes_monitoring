import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/enums.dart';
import '../models/reading.dart';
import 'firestore_paths.dart';
import 'patient_repository.dart';
import 'settings_repository.dart';

ReadingUnit _unitFrom(dynamic u) {
  if (u is ReadingUnit) return u;
  if (u is String) return readingUnitFromFirestore(u);
  return ReadingUnit.mgDl;
}

Future<List<Reading>> getReadings(
  String patientId, [
  Query<Reading> Function(Query<Reading> base)? build,
]) async {
  var q = readingsCollection(patientId).orderBy('date', descending: true);
  if (build != null) q = build(q);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<String> createReading(
  String patientId,
  CreateReadingDto dto,
  String recordedById, [
  String? recordedByName,
]) async {
  final thresholds = await getMeasurementThresholds();
  final status = calculateReadingStatus(dto.value, dto.unit, thresholds);
  final col = readingsCollectionRaw(patientId);
  final ref = col.doc();
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'recordedById': recordedById,
    if (recordedByName != null) 'recordedByName': recordedByName,
    'status': status.name,
    'isVerified': false,
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  await updatePatient(patientId, {
    'lastReadingDate': dto.date,
    'lastReadingValue': dto.value,
    'lastReadingStatus': status.name,
  });
  return ref.id;
}

Future<void> updateReading(
  String patientId,
  String readingId,
  Map<String, dynamic> partial,
) async {
  final clean = <String, dynamic>{...partial};
  if (clean.isEmpty) return;
  final value = partial['value'];
  final unit = partial['unit'];
  if (value != null && unit != null) {
    final thresholds = await getMeasurementThresholds();
    clean['status'] = calculateReadingStatus(
      (value as num).toDouble(),
      _unitFrom(unit),
      thresholds,
    ).name;
  }
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await readingsCollectionRaw(patientId).doc(readingId).update(clean);
  final date = partial['date'];
  if (date != null && date is Timestamp) {
    final patient = await getPatient(patientId);
    if (patient != null &&
        patient.lastReadingDate != null &&
        date.millisecondsSinceEpoch >= patient.lastReadingDate!.millisecondsSinceEpoch) {
      await updatePatient(patientId, {
        'lastReadingDate': date,
        'lastReadingValue': partial['value'],
        'lastReadingStatus': clean['status'],
      });
    }
  }
}

Future<void> deleteReading(String patientId, String readingId) async {
  await readingsCollectionRaw(patientId).doc(readingId).delete();
}

/// Collection-group query: all readings across patients. [build] can add
/// where/limit (e.g. where('recordedById', isEqualTo: uid)).
Future<List<ReadingWithPatientId>> queryAllReadings([
  Query<Reading> Function(Query<Reading> base)? build,
]) async {
  var q = readingsCollectionGroup().orderBy('date', descending: true);
  if (build != null) q = build(q);
  final snap = await q.get();
  return snap.docs.map((d) {
    final pathParts = d.reference.path.split('/');
    final patientId = pathParts.length >= 2 ? pathParts[1] : '';
    return ReadingWithPatientId(reading: d.data(), patientId: patientId);
  }).toList();
}
