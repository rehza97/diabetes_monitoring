// Shared validation helpers. Used by Login, Forgot password, and Patient form.

final RegExp emailRegex = RegExp(r'^[\w.-]+@[\w.-]+\.\w+$');

/// French phone: (+33|0) + 9 digits, first digit 1–9.
final RegExp frenchPhoneRegex = RegExp(r'^(\+33|0)[1-9](\d{2}){4}$');

bool isValidEmail(String? v) =>
    v != null && v.trim().isNotEmpty && emailRegex.hasMatch(v.trim());

bool isValidFrenchPhone(String? v) =>
    v != null && v.trim().isNotEmpty && frenchPhoneRegex.hasMatch(v.trim().replaceAll(RegExp(r'\s'), ''));

/// True if [s] is a non-empty, parseable date string.
bool isValidDateString(String? s) {
  if (s == null || s.trim().isEmpty) return false;
  final d = DateTime.tryParse(s.trim());
  return d != null;
}

/// True if [d] is not in the future (today or past).
bool isDateNotInFuture(DateTime? d) =>
    d != null && d.isBefore(DateTime.now().add(const Duration(days: 1)));

/// HH:mm (e.g. 09:30, 23:59).
final RegExp timeHHmmRegex = RegExp(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

bool isValidTimeHHmm(String? v) =>
    v != null && v.trim().isNotEmpty && timeHHmmRegex.hasMatch(v.trim());

/// Completed years since [birthDate] (aligned with the web app's age calculation).
int completedYearsFromBirthDate(DateTime birthDate) {
  final today = DateTime.now();
  var age = today.year - birthDate.year;
  final monthDiff = today.month - birthDate.month;
  if (monthDiff < 0 || (monthDiff == 0 && today.day < birthDate.day)) {
    age--;
  }
  return age;
}

/// Birth date to store when the user only entered an age (same day/month as today).
DateTime approximateDobFromAge(int age) {
  final now = DateTime.now();
  return DateTime(now.year - age, now.month, now.day);
}
