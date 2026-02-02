import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/reading_template.dart';
import 'firestore_paths.dart';

Future<List<ReadingTemplate>> getReadingTemplates([String? createdById]) async {
  Query<ReadingTemplate> q = readingTemplatesCollection();
  if (createdById != null) {
    q = q.where('createdById', isEqualTo: createdById);
  }
  q = q.orderBy('createdAt', descending: true);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<String> createReadingTemplate(
  CreateReadingTemplateDto dto,
  String createdById,
) async {
  final col = readingTemplatesCollectionRaw();
  final ref = col.doc();
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'createdById': createdById,
    'isDefault': dto.isDefault ?? false,
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  return ref.id;
}
