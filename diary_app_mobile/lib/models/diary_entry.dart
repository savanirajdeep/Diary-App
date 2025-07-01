class DiaryEntry {
  final String id;
  final String title;
  final String content;
  final String? tags;
  final String? mood;
  final bool hasPasscode;
  final DateTime createdAt;
  final DateTime updatedAt;

  DiaryEntry({
    required this.id,
    required this.title,
    required this.content,
    this.tags,
    this.mood,
    required this.hasPasscode,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DiaryEntry.fromJson(Map<String, dynamic> json) {
    return DiaryEntry(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      tags: json['tags']?.toString(),
      mood: json['mood']?.toString(),
      hasPasscode: json['hasPasscode'] == true || json['hasPasscode'] == 1,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'tags': tags,
      'mood': mood,
      'hasPasscode': hasPasscode,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  List<String> get tagList {
    if (tags == null || tags!.isEmpty) return [];
    return tags!.split(',').map((tag) => tag.trim()).where((tag) => tag.isNotEmpty).toList();
  }

  DiaryEntry copyWith({
    String? id,
    String? title,
    String? content,
    String? tags,
    String? mood,
    bool? hasPasscode,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return DiaryEntry(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      tags: tags ?? this.tags,
      mood: mood ?? this.mood,
      hasPasscode: hasPasscode ?? this.hasPasscode,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
} 