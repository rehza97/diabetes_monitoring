import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

/// Patient document. Firestore path: patients/{patientId}/documents/{docId}.
class PatientDocument {
  PatientDocument({
    required this.id,
    required this.fileName,
    required this.fileUrl,
    required this.fileType,
    required this.fileSize,
    required this.uploadedById,
    required this.createdAt,
    this.category,
    this.description,
  });

  final String id;
  final String fileName;
  final String fileUrl;
  final String fileType;
  final int fileSize;
  final String uploadedById;
  final Timestamp createdAt;
  final DocumentCategory? category;
  final String? description;

  static PatientDocument fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    return PatientDocument(
      id: snap.id,
      fileName: m['fileName'] as String? ?? '',
      fileUrl: m['fileUrl'] as String? ?? '',
      fileType: m['fileType'] as String? ?? 'document',
      fileSize: m['fileSize'] as int? ?? 0,
      uploadedById: m['uploadedById'] as String? ?? '',
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      category: m['category'] != null ? documentCategoryFromFirestore(m['category'] as String) : null,
      description: m['description'] as String?,
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'fileName': fileName,
      'fileUrl': fileUrl,
      'fileType': fileType,
      'fileSize': fileSize,
      'uploadedById': uploadedById,
      'createdAt': createdAt,
      if (category != null) 'category': documentCategoryToFirestore(category!),
      if (description != null) 'description': description,
    };
    if (includeId) map['id'] = id;
    return map;
  }
}

/// DTO for creating a patient document.
class CreatePatientDocumentDto {
  CreatePatientDocumentDto({
    required this.fileName,
    required this.fileUrl,
    required this.fileType,
    required this.fileSize,
    this.category,
    this.description,
  });

  final String fileName;
  final String fileUrl;
  final String fileType;
  final int fileSize;
  final DocumentCategory? category;
  final String? description;

  Map<String, dynamic> toMap() => {
        'fileName': fileName,
        'fileUrl': fileUrl,
        'fileType': fileType,
        'fileSize': fileSize,
        if (category != null) 'category': documentCategoryToFirestore(category!),
        if (description != null) 'description': description,
      };
}
