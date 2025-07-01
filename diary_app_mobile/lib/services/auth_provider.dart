import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _loadStoredAuth();
  }

  Future<void> _loadStoredAuth() async {
    try {
      final token = await _secureStorage.read(key: 'auth_token');
      if (token != null) {
        ApiService.setAuthToken(token);
        await _fetchCurrentUser();
      }
    } catch (e) {
      await _clearStoredAuth();
    }
  }

  Future<void> _fetchCurrentUser() async {
    try {
      _user = await ApiService.getCurrentUser();
      notifyListeners();
    } catch (e) {
      await _clearStoredAuth();
    }
  }

  Future<void> _clearStoredAuth() async {
    await _secureStorage.delete(key: 'auth_token');
    ApiService.clearAuthToken();
    _user = null;
    notifyListeners();
  }

  Future<bool> register({
    required String email,
    required String password,
    String? name,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final response = await ApiService.register(
        email: email,
        password: password,
        name: name,
      );

      _user = User.fromJson(response['user']);
      await _secureStorage.write(key: 'auth_token', value: response['token']);
      
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final response = await ApiService.login(
        email: email,
        password: password,
      );

      _user = User.fromJson(response['user']);
      await _secureStorage.write(key: 'auth_token', value: response['token']);
      
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<void> logout() async {
    await _clearStoredAuth();
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      await ApiService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<bool> updateDisplayName(String name) async {
    _setLoading(true);
    _clearError();

    try {
      _user = await ApiService.updateDisplayName(name);
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }
} 