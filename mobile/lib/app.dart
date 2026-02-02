import 'package:flutter/material.dart';

import 'auth/app_auth_scope.dart';
import 'screens/admin_reject_page.dart';
import 'screens/auth_gate.dart';
import 'screens/forgot_password_page.dart';
import 'screens/settings_page.dart';
import 'screens/doctor/doctor_shell.dart';
import 'screens/doctor/add_patient_page.dart';
import 'screens/doctor/edit_patient_page.dart';
import 'screens/doctor/patient_detail_page.dart';
import 'screens/doctor/record_reading_page.dart';
import 'screens/doctor/search_page.dart';
import 'screens/nurse/nurse_shell.dart';
import 'screens/nurse/patient_detail_page.dart';
import 'screens/nurse/scheduled_readings_page.dart';
import 'screens/nurse/quick_record_page.dart';
import 'theme/app_theme.dart';
import 'theme/theme_scope.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  late final AppAuthState _auth = AppAuthState();
  final ValueNotifier<ThemeMode> _themeModeNotifier =
      ValueNotifier<ThemeMode>(ThemeMode.light);

  @override
  void dispose() {
    _themeModeNotifier.dispose();
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppAuthScope(
      auth: _auth,
      child: AppThemeScope(
        themeModeNotifier: _themeModeNotifier,
        child: ListenableBuilder(
          listenable: _themeModeNotifier,
          builder: (context, _) {
            return MaterialApp(
              title: 'Diabète – Médecins & Infirmiers',
              theme: appTheme,
              darkTheme: appThemeDark,
              themeMode: _themeModeNotifier.value,
              navigatorKey: _auth.navigatorKey,
              initialRoute: '/',
              onGenerateRoute: _onGenerateRoute,
            );
          },
        ),
      ),
    );
  }

  Route<dynamic>? _onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/':
        return MaterialPageRoute(builder: (_) => const AuthGate());
      case '/forgot-password':
        return MaterialPageRoute(builder: (_) => const ForgotPasswordPage());
      case '/settings':
        return MaterialPageRoute(builder: (_) => const SettingsPage());
      case '/admin-reject':
        return MaterialPageRoute(builder: (_) => const AdminRejectPage());
      case '/doctor':
        return MaterialPageRoute(builder: (_) => const DoctorShell());
      case '/doctor/patients/add':
        return MaterialPageRoute(builder: (_) => const DoctorAddPatientPage());
      case '/doctor/patient-detail': {
        final args = settings.arguments is Map ? settings.arguments as Map<dynamic, dynamic>? : null;
        final patientId = args?['patientId'] as String?;
        return MaterialPageRoute(
          builder: (_) => DoctorPatientDetailPage(patientId: patientId),
        );
      }
      case '/doctor/patient-edit': {
        final args = settings.arguments is Map ? settings.arguments as Map<dynamic, dynamic>? : null;
        final patientId = args?['patientId'] as String?;
        return MaterialPageRoute(
          builder: (_) => DoctorEditPatientPage(patientId: patientId),
        );
      }
      case '/doctor/record-reading': {
        final args = settings.arguments is Map ? settings.arguments as Map<dynamic, dynamic>? : null;
        final patientId = args?['patientId'] as String?;
        return MaterialPageRoute(
          builder: (_) => DoctorRecordReadingPage(patientId: patientId),
        );
      }
      case '/doctor/search':
        return MaterialPageRoute(builder: (_) => const DoctorSearchPage());
      case '/nurse':
        return MaterialPageRoute(builder: (_) => const NurseShell());
      case '/nurse/patient-detail': {
        final args = settings.arguments is Map ? settings.arguments as Map<dynamic, dynamic>? : null;
        final patientId = args?['patientId'] as String?;
        return MaterialPageRoute(
          builder: (_) => NursePatientDetailPage(patientId: patientId),
        );
      }
      case '/nurse/scheduled-readings':
        return MaterialPageRoute(builder: (_) => const NurseScheduledReadingsPage());
      case '/nurse/quick-record': {
        final args = settings.arguments is Map ? settings.arguments as Map<dynamic, dynamic>? : null;
        final patientId = args?['patientId'] as String?;
        return MaterialPageRoute(
          builder: (_) => NurseQuickRecordPage(patientId: patientId),
        );
      }
      default:
        return MaterialPageRoute(builder: (_) => const AuthGate());
    }
  }
}
