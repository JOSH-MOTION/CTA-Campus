
# Codetrain Campus - System Design Document

This document outlines the system architecture, data model, and core components of the Codetrain Campus application. The content is structured to follow a logical flow from user interaction to the underlying technical implementation.

---

## 1. User Flow & Functional Requirements

This section outlines the application's functionality from the perspective of its users, following a natural progression from authentication to feature interaction.

### 1.1. Authentication (The Entry Point)
All users begin their journey by authenticating. The system supports distinct roles, and the sign-up process directs them into the appropriate user path.
- **Sign-up, Log-in, Log-out**: Users must be able to create an account, sign in, and sign out securely.
- **Role-Based Access**: The app supports three roles: `student`, `teacher`, and `admin`. Access to features and data is strictly controlled based on the user's assigned role.

### 1.2. Core Features (Role-Based Functionality)

#### General (All Authenticated Users)
- **Profile Management**: Users can view and update their own profile information (name, bio, profile picture).
- **Real-time Chat**: All users can send and receive messages in real-time private or group chats.
- **Notifications**: Users receive real-time notifications for important events like new assignments or graded work.

#### Student-Specific Journey
1.  **Dashboard**: View a personalized summary of weekly topics, schedule, and recent resources.
2.  **Academic Content**: View announcements, assignments, exercises, and projects targeted to their generation.
3.  **Submissions**: Submit links to their work for all academic tasks.
4.  **Grading & Points**: View their total points and a detailed breakdown of how they were earned.
5.  **Roadmap**: Track their curriculum progress as marked by a teacher.
6.  **Booking**: Book one-on-one sessions with available teachers.
7.  **Directory**: View a directory of all staff members to initiate contact or book sessions.

#### Teacher-Specific Workflow
1.  **Dashboard**: View a summary of key metrics for a selected student generation.
2.  **Content Management**: Create, update, and delete announcements, assignments, exercises, and projects.
3.  **Submission Review**: View all student submissions for the academic content they've created.
4.  **Grading**: Grade submissions, provide feedback, and award points.
5.  **Student Management**: View a list of all students and their performance metrics.
6.  **Roadmap Management**: Mark curriculum weeks as complete for different generations.
7.  **Availability**: Set and manage their own availability for student bookings.

#### Administrator Capabilities
- **Full CRUD Operations**: Admins have full permissions on all data collections for system oversight and management.
- **User Management**: Can view and manage all user accounts, roles, and permissions.
- **Global Access**: Has access to all dashboards and management pages.

---

## 2. Application Architecture & Technology

With the user flow established, this section details the technical architecture that supports it.

### 2.1. High-Level Architecture
Codetrain Campus is a modern, full-stack web application built on a serverless architecture. It leverages Next.js for the frontend and Firebase for backend services.
-   **Frontend**: A responsive Single Page Application (SPA) built with Next.js and React.
-   **Backend**: A collection of serverless services provided by Google Firebase (BaaS - Backend-as-a-Service).
-   **AI Integration**: Generative AI features are powered by Google's Genkit framework, running as serverless functions.

