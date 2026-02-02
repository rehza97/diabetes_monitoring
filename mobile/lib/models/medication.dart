import 'package:cloud_firestore/cloud_firestore.dart';

class MedicationReminders {
  MedicationReminders({this.enabled = false, this.times});

  final bool enabled;
  final List<String>? times;

  Map<String, dynamic> toMap() => {
        'enabled': enabled,
        if (times != null) 'times': times,
      };

  static MedicationReminders? fromMap(Map<String, dynamic>? m) {
    if (m == null) return null;
    return MedicationReminders(
      enabled: m['enabled'] as bool? ?? false,
      times: (m['times'] as List<dynamic>?)?.cast<String>(),
    );
  }
}

class CreateMedicationDto {
  CreateMedicationDto({
    required this.medicationName,
    required this.dosage,
    required this.frequency,
    required this.startDate,
    this.endDate,
    this.notes,
    this.reminders,
  });

  final String medicationName;
  final String dosage;
  final String frequency;
  final Timestamp startDate;
  final Timestamp? endDate;
  final String? notes;
  final MedicationReminders? reminders;

  Map<String, dynamic> toMap() => {
        'medicationName': medicationName,
        'dosage': dosage,
        'frequency': frequency,
        'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
        if (notes != null) 'notes': notes,
        if (reminders != null) 'reminders': reminders!.toMap(),
      };
}

/// Medication. Firestore path: patients/{patientId}/medications/{medicationId}.
class Medication {
  Medication({
    required this.id,
    required this.medicationName,
    required this.dosage,
    required this.frequency,
    required this.startDate,
    required this.prescribedById,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
    this.endDate,
    this.notes,
    this.prescribedByName,
    this.reminders,
  });

  final String id;
  final String medicationName;
  final String dosage;
  final String frequency;
  final Timestamp startDate;
  final String prescribedById;
  final bool isActive;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final Timestamp? endDate;
  final String? notes;
  final String? prescribedByName;
  final MedicationReminders? reminders;

  static Medication fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    final endDate = m['endDate'] as Timestamp?;
    final isActive = endDate == null || endDate.millisecondsSinceEpoch > DateTime.now().millisecondsSinceEpoch;
    return Medication(
      id: snap.id,
      medicationName: m['medicationName'] as String? ?? '',
      dosage: m['dosage'] as String? ?? '',
      frequency: m['frequency'] as String? ?? 'daily',
      startDate: m['startDate'] as Timestamp? ?? Timestamp.now(),
      prescribedById: m['prescribedById'] as String? ?? '',
      isActive: m['isActive'] as bool? ?? isActive,
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      endDate: endDate,
      notes: m['notes'] as String?,
      prescribedByName: m['prescribedByName'] as String?,
      reminders: MedicationReminders.fromMap(
        m['reminders'] is Map ? Map<String, dynamic>.from(m['reminders'] as Map) : null,
      ),
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'medicationName': medicationName,
      'dosage': dosage,
      'frequency': frequency,
      'startDate': startDate,
      'prescribedById': prescribedById,
      'isActive': isActive,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (endDate != null) 'endDate': endDate,
      if (notes != null) 'notes': notes,
      if (prescribedByName != null) 'prescribedByName': prescribedByName,
      if (reminders != null) 'reminders': reminders!.toMap(),
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
