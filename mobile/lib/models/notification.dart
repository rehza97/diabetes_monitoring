import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

class CreateNotificationDto {
  CreateNotificationDto({
    required this.type,
    required this.title,
    required this.message,
    this.priority,
    this.relatedEntityType,
    this.relatedEntityId,
    this.actionUrl,
    this.expiresAt,
  });

  final NotificationType type;
  final String title;
  final String message;
  final NotificationPriority? priority;
  final String? relatedEntityType;
  final String? relatedEntityId;
  final String? actionUrl;
  final Timestamp? expiresAt;

  Map<String, dynamic> toMap() => {
        'type': notificationTypeToFirestore(type),
        'title': title,
        'message': message,
        if (priority != null) 'priority': priority!.name,
        if (relatedEntityType != null) 'relatedEntityType': relatedEntityType,
        if (relatedEntityId != null) 'relatedEntityId': relatedEntityId,
        if (actionUrl != null) 'actionUrl': actionUrl,
        if (expiresAt != null) 'expiresAt': expiresAt,
      };
}

/// Notification model. Firestore path: users/{userId}/notifications/{notificationId}.
/// Named AppNotification to avoid conflict with Flutter's Notification.
class AppNotification {
  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.priority,
    required this.createdAt,
    this.relatedEntityType,
    this.relatedEntityId,
    this.actionUrl,
    this.expiresAt,
    this.readAt,
  });

  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final bool isRead;
  final NotificationPriority priority;
  final Timestamp createdAt;
  final String? relatedEntityType;
  final String? relatedEntityId;
  final String? actionUrl;
  final Timestamp? expiresAt;
  final Timestamp? readAt;

  static AppNotification fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    return AppNotification(
      id: snap.id,
      type: notificationTypeFromFirestore((m['type'] as String?) ?? 'message'),
      title: m['title'] as String? ?? '',
      message: m['message'] as String? ?? '',
      isRead: m['isRead'] as bool? ?? false,
      priority: NotificationPriority.values.byName((m['priority'] as String?) ?? 'medium'),
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      relatedEntityType: m['relatedEntityType'] as String?,
      relatedEntityId: m['relatedEntityId'] as String?,
      actionUrl: m['actionUrl'] as String?,
      expiresAt: m['expiresAt'] as Timestamp?,
      readAt: m['readAt'] as Timestamp?,
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'type': notificationTypeToFirestore(type),
      'title': title,
      'message': message,
      'isRead': isRead,
      'priority': priority.name,
      'createdAt': createdAt,
      if (relatedEntityType != null) 'relatedEntityType': relatedEntityType,
      if (relatedEntityId != null) 'relatedEntityId': relatedEntityId,
      if (actionUrl != null) 'actionUrl': actionUrl,
      if (expiresAt != null) 'expiresAt': expiresAt,
      if (readAt != null) 'readAt': readAt,
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
