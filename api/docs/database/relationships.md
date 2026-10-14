# Database Relationships

---

## 1. Role

#### A Role can have many Users.

```text
Role
↓
hasMany
↓
Users
```

#### A User belongs to a Role.

```text
User
↓
belongsTo
↓
Role
```

---

## 2. User

#### A User can create many Assignments as a Teacher.

```text
User
  ↓
hasMany
  ↓
Assignments
```

#### A User can join many Assignments as a Student.

```text
User
  ↓
hasMany
  ↓
AssignmentStudents
```

#### A User can have many Git Connections.

```text
User
  ↓
hasMany
  ↓
GitConnections
```

#### A User can have many Student Repositories.

```text
User
  ↓
hasMany
  ↓
AssignmentStudentRepositories
```

#### A User can have many Submissions as a Student.

```text
User
  ↓
hasMany
  ↓
Submissions
```

#### A User can resolve many Analysis Issues.

```text
User
  ↓
hasMany
  ↓
AnalysisIssues
```

---

## 3. Assignment

#### An Assignment belongs to a Teacher/User.

```text
Assignment
  ↓
belongsTo
  ↓
User
```

#### An Assignment can have many Students.

```text
Assignment
  ↓
hasMany
  ↓
AssignmentStudents
```

#### An Assignment can have many Requirements.

```text
Assignment
  ↓
hasMany
  ↓
AssignmentRequirements
```

#### An Assignment can have many Project Structure.

```text
Assignment
  ↓
hasMany
  ↓
AssignmentStructure
```

#### An Assignment can have many Assignment Repositories.

```text
Assignment
  ↓
hasMany
  ↓
AssignmentRepositories
```

#### An Assignment can have many Student Repositories.

```text
Assignment
  ↓
hasMany
  ↓
AssignmentStudentRepositories
```

#### An Assignment can have many Submissions.

```text
Assignment
  ↓
hasMany
  ↓
Submissions
```

---

## 4. AssignmentStudent

#### An AssignmentStudent belongs to an Assignment.

```text
AssignmentStudent
  ↓
belongsTo
  ↓
Assignment
```

#### An AssignmentStudent belongs to a User/Student.

```text
AssignmentStudent
  ↓
belongsTo
  ↓
User
```

---

## 5. AssignmentRequirement

#### An AssignmentRequirement belongs to an Assignment.

```text
AssignmentRequirement
  ↓
belongsTo
  ↓
Assignment
```

#### An AssignmentRequirement can have many Analysis Results.

```text
AssignmentRequirement
  ↓
hasMany
  ↓
AnalysisResults
```

---

## 6. AssignmentStructure

#### An AssignmentStructure belongs to an Assignment.

```text
AssignmentStructure
  ↓
belongsTo
  ↓
Assignment
```

#### An AssignmentStructure can have many Structure Rules.

```text
AssignmentStructure
  ↓
hasMany
  ↓
AssignmentStructureRules
```

---

## 7. AssignmentStructureRule

#### An AssignmentStructureRule belongs to an Assignment Structure.

```text
AssignmentStructureRule
  ↓
belongsTo
  ↓
AssignmentStructure
```

---

## 8. GitConnection

#### A GitConnection belongs to a User.

```text
GitConnection
  ↓
belongsTo
  ↓
User
```

#### A GitConnection can have many Repositories.

```text
GitConnection
  ↓
hasMany
  ↓
Repositories
```

---

## 9. Repository

#### A Repository belongs to a Git Connection.

```text
Repository
  ↓
belongsTo
  ↓
GitConnection
```

#### A Repository can be linked to many Assignments.

```text
Repository
  ↓
hasMany
  ↓
AssignmentRepository
```

#### A Repository can be used by many Student Repositories.

```text
Repository
  ↓
hasMany
  ↓
AssignmentStudentRepositories
```

#### A Repository can have many Submissions.

```text
Repository
  ↓
hasMany
  ↓
Submissions
```

---

## 10. AssignmentRepository

#### An AssignmentRepository belongs to an Assignment.

```text
AssignmentRepository
  ↓
belongsTo
  ↓
Assignment
```

#### An AssignmentRepository belongs to a Repository.

```text
AssignmentRepository
  ↓
belongsTo
  ↓
Repository
```

---

## 11. AssignmentStudentRepository

#### An AssignmentStudentRepository belongs to an Assignment.

```text
AssignmentStudentRepository
  ↓
belongsTo
  ↓
Assignment
```

#### An AssignmentStudentRepository belongs to a User/Student.

```text
AssignmentStudentRepository
  ↓
belongsTo
  ↓
User
```

#### An AssignmentStudentRepository belongs to a Repository.

```text
AssignmentStudentRepository
  ↓
belongsTo
  ↓
Repository
```

---

## 12. Submission

#### A Submission belongs to an Assignment.

```text
Submission
  ↓
belongsTo
  ↓
Assignment
```

#### A Submission belongs to a User/Student.

```text
Submission
  ↓
belongsTo
  ↓
User
```

#### A Submission belongs to a Repository.

```text
Submission
  ↓
belongsTo
  ↓
Repository
```

#### A Submission can have many Analysis Runs.

```text
Submission
  ↓
hasMany
  ↓
AnalysisRuns
```

---

## 13. AnalysisRun

#### An AnalysisRun belongs to a Submission.

```text
AnalysisRun
  ↓
belongsTo
  ↓
Submission
```

#### An AnalysisRun can have many Analysis Results.

```text
AnalysisRun
  ↓
hasMany
  ↓
AnalysisResults
```

#### An AnalysisRun can have many Analysis Issues.

```text
AnalysisRun
  ↓
hasMany
  ↓
AnalysisIssues
```

---

## 14. AnalysisResult

#### An AnalysisResult belongs to an Analysis Run.

```text
AnalysisResult
  ↓
belongsTo
  ↓
AnalysisRun
```

#### An AnalysisResult belongs to an Assignment Requirement.

```text
AnalysisResult
  ↓
belongsTo
  ↓
AssignmentRequirement
```

---

## 15. AnalysisIssue

#### An AnalysisIssue belongs to an Analysis Run.

```text
AnalysisIssue
  ↓
belongsTo
  ↓
AnalysisRun
```

#### An AnalysisIssue can be resolved by a User.

```text
AnalysisIssue
  ↓
belongsTo
  ↓
User
```

---
