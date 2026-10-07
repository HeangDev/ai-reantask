# Database Relationships

## User

#### A User can create many Assignments.

User
  ↓
hasMany
  ↓
Assignments

#### A User can join many Assignments as a Student.

User
  ↓
hasMany
  ↓
AssignmentStudents

#### A User can have many Git Connections.

User
  ↓
hasMany
  ↓
GitConnections

#### A User can have many Student Repositories.

User
  ↓
hasMany
  ↓
AssignmentStudentRepositories

#### A User can have many Submissions.

User
  ↓
hasMany
  ↓
Submissions

## Assignment

#### An Assignment belongs to a Teacher/User.

Assignment
  ↓
belongsTo
  ↓
User

#### An Assignment can have many Students.

Assignment
  ↓
hasMany
  ↓
AssignmentStudents

#### An Assignment can have many Requirements.

Assignment
  ↓
hasMany
  ↓
AssignmentRequirements

#### An Assignment can have one Project Structure.

Assignment
  ↓
hasOne
  ↓
AssignmentStructure

#### An Assignment can have one Template Repository.

Assignment
  ↓
hasOne
  ↓
AssignmentRepository

#### An Assignment can have many Student Repositories.

Assignment
  ↓
hasMany
  ↓
AssignmentStudentRepositories

#### An Assignment can have many Submissions.

Assignment
  ↓
hasMany
  ↓
Submissions

## AssignmentStudent

#### An AssignmentStudent belongs to an Assignment.

AssignmentStudent
  ↓
belongsTo
  ↓
Assignment

#### An AssignmentStudent belongs to a User/Student.

AssignmentStudent
  ↓
belongsTo
  ↓
User

## AssignmentRequirement

#### An AssignmentRequirement belongs to an Assignment.

AssignmentRequirement
  ↓
belongsTo
  ↓
Assignment

#### An AssignmentRequirement can have many Analysis Results.

AssignmentRequirement
  ↓
hasMany
  ↓
AnalysisResults

## AssignmentStructure

#### An AssignmentStructure belongs to an Assignment.

AssignmentStructure
  ↓
belongsTo
  ↓
Assignment

#### An AssignmentStructure can have many Structure Rules.

AssignmentStructure
  ↓
hasMany
  ↓
AssignmentStructureRules

## AssignmentStructureRule

#### An AssignmentStructureRule belongs to an Assignment Structure.

AssignmentStructureRule
  ↓
belongsTo
  ↓
AssignmentStructure

## GitConnection

#### A GitConnection belongs to a User.

GitConnection
  ↓
belongsTo
  ↓
User

#### A GitConnection can have many Repositories.

GitConnection
  ↓
hasMany
  ↓
Repositories

## Repository

#### A Repository belongs to a Git Connection.

Repository
  ↓
belongsTo
  ↓
GitConnection

#### A Repository can be used as a Template Repository.

Repository
  ↓
hasOne
  ↓
AssignmentRepository

#### A Repository can be used by many Student Repositories.

Repository
  ↓
hasMany
  ↓
AssignmentStudentRepositories

#### A Repository can have many Submissions.

Repository
  ↓
hasMany
  ↓
Submissions

## AssignmentRepository

#### An AssignmentRepository belongs to an Assignment.

AssignmentRepository
  ↓
belongsTo
  ↓
Assignment

#### An AssignmentRepository belongs to a Repository.

AssignmentRepository
  ↓
belongsTo
  ↓
Repository

## AssignmentStudentRepository

#### An AssignmentStudentRepository belongs to an Assignment.

AssignmentStudentRepository
  ↓
belongsTo
  ↓
Assignment

#### An AssignmentStudentRepository belongs to a Student/User.

AssignmentStudentRepository
  ↓
belongsTo
  ↓
User

#### An AssignmentStudentRepository belongs to a Repository.

AssignmentStudentRepository
  ↓
belongsTo
  ↓
Repository

## Submission

#### A Submission belongs to an Assignment.

Submission
  ↓
belongsTo
  ↓
Assignment

#### A Submission belongs to a Student/User.

Submission
  ↓
belongsTo
  ↓
User

#### A Submission belongs to a Repository.

Submission
  ↓
belongsTo
  ↓
Repository

#### A Submission can have many Analysis Runs.

Submission
  ↓
hasMany
  ↓
AnalysisRuns

## AnalysisRun

#### An AnalysisRun belongs to a Submission.

AnalysisRun
  ↓
belongsTo
  ↓
Submission

#### An AnalysisRun can have many Analysis Results.

AnalysisRun
  ↓
hasMany
  ↓
AnalysisResults

#### An AnalysisRun can have many Analysis Issues.

AnalysisRun
  ↓
hasMany
  ↓
AnalysisIssues

## AnalysisResult

#### An AnalysisResult belongs to an Analysis Run.

AnalysisResult
  ↓
belongsTo
  ↓
AnalysisRun

#### An AnalysisResult belongs to an Assignment Requirement.

AnalysisResult
  ↓
belongsTo
  ↓
AssignmentRequirement

## AnalysisIssue

#### An AnalysisIssue belongs to an Analysis Run.

AnalysisIssue
  ↓
belongsTo
  ↓
AnalysisRun

# Relationship Summary

User
 ├── hasMany → Assignments
 ├── hasMany → AssignmentStudents
 ├── hasMany → GitConnections
 ├── hasMany → AssignmentStudentRepositories
 └── hasMany → Submissions

Assignment
 ├── belongsTo → User
 ├── hasMany → AssignmentStudents
 ├── hasMany → AssignmentRequirements
 ├── hasOne → AssignmentStructure
 ├── hasOne → AssignmentRepository
 ├── hasMany → AssignmentStudentRepositories
 └── hasMany → Submissions

AssignmentStudent
 ├── belongsTo → Assignment
 └── belongsTo → User

AssignmentRequirement
 ├── belongsTo → Assignment
 └── hasMany → AnalysisResults

AssignmentStructure
 ├── belongsTo → Assignment
 └── hasMany → AssignmentStructureRules

AssignmentStructureRule
 └── belongsTo → AssignmentStructure

GitConnection
 ├── belongsTo → User
 └── hasMany → Repositories

Repository
 ├── belongsTo → GitConnection
 ├── hasOne → AssignmentRepository
 ├── hasMany → AssignmentStudentRepositories
 └── hasMany → Submissions

AssignmentRepository
 ├── belongsTo → Assignment
 └── belongsTo → Repository

AssignmentStudentRepository
 ├── belongsTo → Assignment
 ├── belongsTo → User
 └── belongsTo → Repository

Submission
 ├── belongsTo → Assignment
 ├── belongsTo → User
 ├── belongsTo → Repository
 └── hasMany → AnalysisRuns

AnalysisRun
 ├── belongsTo → Submission
 ├── hasMany → AnalysisResults
 └── hasMany → AnalysisIssues

AnalysisResult
 ├── belongsTo → AnalysisRun
 └── belongsTo → AssignmentRequirement

AnalysisIssue
 └── belongsTo → AnalysisRun