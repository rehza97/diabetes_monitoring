import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

class CreateScheduledReadingDto {
  CreateScheduledReadingDto({
    required this.readingType,
    required this.scheduledDate,
    required this.scheduledTime,
    this.assignedToNurseId,
    this.notes,
  });

  final ReadingType readingType;
  final Timestamp scheduledDate;
  final String scheduledTime;
  final String? assignedToNurseId;
  final String? notes;

  Map<String, dynamic> toMap() => {
        'readingType': readingTypeToFirestore(readingType),
        'scheduledDate': scheduledDate,
        'scheduledTime': scheduledTime,
        if (assignedToNurseId != null) 'assignedToNurseId': assignedToNurseId,
        if (notes != null) 'notes': notes,
      };
}

/// Scheduled reading. Firestore path: patients/{patientId}/scheduledReadings/{id}.
class ScheduledReading {
  ScheduledReading({
    required this.id,
    required this.readingType,
    required this.scheduledDate,
    required this.scheduledTime,
    required this.status,
    required this.reminderSent,
    required this.createdAt,
    required this.updatedAt,
    this.assignedToNurseId,
    this.completedReadingId,
    this.notes,
  });

  final String id;
  final ReadingType readingType;
  final Timestamp scheduledDate;
  final String scheduledTime;
  final ScheduledReadingStatus status;
  final bool reminderSent;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final String? assignedToNurseId;
  final String? completedReadingId;
  final String? notes;

  static ScheduledReading fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    return ScheduledReading(
      id: snap.id,
      readingType: readingTypeFromFirestore((m['readingType'] as String?) ?? 'random'),
      scheduledDate: m['scheduledDate'] as Timestamp? ?? Timestamp.now(),
      scheduledTime: m['scheduledTime'] as String? ?? '00:00',
      status: scheduledReadingStatusFromFirestore((m['status'] as String?) ?? 'pending'),
      reminderSent: m['reminderSent'] as bool? ?? false,
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      assignedToNurseId: m['assignedToNurseId'] as String?,
      completedReadingId: m['completedReadingId'] as String?,
      notes: m['notes'] as String?,
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'readingType': readingTypeToFirestore(readingType),
      'scheduledDate': scheduledDate,
      'scheduledTime': scheduledTime,
      'status': scheduledReadingStatusToFirestore(status),
      'reminderSent': reminderSent,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (assignedToNurseId != null) 'assignedToNurseId': assignedToNurseId,
      if (completedReadingId != null) 'completedReadingId': completedReadingId,
      if (notes != null) 'notes': notes,
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
