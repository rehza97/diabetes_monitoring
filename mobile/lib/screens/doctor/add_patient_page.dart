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

class DoctorAddPatientPage extends StatefulWidget {
  const DoctorAddPatientPage({super.key});

  @override
  State<DoctorAddPatientPage> createState() => _DoctorAddPatientPageState();
}

class _DoctorAddPatientPageState extends State<DoctorAddPatientPage> {
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
    _hasLoaded = true;
    _loadNurses();
  }

  Future<void> _loadNurses() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final nurses = await queryUsers((q) => q
          .where('role', isEqualTo: 'nurse')
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true));
      if (!mounted) return;
      setState(() {
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
    final uid = AppAuthScope.of(context).userId;
    if (uid == null) return;

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
      final dob = approximateDobFromAge(age ?? 0);
      final diagnosisDate = DateTime(diagnosisYear, 1, 1);

      final addressRaw = data['address'] as String?;
      PatientAddress? address;
      if (addressRaw != null && addressRaw.trim().isNotEmpty) {
        address = PatientAddress(street: addressRaw.trim());
      }

      final dto = CreatePatientDto(
        firstName: data['firstName'] as String,
        lastName: data['lastName'] as String,
        dateOfBirth: Timestamp.fromDate(dob),
        gender: data['gender'] as String,
        phone: (data['phone'] as String?) ?? '',
        diabetesType: data['diabetesType'] as DiabetesType,
        diagnosisDate: Timestamp.fromDate(diagnosisDate),
        doctorId: uid,
        address: address,
        bloodType: data['bloodType'] as String?,
        weight: data['weight'] as double?,
        height: data['height'] as double?,
        nurseId: data['nurseId'] as String?,
      );

      await createPatient(dto);
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Patient créé')),
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
    final uid = AppAuthScope.of(context).userId;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Ajouter un patient'),
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
          title: const Text('Ajouter un patient'),
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
                  onPressed: uid != null ? _loadNurses : null,
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ajouter un patient'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: PatientForm(
        initialData: null,
        isEditMode: false,
        nurses: _nurses,
        onSubmit: _onSubmit,
        isSubmitting: _submitting,
      ),
    );
  }
}
