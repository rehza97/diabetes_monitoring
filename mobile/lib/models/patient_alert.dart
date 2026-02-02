import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

class PatientAlertMetadata {
  PatientAlertMetadata({
    this.readingValue,
    this.threshold,
    this.missedDate,
    this.medicationName,
    this.scheduledDate,
  });

  final double? readingValue;
  final double? threshold;
  final Timestamp? missedDate;
  final String? medicationName;
  final Timestamp? scheduledDate;

  Map<String, dynamic> toMap() => {
        if (readingValue != null) 'readingValue': readingValue,
        if (threshold != null) 'threshold': threshold,
        if (missedDate != null) 'missedDate': missedDate,
        if (medicationName != null) 'medicationName': medicationName,
        if (scheduledDate != null) 'scheduledDate': scheduledDate,
      };

  static PatientAlertMetadata? fromMap(Map<String, dynamic>? m) {
    if (m == null || m.isEmpty) return null;
    return PatientAlertMetadata(
      readingValue: (m['readingValue'] as num?)?.toDouble(),
      threshold: (m['threshold'] as num?)?.toDouble(),
      missedDate: m['missedDate'] as Timestamp?,
      medicationName: m['medicationName'] as String?,
      scheduledDate: m['scheduledDate'] as Timestamp?,
    );
  }
}

class CreatePatientAlertDto {
  CreatePatientAlertDto({
    required this.alertType,
    required this.priority,
    required this.title,
    required this.message,
    this.relatedReadingId,
    this.relatedMedicationId,
    this.relatedScheduledReadingId,
    this.metadata,
  });

  final PatientAlertType alertType;
  final AlertPriority priority;
  final String title;
  final String message;
  final String? relatedReadingId;
  final String? relatedMedicationId;
  final String? relatedScheduledReadingId;
  final PatientAlertMetadata? metadata;

  Map<String, dynamic> toMap() => {
        'alertType': patientAlertTypeToFirestore(alertType),
        'priority': priority.name,
        'title': title,
        'message': message,
        if (relatedReadingId != null) 'relatedReadingId': relatedReadingId,
        if (relatedMedicationId != null) 'relatedMedicationId': relatedMedicationId,
        if (relatedScheduledReadingId != null) 'relatedScheduledReadingId': relatedScheduledReadingId,
        if (metadata != null) 'metadata': metadata!.toMap(),
      };
}

/// Patient alert. Firestore path: patients/{patientId}/alerts/{alertId}.
class PatientAlert {
  PatientAlert({
    required this.id,
    required this.alertType,
    required this.priority,
    required this.title,
    required this.message,
    required this.isResolved,
    required this.createdAt,
    required this.updatedAt,
    this.relatedReadingId,
    this.relatedMedicationId,
    this.relatedScheduledReadingId,
    this.resolvedById,
    this.resolvedAt,
    this.acknowledgedBy,
    this.metadata,
  });

  final String id;
  final PatientAlertType alertType;
  final AlertPriority priority;
  final String title;
  final String message;
  final bool isResolved;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final String? relatedReadingId;
  final String? relatedMedicationId;
  final String? relatedScheduledReadingId;
  final String? resolvedById;
  final Timestamp? resolvedAt;
  final List<String>? acknowledgedBy;
  final PatientAlertMetadata? metadata;

  static PatientAlert fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    return PatientAlert(
      id: snap.id,
      alertType: patientAlertTypeFromFirestore((m['alertType'] as String?) ?? 'followup_required'),
      priority: AlertPriority.values.byName((m['priority'] as String?) ?? 'medium'),
      title: m['title'] as String? ?? '',
      message: m['message'] as String? ?? '',
      isResolved: m['isResolved'] as bool? ?? false,
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      relatedReadingId: m['relatedReadingId'] as String?,
      relatedMedicationId: m['relatedMedicationId'] as String?,
      relatedScheduledReadingId: m['relatedScheduledReadingId'] as String?,
      resolvedById: m['resolvedById'] as String?,
      resolvedAt: m['resolvedAt'] as Timestamp?,
      acknowledgedBy: (m['acknowledgedBy'] as List<dynamic>?)?.cast<String>(),
      metadata: PatientAlertMetadata.fromMap(
        m['metadata'] is Map ? Map<String, dynamic>.from(m['metadata'] as Map) : null,
      ),
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'alertType': patientAlertTypeToFirestore(alertType),
      'priority': priority.name,
      'title': title,
      'message': message,
      'isResolved': isResolved,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (relatedReadingId != null) 'relatedReadingId': relatedReadingId,
      if (relatedMedicationId != null) 'relatedMedicationId': relatedMedicationId,
      if (relatedScheduledReadingId != null) 'relatedScheduledReadingId': relatedScheduledReadingId,
      if (resolvedById != null) 'resolvedById': resolvedById,
      if (resolvedAt != null) 'resolvedAt': resolvedAt,
      if (acknowledgedBy != null) 'acknowledgedBy': acknowledgedBy,
      if (metadata != null) 'metadata': metadata!.toMap(),
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
