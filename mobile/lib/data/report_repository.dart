import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/report.dart';
import 'firestore_paths.dart';

Future<Report?> getReport(String reportId) async {
  final ref = reportsCollection().doc(reportId);
  final snap = await ref.get();
  if (!snap.exists || snap.data() == null) return null;
  return snap.data();
}

Future<List<Report>> queryReports(
  Query<Report> Function(Query<Report> base) build,
) async {
  final base = reportsCollection();
  final q = build(base);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<String> createReport(CreateReportDto dto, String createdById) async {
  final col = reportsCollectionRaw();
  final ref = col.doc();
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'createdById': createdById,
    'isScheduled': dto.isScheduled ?? false,
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  return ref.id;
}

Future<void> updateReport(String reportId, Map<String, dynamic> partial) async {
  final clean = <String, dynamic>{};
  for (final e in partial.entries) {
    if (e.value != null) clean[e.key] = e.value;
  }
  if (clean.isEmpty) return;
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await reportsCollectionRaw().doc(reportId).update(clean);
}

Future<void> deleteReport(String reportId) async {
  await reportsCollectionRaw().doc(reportId).delete();
}
