import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/entries_provider.dart';
import '../models/diary_entry.dart';
import 'edit_entry_screen.dart';

class ViewEntryScreen extends StatefulWidget {
  final String entryId;
  const ViewEntryScreen({super.key, required this.entryId});

  @override
  State<ViewEntryScreen> createState() => _ViewEntryScreenState();
}

class _ViewEntryScreenState extends State<ViewEntryScreen> {
  DiaryEntry? _entry;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadEntry();
  }

  Future<void> _loadEntry() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final provider = Provider.of<EntriesProvider>(context, listen: false);
    final entry = await provider.getEntry(widget.entryId);
    setState(() {
      _entry = entry;
      _loading = false;
      _error = entry == null ? provider.error : null;
    });
    if (entry != null) {
      print('Loaded entry: \\n' + entry.toJson().toString());
    }
  }

  void _deleteEntry() async {
    final provider = Provider.of<EntriesProvider>(context, listen: false);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: const Text('Are you sure you want to delete this entry?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed == true) {
      final success = await provider.deleteEntry(widget.entryId);
      if (success) {
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error ?? 'Delete failed')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text(_error!)),
      );
    }
    if (_entry == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Entry not found.')),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(_entry!.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => EditEntryScreen(entry: _entry),
                ),
              ).then((_) => _loadEntry());
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: _deleteEntry,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_entry!.mood != null) Text(_entry!.mood!, style: const TextStyle(fontSize: 32)),
              const SizedBox(height: 8),
              Text(_entry!.content, style: const TextStyle(fontSize: 18)),
              const SizedBox(height: 16),
              if (_entry!.tags != null && _entry!.tags!.isNotEmpty)
                Wrap(
                  spacing: 8,
                  children: _entry!.tagList.map((tag) => Chip(label: Text(tag))).toList(),
                ),
              const SizedBox(height: 16),
              Text('Created: ${_entry!.createdAt.toLocal()}'),
              Text('Updated: ${_entry!.updatedAt.toLocal()}'),
            ],
          ),
        ),
      ),
    );
  }
} 