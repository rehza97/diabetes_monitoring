import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

class PatientAddress {
  PatientAddress({
    this.street,
    this.city,
    this.state,
    this.zipCode,
    this.country,
  });

  final String? street;
  final String? city;
  final String? state;
  final String? zipCode;
  final String? country;

  Map<String, dynamic> toMap() => {
        if (street != null) 'street': street,
        if (city != null) 'city': city,
        if (state != null) 'state': state,
        if (zipCode != null) 'zipCode': zipCode,
        if (country != null) 'country': country,
      };

  static PatientAddress? fromMap(Map<String, dynamic>? m) {
    if (m == null || m.isEmpty) return null;
    return PatientAddress(
      street: m['street'] as String?,
      city: m['city'] as String?,
      state: m['state'] as String?,
      zipCode: m['zipCode'] as String?,
      country: m['country'] as String?,
    );
  }
}

class PatientAllergies {
  PatientAllergies({this.medications, this.foods, this.other});

  final List<String>? medications;
  final List<String>? foods;
  final List<String>? other;

  Map<String, dynamic> toMap() => {
        if (medications != null) 'medications': medications,
        if (foods != null) 'foods': foods,
        if (other != null) 'other': other,
      };

  static PatientAllergies? fromMap(Map<String, dynamic>? m) {
    if (m == null || m.isEmpty) return null;
    return PatientAllergies(
      medications: (m['medications'] as List<dynamic>?)?.cast<String>(),
      foods: (m['foods'] as List<dynamic>?)?.cast<String>(),
      other: (m['other'] as List<dynamic>?)?.cast<String>(),
    );
  }
}

class EmergencyContact {
  EmergencyContact({
    required this.name,
    required this.relationship,
    required this.phone,
    this.email,
  });

  final String name;
  final String relationship;
  final String phone;
  final String? email;

  Map<String, dynamic> toMap() => {
        'name': name,
        'relationship': relationship,
        'phone': phone,
        if (email != null) 'email': email,
      };

  static EmergencyContact? fromMap(Map<String, dynamic>? m) {
    if (m == null || m['name'] == null || m['relationship'] == null || m['phone'] == null) {
      return null;
    }
    return EmergencyContact(
      name: m['name'] as String,
      relationship: m['relationship'] as String,
      phone: m['phone'] as String,
      email: m['email'] as String?,
    );
  }
}

class CustomAlertRules {
  CustomAlertRules({
    this.highThreshold,
    this.lowThreshold,
    required this.enableAlerts,
  });

  final double? highThreshold;
  final double? lowThreshold;
  final bool enableAlerts;

  Map<String, dynamic> toMap() => {
        if (highThreshold != null) 'highThreshold': highThreshold,
        if (lowThreshold != null) 'lowThreshold': lowThreshold,
        'enableAlerts': enableAlerts,
      };

  static CustomAlertRules? fromMap(Map<String, dynamic>? m) {
    if (m == null) return null;
    return CustomAlertRules(
      highThreshold: (m['highThreshold'] as num?)?.toDouble(),
      lowThreshold: (m['lowThreshold'] as num?)?.toDouble(),
      enableAlerts: m['enableAlerts'] as bool? ?? false,
    );
  }
}

/// Create-patient DTO. Matches frontend CreateFirestorePatientDto.
class CreatePatientDto {
  CreatePatientDto({
    required this.firstName,
    required this.lastName,
    required this.dateOfBirth,
    required this.gender,
    required this.phone,
    required this.diabetesType,
    required this.diagnosisDate,
    required this.doctorId,
    this.email,
    this.address,
    this.bloodType,
    this.weight,
    this.height,
    this.nurseId,
    this.avatar,
    this.chronicDiseases,
    this.allergies,
    this.emergencyContact,
    this.customAlertRules,
  });

  final String firstName;
  final String lastName;
  final Timestamp dateOfBirth;
  final String gender; // 'male' | 'female'
  final String phone;
  final DiabetesType diabetesType;
  final Timestamp diagnosisDate;
  final String doctorId;
  final String? email;
  final PatientAddress? address;
  final String? bloodType;
  final double? weight;
  final double? height;
  final String? nurseId;
  final String? avatar;
  final List<String>? chronicDiseases;
  final PatientAllergies? allergies;
  final EmergencyContact? emergencyContact;
  final CustomAlertRules? customAlertRules;

  Map<String, dynamic> toMap() => {
        'firstName': firstName,
        'lastName': lastName,
        'dateOfBirth': dateOfBirth,
        'gender': gender,
        'phone': phone,
        'diabetesType': diabetesType.name,
        'diagnosisDate': diagnosisDate,
        'doctorId': doctorId,
        if (email != null) 'email': email,
        if (address != null) 'address': address!.toMap(),
        if (bloodType != null) 'bloodType': bloodType,
        if (weight != null) 'weight': weight,
        if (height != null) 'height': height,
        if (nurseId != null) 'nurseId': nurseId,
        if (avatar != null) 'avatar': avatar,
        if (chronicDiseases != null) 'chronicDiseases': chronicDiseases,
        if (allergies != null) 'allergies': allergies!.toMap(),
        if (emergencyContact != null) 'emergencyContact': emergencyContact!.toMap(),
        if (customAlertRules != null) 'customAlertRules': customAlertRules!.toMap(),
      };
}

