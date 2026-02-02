import 'package:flutter/material.dart';

import '../../../models/enums.dart';
import '../../../models/patient.dart';
import '../../../models/user.dart';
import '../../../utils/validators.dart';

/// Emitted form data: camelCase keys. Dates as [DateTime]; parent converts to [Timestamp].
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
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _bloodTypeController = TextEditingController();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();

  String _gender = 'male';
  DiabetesType _diabetesType = DiabetesType.type2;
  DateTime? _dateOfBirth;
  DateTime? _diagnosisDate;
  String? _nurseId;

  static const _noneId = 'none';

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
      _dateOfBirth = null;
      _diagnosisDate = null;
      _nurseId = _noneId;
      return;
    }
    _firstNameController.text = p.firstName;
    _lastNameController.text = p.lastName;
    _phoneController.text = p.phone;
    _emailController.text = p.email ?? '';
    _addressController.text = p.address?.street ?? '';
    _bloodTypeController.text = p.bloodType ?? '';
    _weightController.text = p.weight != null ? p.weight!.toString() : '';
    _heightController.text = p.height != null ? p.height!.toString() : '';
    _gender = p.gender;
    _diabetesType = p.diabetesType;
    _dateOfBirth = p.dateOfBirth.toDate();
    _diagnosisDate = p.diagnosisDate.toDate();
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
    _emailController.dispose();
    _addressController.dispose();
    _bloodTypeController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(BuildContext context, bool isDiagnosis) async {
    final initial = isDiagnosis ? _diagnosisDate : _dateOfBirth;
    final first = DateTime(1900);
    final last = isDiagnosis ? DateTime.now() : DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial ?? DateTime.now(),
      firstDate: first,
      lastDate: last,
    );
    if (picked == null || !mounted) return;
    setState(() {
      if (isDiagnosis) {
        _diagnosisDate = picked;
      } else {
        _dateOfBirth = picked;
      }
    });
  }

  PatientFormData _collectData() {
    final address = _addressController.text.trim();
    return {
      'firstName': _firstNameController.text.trim(),
      'lastName': _lastNameController.text.trim(),
      'dateOfBirth': _dateOfBirth,
      'gender': _gender,
      'phone': _phoneController.text.trim().replaceAll(RegExp(r'\s'), ''),
      'email': _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
      'address': address.isEmpty ? null : address,
      'diabetesType': _diabetesType,
      'diagnosisDate': _diagnosisDate,
      'bloodType': _bloodTypeController.text.trim().isEmpty ? null : _bloodTypeController.text.trim(),
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
    if (_dateOfBirth == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Date de naissance requise')),
      );
      return;
    }
    if (_diagnosisDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Date de diagnostic requise')),
      );
      return;
    }
    if (!isDateNotInFuture(_diagnosisDate)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('La date de diagnostic ne peut pas être dans le futur')),
      );
      return;
    }
    widget.onSubmit(_collectData());
  }

  String _formatDate(DateTime? d) {
    if (d == null) return '';
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
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
                      labelText: 'Prénom *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim();
                      if (t.isEmpty) return 'Prénom requis.';
                      if (t.length < 2) return 'Au moins 2 caractères.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _lastNameController,
                    decoration: const InputDecoration(
                      labelText: 'Nom *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim();
                      if (t.isEmpty) return 'Nom requis.';
                      if (t.length < 2) return 'Au moins 2 caractères.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    onTap: () => _pickDate(context, false),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date de naissance *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        _formatDate(_dateOfBirth),
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: _dateOfBirth == null
                              ? theme.colorScheme.onSurfaceVariant
                              : theme.colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Sexe *',
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
                      labelText: 'Téléphone *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim().replaceAll(RegExp(r'\s'), '');
                      if (t.isEmpty) return 'Téléphone requis.';
                      if (!isValidFrenchPhone(t)) return 'Numéro invalide (ex. 0612345678 ou +33612345678).';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email (optionnel)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                    validator: (v) {
                      final t = (v ?? '').trim();
                      if (t.isEmpty) return null;
                      return isValidEmail(t) ? null : 'Email invalide.';
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
                      labelText: 'Type de diabète *',
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
                  InkWell(
                    onTap: () => _pickDate(context, true),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date de diagnostic *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        _formatDate(_diagnosisDate),
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: _diagnosisDate == null
                              ? theme.colorScheme.onSurfaceVariant
                              : theme.colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _bloodTypeController,
                    decoration: const InputDecoration(
                      labelText: 'Groupe sanguin (optionnel)',
                      border: OutlineInputBorder(),
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
