import 'package:flutter/foundation.dart';
import '../models/diary_entry.dart';
import 'api_service.dart';

class EntriesProvider with ChangeNotifier {
  List<DiaryEntry> _entries = [];
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _pagination;
  String? _searchQuery;
  String? _tagFilter;

  List<DiaryEntry> get entries => _entries;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get pagination => _pagination;
  String? get searchQuery => _searchQuery;
  String? get tagFilter => _tagFilter;

  Future<void> loadEntries({
    String? search,
    String? tags,
    int page = 1,
    int limit = 10,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
    bool refresh = false,
  }) async {
    if (refresh) {
      _entries = [];
      page = 1;
    }

    _setLoading(true);
    _clearError();
    _searchQuery = search;
    _tagFilter = tags;

    try {
      final result = await ApiService.getEntries(
        search: search,
        tags: tags,
        page: page,
        limit: limit,
        sortBy: sortBy,
        sortOrder: sortOrder,
      );

      if (refresh || page == 1) {
        _entries = result['entries'];
      } else {
        _entries.addAll(result['entries']);
      }

      _pagination = result['pagination'];
      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<DiaryEntry?> getEntry(String id, {String? passcode}) async {
    _setLoading(true);
    _clearError();

    try {
      final entry = await ApiService.getEntry(id, passcode: passcode);
      _setLoading(false);
      return entry;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return null;
    }
  }

  Future<DiaryEntry?> createEntry({
    required String title,
    required String content,
    String? tags,
    String? mood,
    String? passcode,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final entry = await ApiService.createEntry(
        title: title,
        content: content,
        tags: tags,
        mood: mood,
        passcode: passcode,
      );

      _entries.insert(0, entry);
      _setLoading(false);
      notifyListeners();
      return entry;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return null;
    }
  }

  Future<DiaryEntry?> updateEntry({
    required String id,
    required String title,
    required String content,
    String? tags,
    String? mood,
    String? passcode,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedEntry = await ApiService.updateEntry(
        id: id,
        title: title,
        content: content,
        tags: tags,
        mood: mood,
        passcode: passcode,
      );

      final index = _entries.indexWhere((entry) => entry.id == id);
      if (index != -1) {
        _entries[index] = updatedEntry;
      }

      _setLoading(false);
      notifyListeners();
      return updatedEntry;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return null;
    }
  }

  Future<bool> deleteEntry(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await ApiService.deleteEntry(id);
      _entries.removeWhere((entry) => entry.id == id);
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<Uint8List?> exportEntryAsPdf(String id) async {
    _setLoading(true);
    _clearError();

    try {
      final pdfBytes = await ApiService.exportEntryAsPdf(id);
      _setLoading(false);
      return pdfBytes;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return null;
    }
  }

  void clearEntries() {
    _entries = [];
    _pagination = null;
    notifyListeners();
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