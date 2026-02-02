import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/user.dart';
import 'firestore_paths.dart';

Future<User?> getUser(String userId) async {
  final ref = usersCollection().doc(userId);
  final snap = await ref.get();
  if (!snap.exists || snap.data() == null) return null;
  return snap.data();
}

/// Query users. [build] receives the base collection; add where/orderBy/limit
/// as needed (e.g. role, isActive).
Future<List<User>> queryUsers(
  Query<User> Function(Query<User> base) build,
) async {
  final base = usersCollection();
  final q = build(base);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

Future<void> updateUser(String userId, Map<String, dynamic> partial) async {
  final clean = <String, dynamic>{};
  for (final e in partial.entries) {
    if (e.value != null) clean[e.key] = e.value;
  }
  if (clean.isEmpty) return;
  clean['updatedAt'] = FieldValue.serverTimestamp();
  await usersCollection().doc(userId).update(clean);
}