/// Patient model. Firestore path: patients/{patientId}.
class Patient {
  Patient({
    required this.id,
    required this.fileNumber,
    required this.firstName,
    required this.lastName,
    required this.dateOfBirth,
    required this.gender,
    required this.phone,
    required this.diabetesType,
    required this.diagnosisDate,
    required this.doctorId,
    required this.isActive,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.email,
    this.address,
    this.bloodType,
    this.weight,
    this.height,
    this.bmi,
    this.nurseId,
    this.avatar,
    this.chronicDiseases,
    this.allergies,
    this.emergencyContact,
    this.lastReadingDate,
    this.lastReadingValue,
    this.lastReadingStatus,
    this.totalReadingsCount,
    this.averageReadingValue,
    this.customAlertRules,
  });

  final String id;
  final String fileNumber;
  final String firstName;
  final String lastName;
  final Timestamp dateOfBirth;
  final String gender;
  final String phone;
  final DiabetesType diabetesType;
  final Timestamp diagnosisDate;
  final String doctorId;
  final bool isActive;
  final PatientStatus status;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final String? email;
  final PatientAddress? address;
  final String? bloodType;
  final double? weight;
  final double? height;
  final double? bmi;
  final String? nurseId;
  final String? avatar;
  final List<String>? chronicDiseases;
  final PatientAllergies? allergies;
  final EmergencyContact? emergencyContact;
  final Timestamp? lastReadingDate;
  final double? lastReadingValue;
  final String? lastReadingStatus; // 'normal' | 'warning' | 'critical'
  final int? totalReadingsCount;
  final double? averageReadingValue;
  final CustomAlertRules? customAlertRules;

  static Patient fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    final id = snap.id;
    return Patient(
      id: id,
      fileNumber: m['fileNumber'] as String? ?? '',
      firstName: m['firstName'] as String? ?? '',
      lastName: m['lastName'] as String? ?? '',
      dateOfBirth: m['dateOfBirth'] as Timestamp? ?? Timestamp.now(),
      gender: m['gender'] as String? ?? 'male',
      phone: m['phone'] as String? ?? '',
      diabetesType: DiabetesType.values.byName((m['diabetesType'] as String?) ?? 'type2'),
      diagnosisDate: m['diagnosisDate'] as Timestamp? ?? Timestamp.now(),
      doctorId: m['doctorId'] as String? ?? '',
      isActive: m['isActive'] as bool? ?? true,
      status: patientStatusFromFirestore((m['status'] as String?) ?? 'active'),
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      email: m['email'] as String?,
      address: PatientAddress.fromMap(
        m['address'] is Map ? Map<String, dynamic>.from(m['address'] as Map) : null,
      ),
      bloodType: m['bloodType'] as String?,
      weight: (m['weight'] as num?)?.toDouble(),
      height: (m['height'] as num?)?.toDouble(),
      bmi: (m['bmi'] as num?)?.toDouble(),
      nurseId: m['nurseId'] as String?,
      avatar: m['avatar'] as String?,
      chronicDiseases: (m['chronicDiseases'] as List<dynamic>?)?.cast<String>(),
      allergies: PatientAllergies.fromMap(
        m['allergies'] is Map ? Map<String, dynamic>.from(m['allergies'] as Map) : null,
      ),
      emergencyContact: EmergencyContact.fromMap(
        m['emergencyContact'] is Map ? Map<String, dynamic>.from(m['emergencyContact'] as Map) : null,
      ),
      lastReadingDate: m['lastReadingDate'] as Timestamp?,
      lastReadingValue: (m['lastReadingValue'] as num?)?.toDouble(),
      lastReadingStatus: m['lastReadingStatus'] as String?,
      totalReadingsCount: m['totalReadingsCount'] as int?,
      averageReadingValue: (m['averageReadingValue'] as num?)?.toDouble(),
      customAlertRules: CustomAlertRules.fromMap(
        m['customAlertRules'] is Map ? Map<String, dynamic>.from(m['customAlertRules'] as Map) : null,
      ),
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'fileNumber': fileNumber,
      'firstName': firstName,
      'lastName': lastName,
      'dateOfBirth': dateOfBirth,
      'gender': gender,
      'phone': phone,
      'diabetesType': diabetesType.name,
      'diagnosisDate': diagnosisDate,
      'doctorId': doctorId,
      'isActive': isActive,
      'status': patientStatusToFirestore(status),
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (email != null) 'email': email,
      if (address != null) 'address': address!.toMap(),
      if (bloodType != null) 'bloodType': bloodType,
      if (weight != null) 'weight': weight,
      if (height != null) 'height': height,
      if (bmi != null) 'bmi': bmi,
      if (nurseId != null) 'nurseId': nurseId,
      if (avatar != null) 'avatar': avatar,
      if (chronicDiseases != null) 'chronicDiseases': chronicDiseases,
      if (allergies != null) 'allergies': allergies!.toMap(),
      if (emergencyContact != null) 'emergencyContact': emergencyContact!.toMap(),
      if (lastReadingDate != null) 'lastReadingDate': lastReadingDate,
      if (lastReadingValue != null) 'lastReadingValue': lastReadingValue,
      if (lastReadingStatus != null) 'lastReadingStatus': lastReadingStatus,
      if (totalReadingsCount != null) 'totalReadingsCount': totalReadingsCount,
      if (averageReadingValue != null) 'averageReadingValue': averageReadingValue,
      if (customAlertRules != null) 'customAlertRules': customAlertRules!.toMap(),
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
