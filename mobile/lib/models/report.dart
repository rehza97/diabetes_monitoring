import 'package:cloud_firestore/cloud_firestore.dart';

import 'enums.dart';

class ReportFilter {
  ReportFilter({
    this.patientIds,
    this.userIds,
    this.dateFrom,
    this.dateTo,
    this.readingTypes,
    this.status,
    this.diabetesTypes,
  });

  final List<String>? patientIds;
  final List<String>? userIds;
  final Timestamp? dateFrom;
  final Timestamp? dateTo;
  final List<String>? readingTypes;
  final List<String>? status;
  final List<String>? diabetesTypes;

  Map<String, dynamic> toMap() => {
        if (patientIds != null) 'patientIds': patientIds,
        if (userIds != null) 'userIds': userIds,
        if (dateFrom != null) 'dateFrom': dateFrom,
        if (dateTo != null) 'dateTo': dateTo,
        if (readingTypes != null) 'readingTypes': readingTypes,
        if (status != null) 'status': status,
        if (diabetesTypes != null) 'diabetesTypes': diabetesTypes,
      };

  static ReportFilter fromMap(Map<String, dynamic>? m) {
    if (m == null || m.isEmpty) return ReportFilter();
    return ReportFilter(
      patientIds: (m['patientIds'] as List<dynamic>?)?.cast<String>(),
      userIds: (m['userIds'] as List<dynamic>?)?.cast<String>(),
      dateFrom: m['dateFrom'] as Timestamp?,
      dateTo: m['dateTo'] as Timestamp?,
      readingTypes: (m['readingTypes'] as List<dynamic>?)?.cast<String>(),
      status: (m['status'] as List<dynamic>?)?.cast<String>(),
      diabetesTypes: (m['diabetesTypes'] as List<dynamic>?)?.cast<String>(),
    );
  }
}

class ReportScheduleConfig {
  ReportScheduleConfig({
    required this.frequency,
    this.dayOfWeek,
    this.dayOfMonth,
    this.time,
    this.recipients,
  });

  final String frequency; // 'daily' | 'weekly' | 'monthly'
  final int? dayOfWeek;
  final int? dayOfMonth;
  final String? time;
  final List<String>? recipients;

  Map<String, dynamic> toMap() => {
        'frequency': frequency,
        if (dayOfWeek != null) 'dayOfWeek': dayOfWeek,
        if (dayOfMonth != null) 'dayOfMonth': dayOfMonth,
        if (time != null) 'time': time,
        if (recipients != null) 'recipients': recipients,
      };

  static ReportScheduleConfig? fromMap(Map<String, dynamic>? m) {
    if (m == null || m['frequency'] == null) return null;
    return ReportScheduleConfig(
      frequency: m['frequency'] as String,
      dayOfWeek: m['dayOfWeek'] as int?,
      dayOfMonth: m['dayOfMonth'] as int?,
      time: m['time'] as String?,
      recipients: (m['recipients'] as List<dynamic>?)?.cast<String>(),
    );
  }
}

class CreateReportDto {
  CreateReportDto({
    required this.name,
    required this.type,
    required this.filters,
    this.isScheduled,
    this.scheduleConfig,
  });

  final String name;
  final ReportType type;
  final ReportFilter filters;
  final bool? isScheduled;
  final ReportScheduleConfig? scheduleConfig;

  Map<String, dynamic> toMap() => {
        'name': name,
        'type': reportTypeToFirestore(type),
        'filters': filters.toMap(),
        if (isScheduled != null) 'isScheduled': isScheduled,
        if (scheduleConfig != null) 'scheduleConfig': scheduleConfig!.toMap(),
      };
}

/// Report. Firestore path: reports/{reportId}.
class Report {
  Report({
    required this.id,
    required this.name,
    required this.type,
    required this.filters,
    required this.createdById,
    required this.isScheduled,
    required this.createdAt,
    required this.updatedAt,
    this.scheduleConfig,
    this.lastGeneratedAt,
  });

  final String id;
  final String name;
  final ReportType type;
  final ReportFilter filters;
  final String createdById;
  final bool isScheduled;
  final Timestamp createdAt;
  final Timestamp updatedAt;
  final ReportScheduleConfig? scheduleConfig;
  final Timestamp? lastGeneratedAt;

  static Report fromFirestore(DocumentSnapshot<Map<String, dynamic>> snap) {
    final m = snap.data() ?? {};
    return Report(
      id: snap.id,
      name: m['name'] as String? ?? '',
      type: reportTypeFromFirestore((m['type'] as String?) ?? 'custom'),
      filters: ReportFilter.fromMap(
        m['filters'] is Map ? Map<String, dynamic>.from(m['filters'] as Map) : null,
      ),
      createdById: m['createdById'] as String? ?? '',
      isScheduled: m['isScheduled'] as bool? ?? false,
      createdAt: m['createdAt'] as Timestamp? ?? Timestamp.now(),
      updatedAt: m['updatedAt'] as Timestamp? ?? Timestamp.now(),
      scheduleConfig: ReportScheduleConfig.fromMap(
        m['scheduleConfig'] is Map ? Map<String, dynamic>.from(m['scheduleConfig'] as Map) : null,
      ),
      lastGeneratedAt: m['lastGeneratedAt'] as Timestamp?,
    );
  }

  Map<String, dynamic> toMap({bool includeId = false}) {
    final map = <String, dynamic>{
      'name': name,
      'type': reportTypeToFirestore(type),
      'filters': filters.toMap(),
      'createdById': createdById,
      'isScheduled': isScheduled,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      if (scheduleConfig != null) 'scheduleConfig': scheduleConfig!.toMap(),
      if (lastGeneratedAt != null) 'lastGeneratedAt': lastGeneratedAt,
    };
    if (includeId) map['id'] = id;
    return map;
  }
}
