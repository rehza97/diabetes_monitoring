import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/patient.dart';
import '../models/reading.dart';
import '../models/medical_note.dart';
import '../models/medication.dart';

Future<Uint8List> exportPatientReportToPDF({
  required Patient patient,
  required List<Reading> readings,
  required List<MedicalNote> notes,
  required List<Medication> medications,
}) async {
  final pdf = pw.Document();

  pdf.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(40),
      build: (pw.Context context) {
        return [
          // Header
          pw.Header(
            level: 0,
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  'Rapport Patient',
                  style: pw.TextStyle(
                    fontSize: 24,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.Text(
                  'Généré le ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
                  style: const pw.TextStyle(fontSize: 10),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 20),

          // Patient Information
          pw.Header(
            level: 1,
            child: pw.Text('Informations Patient'),
          ),
          pw.Table(
            border: pw.TableBorder.all(),
            children: [
              _buildTableRow('Nom complet', '${patient.firstName} ${patient.lastName}'),
              _buildTableRow('Numéro de dossier', patient.fileNumber),
              _buildTableRow('Date de naissance', _formatDate(patient.dateOfBirth)),
              _buildTableRow('Type de diabète', _diabetesTypeLabel(patient.diabetesType)),
              _buildTableRow('Date de diagnostic', _formatDate(patient.diagnosisDate)),
              if (patient.phone.isNotEmpty)
                _buildTableRow('Téléphone', patient.phone),
              if (patient.email != null && patient.email!.isNotEmpty)
                _buildTableRow('Email', patient.email!),
            ],
          ),
          pw.SizedBox(height: 20),

          // Readings Section
          pw.Header(
            level: 1,
            child: pw.Text('Mesures (${readings.length})'),
          ),
          if (readings.isEmpty)
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text('Aucune mesure enregistrée'),
            )
          else
            pw.Table(
              border: pw.TableBorder.all(),
              columnWidths: {
                0: const pw.FlexColumnWidth(2),
                1: const pw.FlexColumnWidth(1),
                2: const pw.FlexColumnWidth(1),
                3: const pw.FlexColumnWidth(1),
              },
              children: [
                pw.TableRow(
                  decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                  children: [
                    _buildTableCell('Date/Heure', isHeader: true),
                    _buildTableCell('Valeur', isHeader: true),
                    _buildTableCell('Type', isHeader: true),
                    _buildTableCell('Statut', isHeader: true),
                  ],
                ),
                ...readings.take(50).map((reading) {
                  final unit = reading.unit.toString().split('.').last == 'mgDl' ? 'mg/dL' : 'mmol/L';
                  return pw.TableRow(
                    children: [
                      _buildTableCell(_formatDateTime(reading.date)),
                      _buildTableCell('${reading.value.toStringAsFixed(0)} $unit'),
                      _buildTableCell(_readingTypeLabel(reading.readingType)),
                      _buildTableCell(_readingStatusLabel(reading.status)),
                    ],
                  );
                }),
              ],
            ),
          pw.SizedBox(height: 20),

          // Medications Section
          if (medications.isNotEmpty) ...[
            pw.Header(
              level: 1,
              child: pw.Text('Médicaments (${medications.length})'),
            ),
            pw.Table(
              border: pw.TableBorder.all(),
              columnWidths: {
                0: const pw.FlexColumnWidth(2),
                1: const pw.FlexColumnWidth(1),
                2: const pw.FlexColumnWidth(1),
                3: const pw.FlexColumnWidth(1),
              },
              children: [
                pw.TableRow(
                  decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                  children: [
                    _buildTableCell('Médicament', isHeader: true),
                    _buildTableCell('Dosage', isHeader: true),
                    _buildTableCell('Fréquence', isHeader: true),
                    _buildTableCell('Statut', isHeader: true),
                  ],
                ),
                ...medications.map((med) {
                  return pw.TableRow(
                    children: [
                      _buildTableCell(med.medicationName),
                      _buildTableCell(med.dosage),
                      _buildTableCell(med.frequency),
                      _buildTableCell(med.isActive ? 'Actif' : 'Terminé'),
                    ],
                  );
                }),
              ],
            ),
            pw.SizedBox(height: 20),
          ],

          // Notes Section
          if (notes.isNotEmpty) ...[
            pw.Header(
              level: 1,
              child: pw.Text('Notes Médicales (${notes.length})'),
            ),
            ...notes.take(20).map((note) {
              return pw.Container(
                margin: const pw.EdgeInsets.only(bottom: 10),
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey300),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          _noteTypeLabel(note.noteType),
                          style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                        ),
                        pw.Text(
                          _formatDate(note.createdAt),
                          style: const pw.TextStyle(fontSize: 10),
                        ),
                      ],
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(note.content),
                  ],
                ),
              );
            }),
          ],
        ];
      },
    ),
  );

  return pdf.save();
}

pw.TableRow _buildTableRow(String label, String value) {
  return pw.TableRow(
    children: [
      pw.Padding(
        padding: const pw.EdgeInsets.all(8),
        child: pw.Text(
          label,
          style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
        ),
      ),
      pw.Padding(
        padding: const pw.EdgeInsets.all(8),
        child: pw.Text(value),
      ),
    ],
  );
}

pw.Widget _buildTableCell(String text, {bool isHeader = false}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.all(8),
    child: pw.Text(
      text,
      style: isHeader
          ? pw.TextStyle(fontWeight: pw.FontWeight.bold)
          : const pw.TextStyle(),
    ),
  );
}

String _formatDate(Timestamp timestamp) {
  final date = timestamp.toDate();
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}

String _formatDateTime(Timestamp timestamp) {
  final date = timestamp.toDate();
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
}

String _diabetesTypeLabel(dynamic type) {
  final typeStr = type.toString();
  if (typeStr.contains('type1')) return 'Type 1';
  if (typeStr.contains('type2')) return 'Type 2';
  if (typeStr.contains('gestational')) return 'Gestationnel';
  return typeStr;
}

String _readingTypeLabel(dynamic type) {
  final typeStr = type.toString();
  if (typeStr.contains('fasting')) return 'À jeun';
  if (typeStr.contains('postBreakfast')) return 'Après petit-déj';
  if (typeStr.contains('preLunch')) return 'Avant déj';
  if (typeStr.contains('postLunch')) return 'Après déj';
  if (typeStr.contains('preDinner')) return 'Avant dîner';
  if (typeStr.contains('postDinner')) return 'Après dîner';
  if (typeStr.contains('bedtime')) return 'Au coucher';
  if (typeStr.contains('midnight')) return 'Minuit';
  return 'Aléatoire';
}

String _readingStatusLabel(dynamic status) {
  final statusStr = status.toString();
  if (statusStr.contains('normal')) return 'Normal';
  if (statusStr.contains('warning')) return 'Attention';
  if (statusStr.contains('critical')) return 'Critique';
  return statusStr;
}

String _noteTypeLabel(dynamic type) {
  final typeStr = type.toString();
  if (typeStr.contains('diagnosis')) return 'Diagnostic';
  if (typeStr.contains('prescription')) return 'Ordonnance';
  if (typeStr.contains('observation')) return 'Observation';
  if (typeStr.contains('followup')) return 'Suivi';
  return typeStr;
}
