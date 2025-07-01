import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/entries_provider.dart';
import '../models/diary_entry.dart';
import 'view_entry_screen.dart';
import 'edit_entry_screen.dart';
import 'settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<EntriesProvider>(context, listen: false).loadEntries(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final entriesProvider = Provider.of<EntriesProvider>(context);
    final entries = entriesProvider.entries;
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Diary'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: entriesProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : entries.isEmpty
              ? const Center(child: Text('No entries yet.'))
              : ListView.builder(
                  itemCount: entries.length,
                  itemBuilder: (context, i) {
                    final entry = entries[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ListTile(
                        title: Text(entry.title),
                        subtitle: Text(
                          entry.content.length > 60
                              ? entry.content.substring(0, 60) + '...'
                              : entry.content,
                        ),
                        trailing: entry.mood != null ? Text(entry.mood!) : null,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ViewEntryScreen(entryId: entry.id),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const EditEntryScreen()),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
} 