![High-Level Architecture Diagram](https://placehold.co/800x400.png?text=Architecture%20Diagram)

### 2.2. Technology Stack

#### Frontend
-   **Framework**: **Next.js 15** with the App Router for its performance benefits (Server Components) and intuitive routing.
-   **Language**: **TypeScript** for type safety and improved code quality.
-   **UI Library**: **React** for building modular, reusable components.
-   **Component Library**: **ShadCN UI** for a set of accessible and customizable components.
-   **Styling**: **Tailwind CSS** for rapid, utility-first styling.
-   **State Management**: **React Context API** for managing global state like authentication and user data.

#### Backend (Firebase)
-   **Authentication**: **Firebase Authentication** for a secure, fully managed authentication service.
-   **Database**: **Cloud Firestore** for its flexibility, scalability, and real-time capabilities.
-   **Storage**: **Firebase Storage** for secure user-generated content storage (e.g., profile pictures).

#### Generative AI
-   **Framework**: **Genkit** (a Google framework) for building and managing reliable and instrumented AI flows.

---

## 3. Data Model (Firestore)

The application's features are powered by the following data structures in Firestore. Collections are designed for efficient, targeted queries.

-   `users`: Stores profile information for all users.
    -   `uid`: Unique ID from Firebase Auth.
    -   `role`: ('student', 'teacher', 'admin').
    -   `displayName`, `email`, `photoURL`, `bio`.
    -   Student-specific fields: `gen`, `schoolId`, `lessonDay`, `lessonTime`, `totalPoints`.
    -   Teacher-specific fields: `gensTaught`, `availableDays`, `timeSlots`.
    -   Subcollection: `points` (logs individual point transactions for a student).

-   `announcements`, `assignments`, `exercises`, `projects`: Academic tasks for students.
    -   Structured similarly, with fields for title, description, and target audience (`targetGen`).

-   `submissions`: Stores student work submissions.
    -   `studentId`, `assignmentId`, `submissionLink`, `pointCategory`, `grade`.

-   `chats`: Stores all chat messages.
    -   Each document represents a unique chat. Using a combined, sorted UID for DMs creates a predictable and unique ID for every private conversation.
    -   Subcollection: `messages` (contains all messages for that chat).

-   `notifications`: Stores user-specific notifications.
    -   `userId`, `title`, `description`, `href`, `read`.

-   `roadmap_status`: Tracks the completion status of curriculum weeks for each generation.
    -   Document ID is the `weekId` for easy querying.

---

## 4. Core Logic & Implementation Details

This section describes the key implementation patterns that ensure the application is secure, reliable, and efficient.

### 4.1. Security: Authentication and Authorization
-   **Role-Based Access Control (RBAC)**: The application logic strictly enforces the three roles (`student`, `teacher`, `admin`). The UI conditionally renders components based on the user's role, preventing them from seeing unauthorized options.
-   **Data Security with Firestore Security Rules**: This is the most critical security layer. Server-side rules ensure that even a malicious user cannot directly access or modify data they are not authorized to, guaranteeing data integrity and enforcing our RBAC model.

### 4.2. Efficiency: Content & Data Handling
-   **Targeted Content**: Each piece of academic content (`announcements`, `assignments`, etc.) has a `targetGen` field. This allows the application to query and fetch only the content relevant to the logged-in user, reducing data transfer and improving performance.
-   **Atomic Operations for Points**: A student's `totalPoints` are updated atomically using `increment()`. This is crucial for reliability, as it prevents race conditions and ensures the final point count is always accurate, even with simultaneous updates.

### 4.3. Real-time Features
-   **Live Chat and Notifications**: The chat and notification features use Firestore's real-time listeners (`onSnapshot`). This allows the server to push updates to the client instantly without the need for manual polling, creating a seamless and immediate user experience.

### 4.4. State Management
-   **Centralized with React Context**: Global state is managed through separate, focused React Context providers (`AuthProvider`, `AssignmentsContext`, etc.). This encapsulates related state and logic, keeping component code clean, preventing "prop drilling," and centralizing data-fetching logic.

---

## 5. Non-Functional Requirements

These are the system-wide quality attributes that the architecture is designed to meet.

### 5.1. Performance
-   **Fast Page Loads**: Achieved using Next.js Server Components, which minimize client-side JavaScript.
-   **Responsive UI**: The UI is fully responsive on all device sizes, built with Tailwind CSS.

### 5.2. Scalability
-   **Serverless Backend**: Firebase services scale automatically with user growth without manual intervention.
-   **Efficient Queries**: The data model is designed to allow for shallow queries that fetch only the necessary data, ensuring performance even with large datasets.

### 5.3. Security
-   **Protected Routes**: All sensitive routes and data are protected by authentication.
-   **Server-Side Authorization**: Firestore Security Rules enforce RBAC on the backend, providing the primary defense against unauthorized data access.

### 5.4. Usability & Accessibility
-   **Intuitive Interface**: The UI is designed to be clean, modern, and easy to navigate.
-   **Accessibility**: The app is built with ShadCN UI, which is based on the WAI-ARIA compliant Radix UI, ensuring high accessibility standards.

### 5.5. Reliability
-   **High Availability**: Relying on Google Cloud's infrastructure via Firebase provides high uptime.
-   **Data Consistency**: Atomic operations (`increment()`) in Firestore are used for critical data updates to prevent data corruption.
