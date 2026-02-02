import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/scheduled_reading.dart';
import 'firestore_paths.dart';

Future<String> createScheduledReading(
  String patientId,
  CreateScheduledReadingDto dto,
) async {
  final col = scheduledReadingsCollectionRaw(patientId);
  final ref = col.doc();
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'status': 'pending',
    'reminderSent': false,
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  return ref.id;
}

Future<List<ScheduledReading>> getScheduledReadings(
  String patientId, [
  Query<ScheduledReading> Function(Query<ScheduledReading> base)? build,
]) async {
  var q = scheduledReadingsCollection(patientId).orderBy('scheduledDate', descending: false);
  if (build != null) q = build(q);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<void> updateScheduledReading(
  String patientId,
  String scheduledReadingId,
  Map<String, dynamic> partial,
) async {
  final clean = <String, dynamic>{};
  for (final e in partial.entries) {
    if (e.value != null) clean[e.key] = e.value;
  }
  if (clean.isEmpty) return;
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await scheduledReadingsCollectionRaw(patientId).doc(scheduledReadingId).update(clean);
}

Future<void> deleteScheduledReading(String patientId, String scheduledReadingId) async {
  await scheduledReadingsCollectionRaw(patientId).doc(scheduledReadingId).delete();
}
