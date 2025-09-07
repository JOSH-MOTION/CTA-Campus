
# Coderain Campus - System Design Document

This document outlines the system architecture, data model, and core components of the Coderain Campus application.

## 1. High-Level Architecture

Coderain Campus is a modern, full-stack web application built on a serverless architecture. It leverages Next.js for the frontend and Firebase for backend services, creating a robust and scalable platform for managing a coding school.

-   **Frontend**: A responsive Single Page Application (SPA) built with Next.js and React.
-   **Backend**: A collection of serverless services provided by Google Firebase (BaaS - Backend-as-a-Service).
-   **AI Integration**: Generative AI features are powered by Google's Genkit framework, running as serverless functions.

![High-Level Architecture Diagram](https://placehold.co/800x400.png?text=Architecture%20Diagram)

---

## 2. Technology Stack

### 2.1. Frontend

-   **Framework**: **Next.js 15** with the App Router. This provides Server Components for performance and a modern, file-based routing system.
-   **Language**: **TypeScript** for type safety and improved developer experience.
-   **UI Library**: **React** for building the user interface.
-   **Component Library**: **ShadCN UI** provides a set of accessible and customizable components.
-   **Styling**: **Tailwind CSS** for a utility-first styling approach.
-   **State Management**: **React Context API** is used to manage global state for authentication, academic content, and user data.

### 2.2. Backend (Firebase)

-   **Authentication**: **Firebase Authentication** handles user sign-up, login, and session management for students, teachers, and admins.
-   **Database**: **Cloud Firestore** is the primary NoSQL database for storing all application data, including user profiles, academic content, submissions, and chat messages.
-   **Storage**: **Firebase Storage** is used to store user-uploaded files, primarily profile pictures.

### 2.3. Generative AI

-   **Framework**: **Genkit** (a Google framework for building AI-powered applications) is used to define and manage all AI flows.
-   **Models**: The application leverages various Google AI models (e.g., Gemini) for features like the FAQ chatbot, resource summarization, and contact suggestions.

---

## 3. Data Model (Firestore)

Firestore is structured with top-level collections representing the core entities of the application.

-   `users`: Stores profile information for all users.
    -   `uid`: Unique ID from Firebase Auth.
    -   `role`: ('student', 'teacher', 'admin').
    -   `displayName`, `email`, `photoURL`, `bio`.
    -   Student-specific fields: `gen`, `schoolId`, `lessonDay`, `lessonTime`, `totalPoints`.
    -   Teacher-specific fields: `gensTaught`, `availableDays`, `timeSlots`.
    -   Subcollection: `points` (logs individual point transactions for a student).

-   `announcements`: School-wide news and updates.
    -   `title`, `content`, `authorId`, `targetGen`.

-   `assignments`, `exercises`, `projects`: Academic tasks for students.
    -   Structured similarly to `announcements`, with fields for title, description, due dates (for assignments), and target audience (`targetGen`).

-   `submissions`: Stores student work submissions.
    -   `studentId`, `assignmentId`, `submissionLink`, `pointCategory`, `grade`.

-   `chats`: Stores all chat messages.
    -   Each document represents a unique chat (either a DM or a group). The document ID is either a sorted combination of two user UIDs (for DMs) or a group ID (e.g., `group-Gen 30`).
    -   Subcollection: `messages` (contains all messages for that chat).

-   `notifications`: Stores user-specific notifications.
    -   `userId`, `title`, `description`, `href`, `read`.

-   `roadmap_status`: Tracks the completion status of curriculum weeks for each generation.
    -   Document ID is the `weekId`.
    -   Each document contains a map where keys are generation names (e.g., "Gen 30") and values are booleans.

---

## 4. Core Features & Logic

### 4.1. Authentication and Authorization

-   **Role-Based Access Control (RBAC)**: The app supports three roles: `student`, `teacher`, and `admin`.
-   **UI Rendering**: The `AuthContext` provides the user's role, which is used to conditionally render navigation items and UI components.
-   **Data Security**: **Firestore Security Rules** enforce data access policies on the backend, ensuring users can only read or write data they are permitted to access.

### 4.2. Academic Content Management

-   Teachers and admins create content (Announcements, Assignments, etc.).
-   Each piece of content has a `targetGen` field.
-   The application queries Firestore to fetch only the content relevant to the logged-in user's generation or role.

### 4.3. Grading and Points System

-   Students submit work via a dialog, creating a `submission` document.
-   Teachers view submissions and can use the `GradeSubmissionDialog`.
-   Grading triggers a Genkit flow (`gradeSubmissionFlow`) which:
    1.  Awards points by calling the `awardPointsFlow`.
    2.  Updates the `submission` document with a grade and feedback.
    3.  Creates a `notification` for the student.
-   A student's `totalPoints` are stored on their `user` document and are updated atomically using `increment()` for reliability.

### 4.4. Real-time Communication

-   The chat feature uses Firestore's real-time listeners (`onSnapshot`).
-   Direct Messages (DMs) use a consistent chat ID generated by sorting the UIDs of the two participants (`getChatId`).
-   Group chats are based on generation (e.g., `group-Gen 30`).
-   When a message is sent, a server-side Genkit flow is triggered to send notifications to the recipient(s).

### 4.5. State Management

-   **React Context** is the primary method for managing global state.
-   Separate providers (`AuthProvider`, `AssignmentsContext`, etc.) encapsulate related state and logic.
-   This approach keeps component logic clean and centralizes data fetching and manipulation.

