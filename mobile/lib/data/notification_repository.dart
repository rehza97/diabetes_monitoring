import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/notification.dart' as notif;
import 'firestore_paths.dart';

Future<String> createNotification(
  String userId,
  notif.CreateNotificationDto dto,
) async {
  final col = notificationsCollectionRaw(userId);
  final ref = col.doc();
  final clean = <String, dynamic>{
    ...dto.toMap(),
    'isRead': false,
    'priority': dto.priority?.name ?? 'medium',
    'createdAt': FieldValue.serverTimestamp(),
  };
  await ref.set(clean);
  return ref.id;
}

Future<List<notif.AppNotification>> getNotifications(
  String userId, [
  Query<notif.AppNotification> Function(Query<notif.AppNotification> base)? build,
]) async {
  var q = notificationsCollection(userId).orderBy('createdAt', descending: true);
  if (build != null) q = build(q);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<void> updateNotification(
  String userId,
  String notificationId,
  Map<String, dynamic> partial,
) async {
  final clean = <String, dynamic>{...partial};
  if (clean.isEmpty) return;
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await notificationsCollectionRaw(userId).doc(notificationId).update(clean);
}

Future<void> deleteNotification(String userId, String notificationId) async {
  await notificationsCollectionRaw(userId).doc(notificationId).delete();
}
