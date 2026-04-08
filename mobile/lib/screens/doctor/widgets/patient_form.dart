import 'package:flutter/material.dart';

import '../../../models/enums.dart';
import '../../../models/patient.dart';
import '../../../models/user.dart';
import '../../../utils/validators.dart';

/// Emitted form data: camelCase keys. [age] is int; [diagnosisYear] is int (stored as Jan 1 of that year).
/// Optional fields may be omitted when empty.
typedef PatientFormData = Map<String, dynamic>;

class PatientForm extends StatefulWidget {
  const PatientForm({
    super.key,
    this.initialData,
    required this.isEditMode,
    required this.nurses,
    this.doctorName,
    required this.onSubmit,
    this.isSubmitting = false,
  });

  final Patient? initialData;
  final bool isEditMode;
  final List<User> nurses;
  final String? doctorName;
  final void Function(PatientFormData data) onSubmit;
  final bool isSubmitting;

  @override
  State<PatientForm> createState() => _PatientFormState();
}

class _PatientFormState extends State<PatientForm> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ageController = TextEditingController();
  final _addressController = TextEditingController();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _diagnosisYearController = TextEditingController();

  String _gender = 'male';
  DiabetesType _diabetesType = DiabetesType.type2;
  /// Same values as web Select (empty = non renseigné).
  String _bloodType = '';
  String? _nurseId;

  static const _noneId = 'none';

  static const List<String> _bloodTypeValues = [
    '',
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];

  @override
  void initState() {
    super.initState();
    _applyInitialData();
  }

  @override
  void didUpdateWidget(PatientForm oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialData != widget.initialData) _applyInitialData();
  }

  void _applyInitialData() {
    final p = widget.initialData;
    if (p == null) {
      _gender = 'male';
      _diabetesType = DiabetesType.type2;
      _ageController.clear();
      _diagnosisYearController.clear();
      _nurseId = _noneId;
      return;
    }
    _firstNameController.text = p.firstName;
    _lastNameController.text = p.lastName;
    _phoneController.text = p.phone;
    _ageController.text =
        '${completedYearsFromBirthDate(p.dateOfBirth.toDate())}';
    _addressController.text = p.address?.street ?? '';
    final bt = (p.bloodType ?? '').trim();
    _bloodType = _bloodTypeValues.contains(bt) ? bt : '';
    _weightController.text = p.weight != null ? p.weight!.toString() : '';
    _heightController.text = p.height != null ? p.height!.toString() : '';
    _gender = p.gender;
    _diabetesType = p.diabetesType;
    _diagnosisYearController.text =
        '${p.diagnosisDate.toDate().year}';
    final nurseIds = widget.nurses.map((u) => u.id).toSet();
    _nurseId = p.nurseId != null &&
            p.nurseId!.isNotEmpty &&
            nurseIds.contains(p.nurseId)
        ? p.nurseId!
        : _noneId;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _ageController.dispose();
    _addressController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    _diagnosisYearController.dispose();
    super.dispose();
  }

  PatientFormData _collectData() {
    final address = _addressController.text.trim();
    final ageParsed = int.tryParse(_ageController.text.trim());
    final diagnosisYearParsed =
        int.tryParse(_diagnosisYearController.text.trim());
    return {
      'firstName': _firstNameController.text.trim(),
      'lastName': _lastNameController.text.trim(),
      'age': ageParsed,
      'gender': _gender,
      'phone': _phoneController.text.trim().replaceAll(RegExp(r'\s'), ''),
      'address': address.isEmpty ? null : address,
      'diabetesType': _diabetesType,
      'diagnosisYear': diagnosisYearParsed,
      'bloodType': _bloodType.isEmpty ? null : _bloodType,
      'weight': _parseDouble(_weightController.text),
      'height': _parseDouble(_heightController.text),
      'nurseId': _nurseId == _noneId || _nurseId == null || _nurseId!.isEmpty ? null : _nurseId,
    };
  }

  double? _parseDouble(String s) {
    final t = s.trim();
    if (t.isEmpty) return null;
    return double.tryParse(t);
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    widget.onSubmit(_collectData());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => FocusScope.of(context).unfocus(),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: IgnorePointer(
              ignoring: widget.isSubmitting,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Informations personnelles',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _firstNameController,
                    decoration: const InputDecoration(
                      labelText: 'Prénom',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim();
                      if (t.isEmpty) return null;
                      if (t.length < 2) return 'Au moins 2 caractères.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _lastNameController,
                    decoration: const InputDecoration(
                      labelText: 'Nom',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim();
                      if (t.isEmpty) return null;
                      if (t.length < 2) return 'Au moins 2 caractères.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _ageController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Âge (optionnel)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.cake_outlined),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim();
                      if (t.isEmpty) return null;
                      final n = int.tryParse(t);
                      if (n == null) return 'Nombre entier requis.';
                      if (n < 0) return 'L\'âge doit être au moins 0';
                      if (n > 120) return 'L\'âge est trop élevé';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Sexe',
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _gender,
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(value: 'male', child: Text('Masculin')),
                          DropdownMenuItem(value: 'female', child: Text('Féminin')),
                        ],
                        onChanged: (v) => setState(() => _gender = v ?? 'male'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Téléphone (optionnel)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim().replaceAll(RegExp(r'\s'), '');
                      if (t.isEmpty) return null;
                      if (!isValidFrenchPhone(t)) {
                        return 'Numéro de téléphone invalide';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _addressController,
                    decoration: const InputDecoration(
                      labelText: 'Adresse (optionnel)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Informations médicales',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Type de diabète',
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<DiabetesType>(
                        value: _diabetesType,
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(value: DiabetesType.type1, child: Text('Type 1')),
                          DropdownMenuItem(value: DiabetesType.type2, child: Text('Type 2')),
                          DropdownMenuItem(value: DiabetesType.gestational, child: Text('Gestationnel')),
                        ],
                        onChanged: (v) => setState(() => _diabetesType = v ?? DiabetesType.type2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _diagnosisYearController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Année de diagnostic',
                      hintText:
                          '1900–${DateTime.now().year}',
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.calendar_today),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim();
                      if (t.isEmpty) return null;
                      final n = int.tryParse(t);
                      if (n == null) return 'Nombre entier requis.';
                      if (n < 1900) return 'Année invalide';
                      if (n > DateTime.now().year) {
                        return 'L\'année ne peut pas être dans le futur';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Groupe sanguin',
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _bloodType.isEmpty ? '' : _bloodType,
                        isExpanded: true,
                        hint: const Text('Sélectionner'),
                        items: [
                          const DropdownMenuItem(
                            value: '',
                            child: Text('Non renseigné'),
                          ),
                          ..._bloodTypeValues
                              .where((x) => x.isNotEmpty)
                              .map(
                                (x) => DropdownMenuItem(
                                  value: x,
                                  child: Text(x),
                                ),
                              ),
                        ],
                        onChanged: (v) =>
                            setState(() => _bloodType = v ?? ''),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _weightController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Poids kg (optionnel)',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      final n = _parseDouble(v ?? '');
                      if (n != null && n <= 0) return 'Poids positif.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _heightController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Taille cm (optionnel)',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      final n = _parseDouble(v ?? '');
                      if (n != null && n <= 0) return 'Taille positive.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Assignation',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (widget.isEditMode && widget.doctorName != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Médecin assigné',
                          border: OutlineInputBorder(),
                        ),
                        child: Text(widget.doctorName!),
                      ),
                    ),
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Infirmier(ère) (optionnel)',
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _nurseId ?? _noneId,
                        isExpanded: true,
                        items: [
                          const DropdownMenuItem(value: _noneId, child: Text('Aucun')),
                          ...widget.nurses.map((u) => DropdownMenuItem<String>(
                                value: u.id,
                                child: Text('${u.firstName} ${u.lastName}'.trim().isEmpty ? u.email : '${u.firstName} ${u.lastName}'.trim()),
                              )),
                        ],
                        onChanged: (v) => setState(() => _nurseId = v ?? _noneId),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  FilledButton(
                    onPressed: widget.isSubmitting ? null : _submit,
                    child: widget.isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(widget.isEditMode ? 'Enregistrer' : 'Créer le patient'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
