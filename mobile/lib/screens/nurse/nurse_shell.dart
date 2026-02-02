import 'package:flutter/material.dart';

import '../../auth/app_auth_scope.dart';
import 'assigned_patients_page.dart';
import 'dashboard_page.dart';
import 'notifications_page.dart';
import 'quick_record_page.dart';

class NurseShell extends StatefulWidget {
  const NurseShell({super.key});

  @override
  State<NurseShell> createState() => _NurseShellState();
}

class _NurseShellState extends State<NurseShell> {
  int _selectedIndex = 0;

  static const _tabs = [
    NurseDashboardPage(),
    NurseAssignedPatientsPage(),
    NurseQuickRecordPage(),
    NurseNotificationsPage(),
  ];

  static const _titles = [
    'Tableau de bord',
    'Patients assignés',
    'Enregistrement rapide',
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
              child: Text('Infirmier(ère)', style: TextStyle(color: Colors.white, fontSize: 24)),
            ),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Détail patient (lecture seule)'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/nurse/patient-detail');
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today),
              title: const Text('Planning des mesures'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/nurse/scheduled-readings');
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
          NavigationDestination(icon: Icon(Icons.notifications), label: 'Alertes'),
        ],
      ),
    );
  }
}
