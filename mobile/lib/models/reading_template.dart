import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

class CreateReadingTemplateDto {
  CreateReadingTemplateDto({
    required this.name,
    required this.readingTypes,
    this.defaultNotes,
    this.isDefault,
  });

  final String name;
  final List<ReadingType> readingTypes;
  final String? defaultNotes;
  final bool? isDefault;

  Map<String, dynamic> toMap() => {
        'name': name,
        'readingTypes': readingTypes.map(readingTypeToFirestore).toList(),
        if (defaultNotes != null) 'defaultNotes': defaultNotes,
        if (isDefault != null) 'isDefault': isDefault,
      };
}

/// Reading template. Firestore path: readingTemplates/{templateId}.
class ReadingTemplate {
  ReadingTemplate({
    required this.id,
    required this.name,
    required this.readingTypes,
    required this.createdById,
    required this.isDefault,
    required this.createdAt,
    required this.updatedAt,
    this.defaultNotes,
  });

  final String id;
  final String name;
  final List<ReadingType> readingTypes;
  final String createdById;
  final bool isDefault;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final String? defaultNotes;

  static ReadingTemplate fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    final types = m['readingTypes'];
    List<ReadingType> list = [];
    if (types is List) {
      for (final t in types) {
        if (t is String) list.add(readingTypeFromFirestore(t));
      }
    }
    return ReadingTemplate(
      id: snap.id,
      name: m['name'] as String? ?? '',
      readingTypes: list.isEmpty ? [ReadingType.random] : list,
      createdById: m['createdById'] as String? ?? '',
      isDefault: m['isDefault'] as bool? ?? false,
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      defaultNotes: m['defaultNotes'] as String?,
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'name': name,
      'readingTypes': readingTypes.map(readingTypeToFirestore).toList(),
      'createdById': createdById,
      'isDefault': isDefault,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (defaultNotes != null) 'defaultNotes': defaultNotes,
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
