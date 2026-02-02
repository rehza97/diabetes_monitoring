import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/medical_note.dart';
import '../models/medication.dart';
import '../models/notification.dart' as notif;
import '../models/patient.dart';
import '../models/patient_alert.dart';
import '../models/patient_document.dart';
import '../models/reading.dart';
import '../models/reading_template.dart';
import '../models/report.dart';
import '../models/scheduled_reading.dart';
import '../models/setting.dart';
import '../models/user.dart';

final FirebaseFirestore _db = FirebaseFirestore.instance;

CollectionReference<User> usersCollection() =>
    _db.collection('users').withConverter<User>(
          fromFirestore: (s, _) => User.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<Patient> patientsCollection() =>
    _db.collection('patients').withConverter<Patient>(
          fromFirestore: (s, _) => Patient.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<Report> reportsCollection() =>
    _db.collection('reports').withConverter<Report>(
          fromFirestore: (s, _) => Report.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<Setting> settingsCollection() =>
    _db.collection('settings').withConverter<Setting>(
          fromFirestore: (s, _) => Setting.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<ReadingTemplate> readingTemplatesCollection() =>
    _db.collection('readingTemplates').withConverter<ReadingTemplate>(
          fromFirestore: (s, _) => ReadingTemplate.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

DocumentReference<Patient> patientRef(String patientId) =>
    patientsCollection().doc(patientId);

CollectionReference<Reading> readingsCollection(String patientId) =>
    _db.collection('patients').doc(patientId).collection('readings').withConverter<Reading>(
          fromFirestore: (s, _) => Reading.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<MedicalNote> medicalNotesCollection(String patientId) =>
    _db.collection('patients').doc(patientId).collection('medicalNotes').withConverter<MedicalNote>(
          fromFirestore: (s, _) => MedicalNote.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<Medication> medicationsCollection(String patientId) =>
    _db.collection('patients').doc(patientId).collection('medications').withConverter<Medication>(
          fromFirestore: (s, _) => Medication.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<ScheduledReading> scheduledReadingsCollection(String patientId) =>
    _db.collection('patients').doc(patientId).collection('scheduledReadings').withConverter<ScheduledReading>(
          fromFirestore: (s, _) => ScheduledReading.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<PatientDocument> patientDocumentsCollection(String patientId) =>
    _db.collection('patients').doc(patientId).collection('documents').withConverter<PatientDocument>(
          fromFirestore: (s, _) => PatientDocument.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<PatientAlert> patientAlertsCollection(String patientId) =>
    _db.collection('patients').doc(patientId).collection('alerts').withConverter<PatientAlert>(
          fromFirestore: (s, _) => PatientAlert.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

CollectionReference<notif.AppNotification> notificationsCollection(String userId) =>
    _db.collection('users').doc(userId).collection('notifications').withConverter<notif.AppNotification>(
          fromFirestore: (s, _) => notif.AppNotification.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

Query<Reading> readingsCollectionGroup() =>
    _db.collectionGroup('readings').withConverter<Reading>(
          fromFirestore: (s, _) => Reading.fromFirestore(s),
          toFirestore: (v, _) => v.toMap(includeId: false),
        );

/// Raw collections for create/update with Map (e.g. createPatient, createReading).
CollectionReference<Map<String, dynamic>> patientsCollectionRaw() =>
    _db.collection('patients');

CollectionReference<Map<String, dynamic>> readingsCollectionRaw(String patientId) =>
    _db.collection('patients').doc(patientId).collection('readings');

CollectionReference<Map<String, dynamic>> readingTemplatesCollectionRaw() =>
    _db.collection('readingTemplates');

CollectionReference<Map<String, dynamic>> notificationsCollectionRaw(String userId) =>
    _db.collection('users').doc(userId).collection('notifications');

CollectionReference<Map<String, dynamic>> reportsCollectionRaw() =>
    _db.collection('reports');

CollectionReference<Map<String, dynamic>> medicalNotesCollectionRaw(String patientId) =>
    _db.collection('patients').doc(patientId).collection('medicalNotes');

CollectionReference<Map<String, dynamic>> medicationsCollectionRaw(String patientId) =>
    _db.collection('patients').doc(patientId).collection('medications');

CollectionReference<Map<String, dynamic>> scheduledReadingsCollectionRaw(String patientId) =>
    _db.collection('patients').doc(patientId).collection('scheduledReadings');

CollectionReference<Map<String, dynamic>> patientAlertsCollectionRaw(String patientId) =>
    _db.collection('patients').doc(patientId).collection('alerts');

CollectionReference<Map<String, dynamic>> patientDocumentsCollectionRaw(String patientId) =>
    _db.collection('patients').doc(patientId).collection('documents');
