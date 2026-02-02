import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

class CreateMedicalNoteDto {
  CreateMedicalNoteDto({
    required this.noteType,
    required this.content,
    this.attachments,
    this.isImportant,
    this.tags,
  });

  final MedicalNoteType noteType;
  final String content;
  final List<String>? attachments;
  final bool? isImportant;
  final List<String>? tags;

  Map<String, dynamic> toMap() => {
        'noteType': noteType.name,
        'content': content,
        if (attachments != null) 'attachments': attachments,
        if (isImportant != null) 'isImportant': isImportant,
        if (tags != null) 'tags': tags,
      };
}

/// Medical note. Firestore path: patients/{patientId}/medicalNotes/{noteId}.
class MedicalNote {
  MedicalNote({
    required this.id,
    required this.doctorId,
    required this.noteType,
    required this.content,
    required this.isImportant,
    required this.createdAt,
    required this.updatedAt,
    this.doctorName,
    this.attachments,
    this.tags,
  });

  final String id;
  final String doctorId;
  final MedicalNoteType noteType;
  final String content;
  final bool isImportant;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final String? doctorName;
  final List<String>? attachments;
  final List<String>? tags;

  static MedicalNote fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    return MedicalNote(
      id: snap.id,
      doctorId: m['doctorId'] as String? ?? '',
      noteType: MedicalNoteType.values.byName((m['noteType'] as String?) ?? 'observation'),
      content: m['content'] as String? ?? '',
      isImportant: m['isImportant'] as bool? ?? false,
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      doctorName: m['doctorName'] as String?,
      attachments: (m['attachments'] as List<dynamic>?)?.cast<String>(),
      tags: (m['tags'] as List<dynamic>?)?.cast<String>(),
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'doctorId': doctorId,
      'noteType': noteType.name,
      'content': content,
      'isImportant': isImportant,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (doctorName != null) 'doctorName': doctorName,
      if (attachments != null) 'attachments': attachments,
      if (tags != null) 'tags': tags,
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
