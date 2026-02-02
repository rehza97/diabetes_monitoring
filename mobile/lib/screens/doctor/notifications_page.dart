import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/notification_repository.dart';
import '../../models/enums.dart';
import '../../models/notification.dart' as notif;

class DoctorNotificationsPage extends StatefulWidget {
  const DoctorNotificationsPage({super.key});

  @override
  State<DoctorNotificationsPage> createState() => _DoctorNotificationsPageState();
}

class _DoctorNotificationsPageState extends State<DoctorNotificationsPage> {
  List<notif.AppNotification> _notifications = [];
  bool _loading = true;
  String? _error;
  bool _hasLoaded = false;
  String _filter = 'all'; // 'all' or 'unread'

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_hasLoaded) return;
    final uid = AppAuthScope.of(context).userId;
    if (uid == null) {
      _hasLoaded = true;
      setState(() {
        _loading = false;
        _error = 'Non connecté';
      });
      return;
    }
    _hasLoaded = true;
    _load(uid);
  }

  Future<void> _load(String uid) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final notifications = await getNotifications(uid);
      if (!mounted) return;
      setState(() {
        _notifications = notifications;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  List<notif.AppNotification> get _filteredNotifications {
    if (_filter == 'unread') {
      return _notifications.where((n) => !n.isRead).toList();
    }
    return _notifications;
  }

  Future<void> _markAsRead(String notificationId) async {
    final uid = AppAuthScope.of(context).userId;
    if (uid == null) return;
    try {
      await updateNotification(uid, notificationId, {
        'isRead': true,
        'readAt': FieldValue.serverTimestamp(),
      });
      if (!mounted) return;
      await _load(uid);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  Future<void> _markAllAsRead() async {
    final uid = AppAuthScope.of(context).userId;
    if (uid == null) return;
    final unread = _notifications.where((n) => !n.isRead).toList();
    if (unread.isEmpty) return;
    try {
      for (final n in unread) {
        await updateNotification(uid, n.id, {
          'isRead': true,
          'readAt': FieldValue.serverTimestamp(),
        });
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Toutes les notifications ont été marquées comme lues')),
      );
      await _load(uid);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  Future<void> _deleteNotification(String notificationId) async {
    final uid = AppAuthScope.of(context).userId;
    if (uid == null) return;
    try {
      await deleteNotification(uid, notificationId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Notification supprimée')),
      );
      await _load(uid);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  void _handleNotificationTap(notif.AppNotification n) {
    if (!n.isRead) {
      _markAsRead(n.id);
    }
    if (n.actionUrl != null && n.actionUrl!.isNotEmpty) {
      // TODO: Navigate to actionUrl if needed
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final uid = AppAuthScope.of(context).userId;

    if (_loading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'Chargement...',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text(_error ?? '', textAlign: TextAlign.center),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: uid != null ? () => _load(uid) : null,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    final filtered = _filteredNotifications;
    final unreadCount = _notifications.where((n) => !n.isRead).length;

    return RefreshIndicator(
      onRefresh: () async {
        if (uid != null) await _load(uid);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildFilters(theme),
            if (unreadCount > 0) ...[
              const SizedBox(height: 12),
              _buildMarkAllAsReadButton(theme),
            ],
            const SizedBox(height: 16),
            _buildNotificationsList(theme, filtered),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters(ThemeData theme) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChip(
            label: 'Tous',
            selected: _filter == 'all',
            onTap: () => setState(() => _filter = 'all'),
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Non lues',
            selected: _filter == 'unread',
            onTap: () => setState(() => _filter = 'unread'),
          ),
        ],
      ),
    );
  }

  Widget _buildMarkAllAsReadButton(ThemeData theme) {
    return OutlinedButton.icon(
      onPressed: _markAllAsRead,
      icon: const Icon(Icons.done_all),
      label: const Text('Tout marquer comme lu'),
    );
  }

  Widget _buildNotificationsList(ThemeData theme, List<notif.AppNotification> list) {
    if (list.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Text(
              'Aucune notification',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      );
    }
    return Column(
      children: [
        for (final n in list) _buildNotificationCard(theme, n),
      ],
    );
  }

  Widget _buildNotificationCard(ThemeData theme, notif.AppNotification n) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _handleNotificationTap(n),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                n.title,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: n.isRead ? FontWeight.normal : FontWeight.bold,
                                ),
                              ),
                            ),
                            if (!n.isRead)
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          n.message,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _priorityChip(theme, n.priority),
                            const SizedBox(width: 8),
                            Text(
                              _formatDate(n.createdAt),
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (!n.isRead)
                    TextButton(
                      onPressed: () => _markAsRead(n.id),
                      child: const Text('Marquer comme lu'),
                    ),
                  TextButton(
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Supprimer la notification'),
                          content: const Text('Supprimer cette notification ?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: const Text('Annuler'),
                            ),
                            FilledButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              child: const Text('Supprimer'),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) await _deleteNotification(n.id);
                    },
                    child: Text(
                      'Supprimer',
                      style: TextStyle(color: theme.colorScheme.error),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _priorityChip(ThemeData theme, NotificationPriority priority) {
    Color color;
    String label;
    switch (priority) {
      case NotificationPriority.urgent:
        color = theme.colorScheme.error;
        label = 'Urgent';
        break;
      case NotificationPriority.high:
        color = theme.colorScheme.tertiary;
        label = 'Élevé';
        break;
      case NotificationPriority.medium:
        color = theme.colorScheme.primary;
        label = 'Moyen';
        break;
      case NotificationPriority.low:
        color = theme.colorScheme.onSurfaceVariant;
        label = 'Faible';
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _formatDate(Timestamp ts) {
    final d = ts.toDate();
    final now = DateTime.now();
    final diff = now.difference(d);
    if (diff.inDays == 0) {
      if (diff.inHours == 0) {
        if (diff.inMinutes == 0) {
          return 'À l\'instant';
        }
        return 'Il y a ${diff.inMinutes} min';
      }
      return 'Il y a ${diff.inHours} h';
    }
    if (diff.inDays == 1) {
      return 'Hier';
    }
    if (diff.inDays < 7) {
      return 'Il y a ${diff.inDays} jours';
    }
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    );
  }
}
