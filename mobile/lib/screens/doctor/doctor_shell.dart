import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import 'dashboard_page.dart';
import 'notifications_page.dart';
import 'patients_list_page.dart';
import 'record_reading_page.dart';
import 'reports_page.dart';

class DoctorShell extends StatefulWidget {
  const DoctorShell({super.key});

  @override
  State<DoctorShell> createState() => _DoctorShellState();
}

class _DoctorShellState extends State<DoctorShell> {
  int _selectedIndex = 0;

  static const _tabs = [
    DoctorDashboardPage(),
    DoctorPatientsListPage(),
    DoctorRecordReadingPage(),
    DoctorReportsPage(),
    DoctorNotificationsPage(),
  ];

  static const _titles = [
    'Dashboard',
    'Patients',
    'Mesure',
    'Rapports',
    'Notifications',
  ];

  @override
  Widget build(BuildContext context) {
    final auth = AppAuthScope.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(_titles[_selectedIndex])),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(color: Color(0xFF3498DB)),
              child: Text('Médecin', style: TextStyle(color: Colors.white, fontSize: 24)),
            ),
            ListTile(
              leading: const Icon(Icons.search),
              title: const Text('Recherche avancée'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/doctor/search');
              },
            ),
            ListTile(
              leading: const Icon(Icons.person_add),
              title: const Text('Ajouter un patient'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/doctor/patients/add');
              },
            ),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Détail patient'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/doctor/patient-detail');
              },
            ),
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Modifier patient'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/doctor/patient-edit');
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Paramètres'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/settings');
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Déconnexion'),
              onTap: () {
                Navigator.pop(context);
                auth.logout();
              },
            ),
          ],
        ),
      ),
      body: _tabs[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) => setState(() => _selectedIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard), label: 'Accueil'),
          NavigationDestination(icon: Icon(Icons.people), label: 'Patients'),
          NavigationDestination(icon: Icon(Icons.edit_note), label: 'Mesure'),
          NavigationDestination(icon: Icon(Icons.assessment), label: 'Rapports'),
          NavigationDestination(icon: Icon(Icons.notifications), label: 'Alertes'),
        ],
      ),
    );
  }
}
