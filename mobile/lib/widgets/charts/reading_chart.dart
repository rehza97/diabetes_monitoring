import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../models/reading.dart';
import '../../models/enums.dart';

enum ChartPeriod { week, month, threeMonths }

class ReadingChart extends StatelessWidget {
  const ReadingChart({
    super.key,
    required this.readings,
    required this.period,
    this.height = 200,
  });

  final List<Reading> readings;
  final ChartPeriod period;
  final double height;

  List<FlSpot> _getSpots() {
    if (readings.isEmpty) return [];

    // Sort by date
    final sorted = List<Reading>.from(readings)..sort((a, b) => a.date.compareTo(b.date));

    // Filter by period
    final now = DateTime.now();
    DateTime startDate;
    switch (period) {
      case ChartPeriod.week:
        startDate = now.subtract(const Duration(days: 7));
        break;
      case ChartPeriod.month:
        startDate = now.subtract(const Duration(days: 30));
        break;
      case ChartPeriod.threeMonths:
        startDate = now.subtract(const Duration(days: 90));
        break;
    }

    final filtered = sorted.where((r) {
      final readingDate = r.date.toDate();
      return readingDate.isAfter(startDate) || readingDate.isAtSameMomentAs(startDate);
    }).toList();

    if (filtered.isEmpty) return [];

    // Convert to spots (x = index, y = value in mg/dL)
    return filtered.asMap().entries.map((entry) {
      final index = entry.key.toDouble();
      final reading = entry.value;
      // Convert to mg/dL if needed
      double value = reading.value;
      if (reading.unit == ReadingUnit.mmolL) {
        value = value * 18.0182;
      }
      return FlSpot(index, value);
    }).toList();
  }

  Color _getColorForValue(double value) {
    if (value < 70 || value > 180) {
      return Colors.red; // Critical
    } else if (value >= 140 && value <= 180) {
      return Colors.orange; // Warning
    } else {
      return Colors.green; // Normal
    }
  }

  @override
  Widget build(BuildContext context) {
    final spots = _getSpots();
    final theme = Theme.of(context);

    if (spots.isEmpty) {
      return SizedBox(
        height: height,
        child: Center(
          child: Text(
            'Aucune donnée disponible',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    // Get min/max for y-axis
    final values = spots.map((s) => s.y).toList();
    final minY = (values.reduce((a, b) => a < b ? a : b) * 0.9).floorToDouble();
    final maxY = (values.reduce((a, b) => a > b ? a : b) * 1.1).ceilToDouble();

    return SizedBox(
      height: height,
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 20,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
                strokeWidth: 1,
              );
            },
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                interval: spots.length > 10 ? (spots.length / 5).ceilToDouble() : 1,
                getTitlesWidget: (value, meta) {
                  if (value.toInt() >= spots.length) return const Text('');
                  final reading = readings[value.toInt()];
                  final date = reading.date.toDate();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      '${date.day}/${date.month}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  );
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 50,
                interval: 20,
                getTitlesWidget: (value, meta) {
                  return Text(
                    value.toInt().toString(),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(
            show: true,
            border: Border.all(
              color: theme.colorScheme.outline.withOpacity(0.3),
            ),
          ),
          minX: 0,
          maxX: spots.length > 0 ? (spots.length - 1).toDouble() : 0,
          minY: minY,
          maxY: maxY,
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: theme.colorScheme.primary,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: theme.colorScheme.primary.withOpacity(0.1),
              ),
            ),
          ],
          // Add colored zones for normal/warning/critical ranges
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (touchedSpot) => Colors.transparent,
              tooltipRoundedRadius: 8,
              getTooltipItems: (List<LineBarSpot> touchedSpots) {
                return touchedSpots.map((spot) {
                  final index = spot.x.toInt();
                  if (index >= readings.length) {
                    return LineTooltipItem('', const TextStyle());
                  }
                  final reading = readings[index];
                  final date = reading.date.toDate();
                  final value = spot.y;
                  final unit = reading.unit == ReadingUnit.mmolL ? 'mmol/L' : 'mg/dL';
                  final displayValue = reading.unit == ReadingUnit.mmolL ? reading.value : value;
                  
                  return LineTooltipItem(
                    '${displayValue.toStringAsFixed(0)} $unit\n${date.day}/${date.month}/${date.year}',
                    TextStyle(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.bold,
                    ),
                  );
                }).toList();
              },
            ),
          ),
        ),
      ),
    );
  }
}
