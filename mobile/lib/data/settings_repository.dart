import '../models/enums.dart';
import '../models/reading.dart';
import '../models/setting.dart';
import 'firestore_paths.dart';

Future<Setting?> getSetting(String key) async {
  final q = settingsCollection()
      .where('key', isEqualTo: key)
      .limit(1);
  final snap = await q.get();
  if (snap.docs.isEmpty) return null;
  return snap.docs.first.data();
}

Future<List<Setting>> getSettingsByCategory(String category) async {
  final q = settingsCollection()
      .where('category', isEqualTo: category)
      .orderBy('updatedAt', descending: true);
  final snap = await q.get();
  return snap.docs.map((d) => d.data()).toList();
}

double _toNum(dynamic v) {
  if (v is num && !v.isNaN) return v.toDouble();
  if (v is int) return v.toDouble();
  if (v is double) return v;
  final n = num.tryParse(v?.toString() ?? '');
  return (n != null && !n.isNaN) ? n.toDouble() : 0;
}

Future<MeasurementThresholds> getMeasurementThresholds() async {
  try {
    final rows = await getSettingsByCategory('measurements');
    final m = <String, dynamic>{};
    for (final s in rows) {
      m[s.key] = s.value;
    }
    return MeasurementThresholds(
      normalMin: _toNum(m['measurements.normal_min']) != 0
          ? _toNum(m['measurements.normal_min'])
          : defaultThresholds.normalMin,
      normalMax: _toNum(m['measurements.normal_max']) != 0
          ? _toNum(m['measurements.normal_max'])
          : defaultThresholds.normalMax,
      warningMin: _toNum(m['measurements.warning_min']) != 0
          ? _toNum(m['measurements.warning_min'])
          : defaultThresholds.warningMin,
      warningMax: _toNum(m['measurements.warning_max']) != 0
          ? _toNum(m['measurements.warning_max'])
          : defaultThresholds.warningMax,
      criticalMin: _toNum(m['measurements.critical_min']) != 0
          ? _toNum(m['measurements.critical_min'])
          : defaultThresholds.criticalMin,
      criticalMax: _toNum(m['measurements.critical_max']) != 0
          ? _toNum(m['measurements.critical_max'])
          : defaultThresholds.criticalMax,
    );
  } catch (_) {
    return MeasurementThresholds(
      normalMin: defaultThresholds.normalMin,
      normalMax: defaultThresholds.normalMax,
      warningMin: defaultThresholds.warningMin,
      warningMax: defaultThresholds.warningMax,
      criticalMin: defaultThresholds.criticalMin,
      criticalMax: defaultThresholds.criticalMax,
    );
  }
}

/// Compute reading status from value, unit, and thresholds. Mirror frontend logic.
ReadingStatus calculateReadingStatus(
  double value,
  ReadingUnit unit,
  MeasurementThresholds thresholds,
) {
  final valueMgDl = unit == ReadingUnit.mmolL ? value * 18.0182 : value;
  final t = thresholds;
  if (valueMgDl < t.criticalMin || valueMgDl > t.criticalMax) {
    return ReadingStatus.critical;
  }
  if (valueMgDl >= t.normalMin && valueMgDl <= t.normalMax) {
    return ReadingStatus.normal;
  }
  return ReadingStatus.warning;
}
