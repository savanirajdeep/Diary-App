import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/diary_entry.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:5001/api';
  static String? _authToken;

  static void setAuthToken(String token) {
    _authToken = token;
  }

  static void clearAuthToken() {
    _authToken = null;
  }

  static Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  // Auth endpoints
  static Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    String? name,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _headers,
      body: jsonEncode({
        'email': email,
        'password': password,
        if (name != null) 'name': name,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      setAuthToken(data['token']);
      return data;
    } else {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Registration failed').toString());
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers,
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      setAuthToken(data['token']);
      return data;
    } else {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Login failed').toString());
    }
  }

  static Future<User> getCurrentUser() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return User.fromJson(data['user']);
    } else {
      throw Exception('Failed to get current user');
    }
  }

  static Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/auth/change-password'),
      headers: _headers,
      body: jsonEncode({
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Failed to change password').toString());
    }
  }

  static Future<User> updateDisplayName(String name) async {
    final response = await http.put(
      Uri.parse('$baseUrl/auth/update-name'),
      headers: _headers,
      body: jsonEncode({'name': name}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return User.fromJson(data['user']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Failed to update display name').toString());
    }
  }

  // Diary entries endpoints
  static Future<Map<String, dynamic>> getEntries({
    String? search,
    String? tags,
    int page = 1,
    int limit = 10,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      'sortBy': sortBy,
      'sortOrder': sortOrder,
    };

    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    if (tags != null && tags.isNotEmpty) {
      queryParams['tags'] = tags;
    }

    final uri = Uri.parse('$baseUrl/entries').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'entries': (data['entries'] as List)
            .map((entry) => DiaryEntry.fromJson(entry))
            .toList(),
        'pagination': data['pagination'],
      };
    } else {
      throw Exception('Failed to fetch entries');
    }
  }

  static Future<DiaryEntry> getEntry(String id, {String? passcode}) async {
    final queryParams = <String, String>{};
    if (passcode != null) {
      queryParams['passcode'] = passcode;
    }

    final uri = Uri.parse('$baseUrl/entries/$id').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return DiaryEntry.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Failed to fetch entry').toString());
    }
  }

  static Future<DiaryEntry> createEntry({
    required String title,
    required String content,
    String? tags,
    String? mood,
    String? passcode,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/entries'),
      headers: _headers,
      body: jsonEncode({
        'title': title,
        'content': content,
        if (tags != null) 'tags': tags,
        if (mood != null) 'mood': mood,
        if (passcode != null) 'passcode': passcode,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      print('Create entry response: $data');
      return DiaryEntry.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Failed to create entry').toString());
    }
  }

  static Future<DiaryEntry> updateEntry({
    required String id,
    required String title,
    required String content,
    String? tags,
    String? mood,
    String? passcode,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/entries/$id'),
      headers: _headers,
      body: jsonEncode({
        'title': title,
        'content': content,
        if (tags != null) 'tags': tags,
        if (mood != null) 'mood': mood,
        if (passcode != null) 'passcode': passcode,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return DiaryEntry.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Failed to update entry').toString());
    }
  }

  static Future<void> deleteEntry(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/entries/$id'),
      headers: _headers,
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Failed to delete entry').toString());
    }
  }

  static Future<Uint8List> exportEntryAsPdf(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/entries/$id/export-pdf'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      return response.bodyBytes;
    } else {
      final error = jsonDecode(response.body);
      throw Exception((error['error'] ?? 'Failed to export entry as PDF').toString());
    }
  }
} 