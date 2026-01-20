# Database Schema

## Users Table
```sql
- id: UUID (Primary Key)
- email: String (Unique)
- password: String (Hashed)
- fullName: String
- academicYear: Integer (1-6)
- status: Enum [PENDING, APPROVED, REJECTED]
- role: Enum [USER, ADMIN]
- createdAt: DateTime
- updatedAt: DateTime
```

## Subjects Table
```sql
- id: UUID (Primary Key)
- name: String (e.g., "Анатомия", "Гистология")
- slug: String (Unique, e.g., "anatomy")
- description: String (Optional)
- createdAt: DateTime
```

## Materials Table
```sql
- id: UUID (Primary Key)
- title: String
- description: String (Optional)
- subjectId: UUID (Foreign Key → Subjects)
- academicYear: Integer (1-6)
- filePath: String
- fileName: String
- fileType: Enum [PDF, DOCX]
- fileSize: Integer
- tags: String[] (e.g., ["high-yield", "exam-relevant"])
- status: Enum [PENDING, APPROVED, REJECTED]
- uploadedById: UUID (Foreign Key → Users)
- approvedById: UUID (Foreign Key → Users, Optional)
- createdAt: DateTime
- updatedAt: DateTime
```

## DiscussionThreads Table
```sql
- id: UUID (Primary Key)
- title: String
- content: Text
- subjectId: UUID (Foreign Key → Subjects)
- academicYear: Integer (1-6)
- authorId: UUID (Foreign Key → Users)
- status: Enum [PENDING, APPROVED, REJECTED]
- approvedById: UUID (Foreign Key → Users, Optional)
- likesCount: Integer (Default 0)
- commentsCount: Integer (Default 0)
- createdAt: DateTime
- updatedAt: DateTime
```

## Comments Table (Nested Structure)
```sql
- id: UUID (Primary Key)
- content: Text
- threadId: UUID (Foreign Key → DiscussionThreads)
- parentId: UUID (Foreign Key → Comments, Optional, for nesting)
- authorId: UUID (Foreign Key → Users)
- status: Enum [PENDING, APPROVED, REJECTED]
- approvedById: UUID (Foreign Key → Users, Optional)
- likesCount: Integer (Default 0)
- depth: Integer (For query optimization)
- createdAt: DateTime
- updatedAt: DateTime
```

## Likes Table (Optional)
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key → Users)
- threadId: UUID (Foreign Key → DiscussionThreads, Optional)
- commentId: UUID (Foreign Key → Comments, Optional)
- createdAt: DateTime
- UNIQUE (userId, threadId) OR (userId, commentId)
```

## Relationships
- User → Materials (one-to-many, uploads)
- User → DiscussionThreads (one-to-many, author)
- User → Comments (one-to-many, author)
- Subject → Materials (one-to-many)
- Subject → DiscussionThreads (one-to-many)
- DiscussionThread → Comments (one-to-many)
- Comment → Comment (self-referencing, parent-child)

## Indexes
- Users: email, status
- Materials: subjectId, academicYear, status
- DiscussionThreads: subjectId, academicYear, status
- Comments: threadId, parentId, status
