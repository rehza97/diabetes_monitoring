import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

/// Measurement thresholds for reading status. Same as frontend.
class MeasurementThresholds {
  MeasurementThresholds({
    required this.normalMin,
    required this.normalMax,
    required this.warningMin,
    required this.warningMax,
    required this.criticalMin,
    required this.criticalMax,
  });

  final double normalMin;
  final double normalMax;
  final double warningMin;
  final double warningMax;
  final double criticalMin;
  final double criticalMax;
}

/// Default thresholds (frontend values).
final MeasurementThresholds defaultThresholds = MeasurementThresholds(
  normalMin: 70,
  normalMax: 140,
  warningMin: 140,
  warningMax: 180,
  criticalMin: 70,
  criticalMax: 250,
);

/// Create-reading DTO. Matches frontend CreateFirestoreReadingDto.
class CreateReadingDto {
  CreateReadingDto({
    required this.value,
    required this.unit,
    required this.readingType,
    required this.date,
    required this.time,
    this.notes,
    this.symptoms,
    this.conditionDuringReading,
  });

  final double value;
  final ReadingUnit unit;
  final ReadingType readingType;
  final Timestamp date;
  final String time;
  final String? notes;
  final List<String>? symptoms;
  final String? conditionDuringReading; // 'normal' | 'after_exercise' | 'sick' | 'long_fasting'

  Map<String, dynamic> toMap() => {
        'value': value,
        'unit': readingUnitToFirestore(unit),
        'readingType': readingTypeToFirestore(readingType),
        'date': date,
        'time': time,
        if (notes != null) 'notes': notes,
        if (symptoms != null) 'symptoms': symptoms,
        if (conditionDuringReading != null) 'conditionDuringReading': conditionDuringReading,
      };
}

/// Reading model. Firestore path: patients/{patientId}/readings/{readingId}.
class Reading {
  Reading({
    required this.id,
    required this.value,
    required this.unit,
    required this.readingType,
    required this.date,
    required this.time,
    required this.recordedById,
    required this.status,
    required this.isVerified,
    required this.createdAt,
    required this.updatedAt,
    this.notes,
    this.symptoms,
    this.conditionDuringReading,
    this.recordedByName,
    this.verifiedById,
    this.verifiedAt,
  });

  final String id;
  final double value;
  final ReadingUnit unit;
  final ReadingType readingType;
  final Timestamp date;
  final String time;
  final String recordedById;
  final ReadingStatus status;
  final bool isVerified;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final String? notes;
  final List<String>? symptoms;
  final String? conditionDuringReading;
  final String? recordedByName;
  final String? verifiedById;
  final Timestamp? verifiedAt;

  static ReadingStatus _statusFrom(String? s) {
    if (s == 'warning') return ReadingStatus.warning;
    if (s == 'critical') return ReadingStatus.critical;
    return ReadingStatus.normal;
  }

  static Reading fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    final id = snap.id;
    return Reading(
      id: id,
      value: (m['value'] as num?)?.toDouble() ?? 0,
      unit: readingUnitFromFirestore((m['unit'] as String?) ?? 'mg/dL'),
      readingType: readingTypeFromFirestore((m['readingType'] as String?) ?? 'random'),
      date: m['date'] as Timestamp? ?? Timestamp.now(),
      time: m['time'] as String? ?? '00:00',
      recordedById: m['recordedById'] as String? ?? '',
      status: _statusFrom(m['status'] as String?),
      isVerified: m['isVerified'] as bool? ?? false,
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      notes: m['notes'] as String?,
      symptoms: (m['symptoms'] as List<dynamic>?)?.cast<String>(),
      conditionDuringReading: m['conditionDuringReading'] as String?,
      recordedByName: m['recordedByName'] as String?,
      verifiedById: m['verifiedById'] as String?,
      verifiedAt: m['verifiedAt'] as Timestamp?,
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'value': value,
      'unit': readingUnitToFirestore(unit),
      'readingType': readingTypeToFirestore(readingType),
      'date': date,
      'time': time,
      'recordedById': recordedById,
      'status': status.name,
      'isVerified': isVerified,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (notes != null) 'notes': notes,
      if (symptoms != null) 'symptoms': symptoms,
      if (conditionDuringReading != null) 'conditionDuringReading': conditionDuringReading,
      if (recordedByName != null) 'recordedByName': recordedByName,
      if (verifiedById != null) 'verifiedById': verifiedById,
      if (verifiedAt != null) 'verifiedAt': verifiedAt,
    };
    if (includeId) map['id'] = id;
    return map;
  }
}

/// Reading + patientId for collection-group query results.
class ReadingWithPatientId {
  ReadingWithPatientId({required this.reading, required this.patientId});

  final Reading reading;
  final String patientId;
}
