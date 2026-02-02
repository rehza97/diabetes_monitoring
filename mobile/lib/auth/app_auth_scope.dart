import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

/// Auth state: Firebase sign-in, Firestore user/role, sign-out, password reset.
/// Listens to authStateChanges; on login fetches users/{uid} for role and routes.
class AppAuthState extends ChangeNotifier {
  AppAuthState() {
    _subscription = FirebaseAuth.instance.authStateChanges().listen(_onAuthStateChanged);
  }

  StreamSubscription<User?>? _subscription;
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  bool _authLoading = true;
  bool _isLoggedIn = false;
  String? _role;
  String? _userId;
  String? _email;
  String? _loginError;
  String? _resetError;
  bool _resetEmailSent = false;

  bool get authLoading => _authLoading;
  bool get isLoggedIn => _isLoggedIn;
  String? get role => _role;
  String? get userId => _userId;
  String? get email => _email;
  String? get loginError => _loginError;
  String? get resetError => _resetError;
  bool get resetEmailSent => _resetEmailSent;

  void _clearErrors() {
    if (_loginError != null || _resetError != null) {
      _loginError = null;
      _resetError = null;
      notifyListeners();
    }
  }

  Future<void> _onAuthStateChanged(User? user) async {
    if (user == null) {
      _authLoading = false;
      _isLoggedIn = false;
      _role = null;
      _userId = null;
      _email = null;
      notifyListeners();
      return;
    }

    try {
      final doc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
      if (!doc.exists || doc.data() == null) {
        await FirebaseAuth.instance.signOut();
        _authLoading = false;
        _isLoggedIn = false;
        _role = null;
        _userId = null;
        _email = null;
        notifyListeners();
        return;
      }

      final data = doc.data()!;
      final r = data['role'] as String?;
      if (r != 'admin' && r != 'doctor' && r != 'nurse') {
        await FirebaseAuth.instance.signOut();
        _authLoading = false;
        _isLoggedIn = false;
        _role = null;
        _userId = null;
        _email = null;
        notifyListeners();
        return;
      }

      _isLoggedIn = true;
      _role = r;
      _userId = user.uid;
      _email = user.email;
      _authLoading = false;
      _loginError = null;
      notifyListeners();

      _navigateByRole(r!);
    } catch (e) {
      await FirebaseAuth.instance.signOut();
      _authLoading = false;
      _isLoggedIn = false;
      _role = null;
      _userId = null;
      _email = null;
      notifyListeners();
    }
  }

  void _navigateByRole(String r) {
    final nav = navigatorKey.currentState;
    if (nav == null) return;
    if (r == 'admin') {
      nav.pushNamedAndRemoveUntil('/admin-reject', (route) => false);
    } else {
      final path = r == 'doctor' ? '/doctor' : '/nurse';
      nav.pushNamedAndRemoveUntil(path, (route) => false);
    }
  }

  /// Sign in with email and password. On success, _onAuthStateChanged runs and navigates.
  Future<void> login(String email, String password) async {
    _clearErrors();
    _loginError = null;
    notifyListeners();

    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      // Navigation handled by authStateChanges
    } on FirebaseAuthException catch (e) {
      _loginError = _messageForAuthException(e);
      notifyListeners();
      rethrow;
    }
  }

  /// Sign out and navigate to login.
  Future<void> logout() async {
    await FirebaseAuth.instance.signOut();
    _isLoggedIn = false;
    _role = null;
    _userId = null;
    _email = null;
    navigatorKey.currentState?.pushNamedAndRemoveUntil('/', (route) => false);
    notifyListeners();
  }

  /// Send password reset email. Sets resetError on failure, resetEmailSent on success.
  Future<void> sendPasswordResetEmail(String email) async {
    _resetError = null;
    _resetEmailSent = false;
    notifyListeners();

    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email.trim());
      _resetEmailSent = true;
      _resetError = null;
      notifyListeners();
    } on FirebaseAuthException catch (e) {
      _resetError = _messageForAuthException(e);
      _resetEmailSent = false;
      notifyListeners();
      rethrow;
    }
  }

  void clearResetState() {
    if (_resetError == null && !_resetEmailSent) return;
    _resetError = null;
    _resetEmailSent = false;
    notifyListeners();
  }

  void clearLoginError() {
    if (_loginError == null) return;
    _loginError = null;
    notifyListeners();
  }

  static String _messageForAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'Aucun compte associé à cet email.';
      case 'wrong-password':
      case 'invalid-credential':
        return 'Email ou mot de passe incorrect.';
      case 'invalid-email':
        return 'Adresse email invalide.';
      case 'user-disabled':
        return 'Ce compte a été désactivé.';
      case 'too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard.';
      case 'operation-not-allowed':
        return 'Connexion par email désactivée.';
      case 'invalid-action-code':
        return 'Lien de réinitialisation invalide ou expiré.';
      default:
        return e.message ?? 'Une erreur est survenue.';
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

class AppAuthScope extends InheritedNotifier<AppAuthState> {
  const AppAuthScope({super.key, required AppAuthState auth, required super.child})
      : super(notifier: auth);

  static AppAuthState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppAuthScope>();
    assert(scope != null, 'AppAuthScope not found');
    return scope!.notifier!;
  }
}
