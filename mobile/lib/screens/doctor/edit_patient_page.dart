import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import '../../data/patient_repository.dart';
import '../../data/user_repository.dart';
import '../../models/enums.dart';
import '../../models/patient.dart';
import '../../models/user.dart';
import '../../utils/validators.dart';
import 'widgets/patient_form.dart';

class DoctorEditPatientPage extends StatefulWidget {
  const DoctorEditPatientPage({super.key, this.patientId});

  final String? patientId;

  @override
  State<DoctorEditPatientPage> createState() => _DoctorEditPatientPageState();
}

class _DoctorEditPatientPageState extends State<DoctorEditPatientPage> {
  Patient? _patient;
  User? _doctor;
  List<User> _nurses = [];
  bool _loading = true;
  String? _error;
  bool _hasLoaded = false;
  bool _submitting = false;

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
    final pid = widget.patientId;
    if (pid == null) {
      _hasLoaded = true;
      setState(() => _loading = false);
      return;
    }
    _hasLoaded = true;
    _load(pid, uid);
  }

  Future<void> _load(String patientId, String uid) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final patient = await getPatient(patientId);
      if (!mounted) return;
      if (patient == null) {
        setState(() {
          _loading = false;
          _error = 'Patient introuvable';
        });
        return;
      }
      if (patient.doctorId != uid) {
        setState(() {
          _loading = false;
          _error = 'Vous n\'avez pas accès à ce patient';
        });
        return;
      }

      final doctor = await getUser(patient.doctorId);
      final nurses = await queryUsers((q) => q
          .where('role', isEqualTo: 'nurse')
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true));

      if (!mounted) return;
      setState(() {
        _patient = patient;
        _doctor = doctor;
        _nurses = nurses;
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

  void _onSubmit(PatientFormData data) async {
    final pid = widget.patientId;
    if (pid == null) return;

    setState(() => _submitting = true);
    try {
      final age = data['age'] as int?;
      final diagnosisYear = data['diagnosisYear'] as int?;
      if (diagnosisYear == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Année de diagnostic requise')),
        );
        setState(() => _submitting = false);
        return;
      }
      final diagnosisDate = DateTime(diagnosisYear, 1, 1);

      final addressRaw = data['address'] as String?;
      PatientAddress? address;
      if (addressRaw != null && addressRaw.trim().isNotEmpty) {
        address = PatientAddress(street: addressRaw.trim());
      }

      final partial = <String, dynamic>{
        'firstName': data['firstName'] as String,
        'lastName': data['lastName'] as String,
        'gender': data['gender'] as String,
        'phone': (data['phone'] as String?) ?? '',
        'diabetesType': (data['diabetesType'] as DiabetesType).name,
        'diagnosisDate': Timestamp.fromDate(diagnosisDate),
        'email': FieldValue.delete(),
        if (address != null) 'address': address.toMap(),
        if (data['bloodType'] != null &&
            (data['bloodType'] as String).isNotEmpty)
          'bloodType': data['bloodType'] as String
        else
          'bloodType': FieldValue.delete(),
        if (data['weight'] != null) 'weight': data['weight'] as double?,
        if (data['height'] != null) 'height': data['height'] as double?,
      };
      if (age != null) {
        partial['dateOfBirth'] =
            Timestamp.fromDate(approximateDobFromAge(age));
      }
      final nid = data['nurseId'] as String?;
      if (nid != null && nid.isNotEmpty) {
        partial['nurseId'] = nid;
      } else {
        partial['nurseId'] = FieldValue.delete();
      }

      await updatePatient(pid, partial);
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Patient modifié')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pid = widget.patientId;

    if (pid == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Modifier le patient'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Patient non spécifié',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Retour'),
              ),
            ],
          ),
        ),
      );
    }

    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Modifier le patient'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
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
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Modifier le patient'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
                const SizedBox(height: 16),
                Text(_error!, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () {
                    final uid = AppAuthScope.of(context).userId;
                    if (uid != null) _load(pid, uid);
                  },
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final p = _patient!;
    final doctorName = _doctor != null
        ? '${_doctor!.firstName} ${_doctor!.lastName}'.trim()
        : (p.doctorId.isNotEmpty ? 'Médecin' : '');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Modifier le patient'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: PatientForm(
        initialData: p,
        isEditMode: true,
        nurses: _nurses,
        doctorName: doctorName.isEmpty ? null : doctorName,
        onSubmit: _onSubmit,
        isSubmitting: _submitting,
      ),
    );
  }
}
