import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

/// Setting. Firestore path: settings/{settingId}.
class Setting {
  Setting({
    required this.id,
    required this.key,
    required this.value,
    required this.category,
    required this.updatedById,
    required this.updatedAt,
    this.description,
  });

  final String id;
  final String key;
  final dynamic value;
  final SettingCategory category;
  final String updatedById;
  final Timestamp updatedAt;
  final String? description;

  static Setting fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    return Setting(
      id: snap.id,
      key: m['key'] as String? ?? '',
      value: m['value'],
      category: SettingCategory.values.byName((m['category'] as String?) ?? 'general'),
      updatedById: m['updatedById'] as String? ?? '',
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      description: m['description'] as String?,
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'key': key,
      'value': value,
      'category': category.name,
      'updatedById': updatedById,
      'updatedAt': updatedAt,
      if (description != null) 'description': description,
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
