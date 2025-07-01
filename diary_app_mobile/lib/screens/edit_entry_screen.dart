import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/diary_entry.dart';
import '../services/entries_provider.dart';

class EditEntryScreen extends StatefulWidget {
  final DiaryEntry? entry;
  const EditEntryScreen({super.key, this.entry});

  @override
  State<EditEntryScreen> createState() => _EditEntryScreenState();
}

class _EditEntryScreenState extends State<EditEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  String _title = '';
  String _content = '';
  String _tags = '';
  String _mood = '';

  @override
  void initState() {
    super.initState();
    if (widget.entry != null) {
      _title = widget.entry!.title;
      _content = widget.entry!.content;
      _tags = widget.entry!.tags ?? '';
      _mood = widget.entry!.mood ?? '';
    }
  }

  void _save() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();
    final provider = Provider.of<EntriesProvider>(context, listen: false);
    if (widget.entry == null) {
      final entry = await provider.createEntry(
        title: _title,
        content: _content,
        tags: _tags,
        mood: _mood,
      );
      if (entry != null) {
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error ?? 'Failed to create entry')),
        );
      }
    } else {
      final entry = await provider.updateEntry(
        id: widget.entry!.id,
        title: _title,
        content: _content,
        tags: _tags,
        mood: _mood,
      );
      if (entry != null) {
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error ?? 'Failed to update entry')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.entry != null;
    final provider = Provider.of<EntriesProvider>(context);
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Edit Entry' : 'New Entry')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  initialValue: _title,
                  decoration: const InputDecoration(labelText: 'Title'),
                  validator: (v) => v != null && v.isNotEmpty ? null : 'Title required',
                  onSaved: (v) => _title = v!,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  initialValue: _content,
                  decoration: const InputDecoration(labelText: 'Content'),
                  maxLines: 6,
                  validator: (v) => v != null && v.isNotEmpty ? null : 'Content required',
                  onSaved: (v) => _content = v!,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  initialValue: _tags,
                  decoration: const InputDecoration(labelText: 'Tags (comma separated)'),
                  onSaved: (v) => _tags = v ?? '',
                ),
                const SizedBox(height: 16),
                TextFormField(
                  initialValue: _mood,
                  decoration: const InputDecoration(labelText: 'Mood (emoji or text)'),
                  onSaved: (v) => _mood = v ?? '',
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: provider.isLoading ? null : _save,
                    child: provider.isLoading
                        ? const CircularProgressIndicator(strokeWidth: 2)
                        : Text(isEdit ? 'Update' : 'Create'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
} 