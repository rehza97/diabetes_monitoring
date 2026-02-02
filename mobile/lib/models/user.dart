import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

/// User preferences (nested in User).
class UserPreferences {
  UserPreferences({
    required this.language,
    required this.theme,
    required this.timezone,
    required this.dateFormat,
    required this.measurementUnit,
    required this.notifications,
  });

  final String language;
  final String theme;
  final String timezone;
  final String dateFormat;
  final String measurementUnit;
  final NotificationPreferences notifications;

  Map<String, dynamic> toMap() => {
        'language': language,
        'theme': theme,
        'timezone': timezone,
        'dateFormat': dateFormat,
        'measurementUnit': measurementUnit,
        'notifications': {
          'criticalReadings': notifications.criticalReadings,
          'reminders': notifications.reminders,
          'messages': notifications.messages,
          'system': notifications.system,
        },
      };

  static UserPreferences? fromMap(Map<String, dynamic>? m) {
    if (m == null) return null;
    final n = m['notifications'];
    Map<String, dynamic> nm = n is Map ? Map<String, dynamic>.from(n) : {};
    return UserPreferences(
      language: m['language'] as String? ?? 'fr',
      theme: m['theme'] as String? ?? 'light',
      timezone: m['timezone'] as String? ?? 'UTC',
      dateFormat: m['dateFormat'] as String? ?? 'DD/MM/YYYY',
      measurementUnit: m['measurementUnit'] as String? ?? 'mg/dL',
      notifications: NotificationPreferences(
        criticalReadings: nm['criticalReadings'] as bool? ?? true,
        reminders: nm['reminders'] as bool? ?? true,
        messages: nm['messages'] as bool? ?? true,
        system: nm['system'] as bool? ?? true,
      ),
    );
  }
}

class NotificationPreferences {
  NotificationPreferences({
    required this.criticalReadings,
    required this.reminders,
    required this.messages,
    required this.system,
  });

  final bool criticalReadings;
  final bool reminders;
  final bool messages;
  final bool system;
}

/// User model. Firestore path: users/{userId}.
class User {
  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.isActive,
    required this.emailVerified,
    required this.createdAt,
    required this.updatedAt,
    this.phone,
    this.avatar,
    this.specialization,
    this.licenseNumber,
    this.lastLogin,
    this.preferences,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final UserRole role;
  final bool isActive;
  final bool emailVerified;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final String? phone;
  final String? avatar;
  final String? specialization;
  final String? licenseNumber;
  final Timestamp? lastLogin;
  final UserPreferences? preferences;

  static UserRole _roleFrom(String? s) {
    if (s == null) return UserRole.doctor;
    switch (s) {
      case 'admin':
        return UserRole.admin;
      case 'nurse':
        return UserRole.nurse;
      default:
        return UserRole.doctor;
    }
  }

  static User fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    final id = snap.id;
    return User(
      id: id,
      email: m['email'] as String? ?? '',
      firstName: m['firstName'] as String? ?? '',
      lastName: m['lastName'] as String? ?? '',
      role: _roleFrom(m['role'] as String?),
      isActive: m['isActive'] as bool? ?? true,
      emailVerified: m['emailVerified'] as bool? ?? false,
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      phone: m['phone'] as String?,
      avatar: m['avatar'] as String?,
      specialization: m['specialization'] as String?,
      licenseNumber: m['licenseNumber'] as String?,
      lastLogin: m['lastLogin'] as Timestamp?,
      preferences: UserPreferences.fromMap(
        m['preferences'] is Map ? Map<String, dynamic>.from(m['preferences'] as Map) : null,
      ),
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'role': role.name,
      'isActive': isActive,
      'emailVerified': emailVerified,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (phone != null) 'phone': phone,
      if (avatar != null) 'avatar': avatar,
      if (specialization != null) 'specialization': specialization,
      if (licenseNumber != null) 'licenseNumber': licenseNumber,
      if (lastLogin != null) 'lastLogin': lastLogin,
      if (preferences != null) 'preferences': preferences!.toMap(),
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
