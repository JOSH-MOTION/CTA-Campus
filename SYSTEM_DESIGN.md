
# Codetrain Campus - System Design Document

This document outlines the system architecture, data model, and core components of the Codetrain Campus application.

## 1. High-Level Architecture

Codetrain Campus is a modern, full-stack web application built on a serverless architecture. It leverages Next.js for the frontend and Firebase for backend services, creating a robust and scalable platform for managing a coding school.

-   **Frontend**: A responsive Single Page Application (SPA) built with Next.js and React. This provides a fast, modern user experience with the performance benefits of server-side rendering.
-   **Backend**: A collection of serverless services provided by Google Firebase (BaaS - Backend-as-a-Service). This choice minimizes infrastructure management, allowing the team to focus on application features while ensuring scalability and reliability.
-   **AI Integration**: Generative AI features are powered by Google's Genkit framework, running as serverless functions. This provides a structured and maintainable way to integrate powerful AI capabilities.

![High-Level Architecture Diagram](https://placehold.co/800x400.png?text=Architecture%20Diagram)

---

## 2. Technology Stack

### 2.1. Frontend

-   **Framework**: **Next.js 15** with the App Router.
    -   **Why**: The App Router enables the use of **Server Components**, which reduce the amount of JavaScript sent to the client, leading to faster initial page loads and better performance. Its file-based routing is intuitive and simplifies project structure.
-   **Language**: **TypeScript**.
    -   **Why**: TypeScript adds static typing to JavaScript, which helps catch errors early in development, improves code quality, and makes the codebase easier to maintain and refactor.
-   **UI Library**: **React**.
    -   **Why**: React's component-based architecture is ideal for building complex, interactive user interfaces in a modular and reusable way.
-   **Component Library**: **ShadCN UI**.
    -   **Why**: ShadCN provides a set of beautifully designed, accessible, and customizable components that can be copied directly into the project. This gives full control over the code while accelerating UI development.
-   **Styling**: **Tailwind CSS**.
    -   **Why**: A utility-first CSS framework that allows for rapid styling directly in the markup without writing custom CSS. This keeps styling consistent and colocated with the components.
-   **State Management**: **React Context API**.
    -   **Why**: For managing global state like authentication and user data, the built-in Context API is lightweight and sufficient, avoiding the need for a heavier third-party state management library.

### 2.2. Backend (Firebase)

-   **Authentication**: **Firebase Authentication**.
    -   **Why**: It provides a secure, easy-to-implement, and fully managed authentication service with built-in features for email/password sign-in, session management, and user role handling.
-   **Database**: **Cloud Firestore**.
    -   **Why**: As a NoSQL, document-based database, Firestore is flexible and scales effortlessly. Its real-time capabilities are perfect for features like chat and notifications, pushing live updates to clients without extra configuration.
-   **Storage**: **Firebase Storage**.
    -   **Why**: It offers a simple and secure way to store user-generated content like profile pictures, integrating seamlessly with Firebase Authentication for rule-based access control.

### 2.3. Generative AI

-   **Framework**: **Genkit** (a Google framework).
    -   **Why**: Genkit provides a robust, TypeScript-native framework for defining, managing, and instrumenting AI flows. It simplifies the process of calling different AI models, chaining them together, and adding custom logic, making the AI features more reliable and easier to debug.

---

## 3. Data Model (Firestore)

Firestore is structured with top-level collections representing the core entities of the application. This approach is simple, scalable, and allows for efficient, targeted queries.

-   `users`: Stores profile information for all users.
    -   `uid`: Unique ID from Firebase Auth.
    -   `role`: ('student', 'teacher', 'admin').
    -   `displayName`, `email`, `photoURL`, `bio`.
    -   Student-specific fields: `gen`, `schoolId`, `lessonDay`, `lessonTime`, `totalPoints`.
    -   Teacher-specific fields: `gensTaught`, `availableDays`, `timeSlots`.
    -   Subcollection: `points` (logs individual point transactions for a student).

-   `announcements`, `assignments`, `exercises`, `projects`: Academic tasks for students.
    -   Structured similarly, with fields for title, description, and target audience (`targetGen`). This consistency simplifies data fetching logic.

-   `submissions`: Stores student work submissions.
    -   `studentId`, `assignmentId`, `submissionLink`, `pointCategory`, `grade`.

-   `chats`: Stores all chat messages.
    -   Each document represents a unique chat. Using a combined, sorted UID for DMs creates a predictable and unique ID for every private conversation.
    -   Subcollection: `messages` (contains all messages for that chat). This is a scalable pattern for handling long conversations.

-   `notifications`: Stores user-specific notifications.
    -   `userId`, `title`, `description`, `href`, `read`.

-   `roadmap_status`: Tracks the completion status of curriculum weeks for each generation.
    -   Document ID is the `weekId`. This makes it easy to query the status of any week.

---

## 4. Core Features & Logic

### 4.1. Authentication and Authorization

-   **Role-Based Access Control (RBAC)**: The app supports three roles: `student`, `teacher`, and `admin`.
    -   **Why**: RBAC is a standard and effective security model. It ensures that users can only access the data and features appropriate for their role.
-   **UI Rendering**: The `AuthContext` provides the user's role, which is used to conditionally render UI components.
    -   **Why**: This prevents users from even seeing options they are not permitted to use, creating a cleaner and more secure user experience.
-   **Data Security**: **Firestore Security Rules** are used to enforce data access policies on the backend.
    -   **Why**: This is the most critical security layer. While the UI can hide things, server-side rules ensure that even a malicious user cannot directly access or modify data they are not authorized to, guaranteeing data integrity.

### 4.2. Academic Content Management

-   Each piece of content has a `targetGen` field.
    -   **Why**: This allows for efficient querying. The application only fetches content relevant to the logged-in user, which reduces data transfer and improves performance.

### 4.3. Grading and Points System

-   A student's `totalPoints` are stored on their `user` document and are updated atomically using `increment()`.
    -   **Why**: Atomic operations are crucial for reliability. They ensure that even if multiple updates happen at the same time, the final point count will be accurate, preventing race conditions and data corruption.

### 4.4. Real-time Communication

-   The chat feature uses Firestore's real-time listeners (`onSnapshot`).
    -   **Why**: This is the most efficient way to build real-time features with Firestore. It allows the server to push updates to the client instantly, so messages appear without the need for manual polling or page refreshing.

### 4.5. State Management

-   **React Context** is the primary method for managing global state.
    -   **Why**: Using separate, focused providers (`AuthProvider`, `AssignmentsContext`, etc.) encapsulates related state and logic. This keeps component code clean, prevents "prop drilling," and centralizes data-fetching logic for easier management.

---

## 5. Functional Requirements

### 5.1. General (All Users)
- **Authentication**: Users must be able to sign up, log in, and log out.
- **Profile Management**: Users can view and update their own profile information (name, bio, profile picture).
- **Real-time Chat**: All users can send and receive messages in real-time.
- **Notifications**: Users receive real-time notifications for important events.

### 5.2. Student-Specific
- **Dashboard**: View a personalized summary of weekly topics, schedule, and recent resources.
- **Academic Content**: View announcements, assignments, etc., targeted to their generation.
- **Submissions**: Submit links to their work for all academic tasks.
- **Grading & Points**: View their total points and a breakdown of how they were earned.
- **Roadmap**: Track their progress as marked by a teacher.
- **Booking**: Book one-on-one sessions with teachers.
- **Directory**: View a directory of all staff members.

### 5.3. Teacher-Specific
- **Dashboard**: View a summary of key metrics for a selected student generation.
- **Content Management**: Create, update, and delete announcements, assignments, etc.
- **Submission Review**: View all submissions for the academic content they've created.
- **Grading**: Grade submissions, provide feedback, and award points.
- **Student Management**: View a list of all students and their performance.
- **Roadmap Management**: Mark curriculum weeks as complete for different generations.
- **Availability**: Set and manage their own availability.

### 5.4. Admin-Specific
- **Full CRUD Operations**: Admins have full permissions on all data collections.
- **User Management**: Can view and manage all user accounts and roles.
- **System Oversight**: Has access to all dashboards and management pages.

---

## 6. Non-Functional Requirements

### 6.1. Performance
- **Page Load Speed**: The application should load quickly.
    -   **How**: Achieved by using Next.js Server Components to render content on the server, which minimizes the amount of JavaScript sent to the client.
- **Responsiveness**: The UI must be fully responsive on all device sizes.
    -   **How**: Achieved using Tailwind CSS, a utility-first framework designed for building responsive layouts.
- **Real-time Updates**: Chat and notifications should appear instantly.
    -   **How**: Implemented using Firestore's `onSnapshot` real-time listeners.

### 6.2. Scalability
- **Serverless Backend**: The backend must scale automatically with user growth.
    -   **How**: Firebase services (Firestore, Auth, Storage) are built on Google Cloud's infrastructure and scale automatically without manual intervention.
- **Efficient Queries**: Database queries must remain fast even with large amounts of data.
    -   **How**: Firestore queries are indexed by default. The data model is designed to allow for shallow queries that fetch only the necessary data for a given view.

### 6.3. Security
- **Authentication**: All sensitive routes must be protected.
- **Authorization (RBAC)**: Access to data and features must be strictly controlled by role.
    -   **How**: Firestore Security Rules provide the primary line of defense, enforcing data validation and access control on the server-side to prevent unauthorized data manipulation.

### 6.4. Usability & Accessibility
- **Intuitive Interface**: The UI must be clean, modern, and easy to navigate.
- **Accessibility**: The application must be usable by people with disabilities.
    -   **How**: ShadCN UI components are built on Radix UI, which is WAI-ARIA compliant, ensuring a high standard of accessibility out of the box.

### 6.5. Reliability
- **High Availability**: The application must have minimal downtime.
    -   **How**: Relying on Google Cloud's infrastructure via Firebase provides high uptime and reliability.
- **Atomic Operations**: Critical data updates (like awarding points) must be fail-safe.
    -   **How**: Achieved by using atomic transactions (`increment()`) in Firestore to prevent race conditions and ensure data consistency.
