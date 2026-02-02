// Enums and type aliases mirroring frontend [firestore.ts].

enum UserRole { admin, doctor, nurse }

enum DiabetesType { type1, type2, gestational }

enum PatientStatus { active, inactive, critical, needsFollowup }

enum ReadingType {
  fasting,
  postBreakfast,
  preLunch,
  postLunch,
  preDinner,
  postDinner,
  bedtime,
  midnight,
  random,
}

enum ReadingStatus { normal, warning, critical }

enum ReadingUnit { mgDl, mmolL }

enum MedicalNoteType { diagnosis, prescription, observation, followup }

enum ScheduledReadingStatus { pending, completed, missed, cancelled }

enum DocumentCategory { labResult, prescription, report, other }

enum NotificationType {
  criticalReading,
  reminder,
  message,
  system,
  assignment,
}

enum NotificationPriority { low, medium, high, urgent }

enum ReportType { patientSummary, periodSummary, comparison, custom }

enum PatientAlertType {
  criticalReading,
  thresholdBreach,
  missedReading,
  medicationDue,
  followupRequired,
}

enum AlertPriority { low, medium, high, urgent }

enum SettingCategory {
  general,
  measurements,
  notifications,
  security,
  backup,
  email,
  alerts,
}

/// Convert ReadingType to Firestore string (camelCase).
String readingTypeToFirestore(ReadingType v) {
  switch (v) {
    case ReadingType.postBreakfast:
      return 'post_breakfast';
    case ReadingType.preLunch:
      return 'pre_lunch';
    case ReadingType.postLunch:
      return 'post_lunch';
    case ReadingType.preDinner:
      return 'pre_dinner';
    case ReadingType.postDinner:
      return 'post_dinner';
    case ReadingType.midnight:
      return 'midnight';
    default:
      return v.name;
  }
}

ReadingType readingTypeFromFirestore(String s) {
  switch (s) {
    case 'post_breakfast':
      return ReadingType.postBreakfast;
    case 'pre_lunch':
      return ReadingType.preLunch;
    case 'post_lunch':
      return ReadingType.postLunch;
    case 'pre_dinner':
      return ReadingType.preDinner;
    case 'post_dinner':
      return ReadingType.postDinner;
    case 'midnight':
      return ReadingType.midnight;
    default:
      return ReadingType.values.byName(s);
  }
}

String readingUnitToFirestore(ReadingUnit v) =>
    v == ReadingUnit.mgDl ? 'mg/dL' : 'mmol/L';

ReadingUnit readingUnitFromFirestore(String s) =>
    s == 'mmol/L' ? ReadingUnit.mmolL : ReadingUnit.mgDl;

String patientStatusToFirestore(PatientStatus v) {
  switch (v) {
    case PatientStatus.needsFollowup:
      return 'needs_followup';
    default:
      return v.name;
  }
}

PatientStatus patientStatusFromFirestore(String s) {
  if (s == 'needs_followup') return PatientStatus.needsFollowup;
  return PatientStatus.values.byName(s);
}

String notificationTypeToFirestore(NotificationType v) {
  switch (v) {
    case NotificationType.criticalReading:
      return 'critical_reading';
    default:
      return v.name;
  }
}

NotificationType notificationTypeFromFirestore(String s) {
  if (s == 'critical_reading') return NotificationType.criticalReading;
  return NotificationType.values.byName(s);
}

String reportTypeToFirestore(ReportType v) {
  switch (v) {
    case ReportType.patientSummary:
      return 'patient_summary';
    case ReportType.periodSummary:
      return 'period_summary';
    default:
      return v.name;
  }
}

ReportType reportTypeFromFirestore(String s) {
  switch (s) {
    case 'patient_summary':
      return ReportType.patientSummary;
    case 'period_summary':
      return ReportType.periodSummary;
    default:
      return ReportType.values.byName(s);
  }
}

String patientAlertTypeToFirestore(PatientAlertType v) {
  return switch (v) {
    PatientAlertType.criticalReading => 'critical_reading',
    PatientAlertType.thresholdBreach => 'threshold_breach',
    PatientAlertType.missedReading => 'missed_reading',
    PatientAlertType.medicationDue => 'medication_due',
    PatientAlertType.followupRequired => 'followup_required',
  };
}

PatientAlertType patientAlertTypeFromFirestore(String s) {
  switch (s) {
    case 'critical_reading':
      return PatientAlertType.criticalReading;
    case 'threshold_breach':
      return PatientAlertType.thresholdBreach;
    case 'missed_reading':
      return PatientAlertType.missedReading;
    case 'medication_due':
      return PatientAlertType.medicationDue;
    case 'followup_required':
      return PatientAlertType.followupRequired;
    default:
      return PatientAlertType.values.byName(s);
  }
}

String documentCategoryToFirestore(DocumentCategory v) {
  return switch (v) {
    DocumentCategory.labResult => 'lab_result',
    DocumentCategory.prescription => 'prescription',
    DocumentCategory.report => 'report',
    DocumentCategory.other => 'other',
  };
}

DocumentCategory documentCategoryFromFirestore(String s) {
  if (s == 'lab_result') return DocumentCategory.labResult;
  return DocumentCategory.values.byName(s);
}

String scheduledReadingStatusToFirestore(ScheduledReadingStatus v) =>
    v.name;

ScheduledReadingStatus scheduledReadingStatusFromFirestore(String s) =>
    ScheduledReadingStatus.values.byName(s);
