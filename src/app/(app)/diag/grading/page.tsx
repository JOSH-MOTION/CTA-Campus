// src/app/(app)/diag/grading/page.tsx
'use client';

// Diagnostic version of GradeSubmissionDialog.tsx
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { awardPointsAction, gradeSubmissionAction } from '@/app/actions/grading-actions';

// Mock the components that aren't available in this environment
const Button = ({ children, onClick, disabled, className, ...props }: { children: React.ReactNode, onClick: () => void, disabled: boolean, className?: string }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`px-4 py-2 rounded ${disabled ? 'opacity-50' : ''} ${className || ''}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`border rounded-lg ${className || ''}`}>{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="p-4 border-b">{children}</div>;
const CardTitle = ({ children }: { children: React.ReactNode }) => <h3 className="font-semibold">{children}</h3>;
const CardContent = ({ children }: { children: React.ReactNode }) => <div className="p-4">{children}</div>;

// Mock submission data
const mockSubmission = {
  id: 'sub_123',
  studentId: 'student_456', 
  studentName: 'John Doe',
  studentGen: 'Gen 5',
  assignmentTitle: 'Weekly Project - Portfolio',
  pointCategory: 'Weekly Projects',
  feedback: ''
};

export default function DiagnosticGradingDialog() {
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<{message: string, type: string, timestamp: string}[]>([]);
  const [feedback, setFeedback] = useState('');

  const addLog = (message: string, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const getActivityIdForSubmission = (submission: any) => {
    switch (submission.pointCategory) {
        case 'Class Assignments':
            return `graded-submission-${submission.id}`;
        case 'Class Exercises':
            return `graded-exercise-${submission.id}`;
        case 'Weekly Projects':
            return `graded-project-${submission.id}`;
        case '100 Days of Code':
            return `100-days-of-code-${submission.assignmentTitle.replace('100 Days of Code - ', '')}`;
        default:
            return `graded-submission-${submission.id}`;
    }
  };

  const handleGradeSubmission = async () => {
    if (!user || !userData) {
      setError('You must be logged in to perform this action.');
      addLog('❌ Error: User or userData is not available. Please log in.', 'error');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setLogs([]);

    try {
      addLog('🚀 Starting grading process...', 'info');
      addLog(`📝 User: ${userData.displayName} (${userData.role})`, 'info');
      
      // Step 1: Get fresh token
      addLog('🔑 Getting fresh ID token...', 'info');
      const idToken = await user.getIdToken(true);
      addLog(`✅ Token obtained (first 15 chars: ${idToken.substring(0,15)}...)`, 'success');
      
      // Step 2: Award points
      const activityId = getActivityIdForSubmission(mockSubmission);
      const pointsToAward = mockSubmission.pointCategory === '100 Days of Code' ? 0.5 : 1;

      addLog(`🎯 Calling awardPointsAction for activity: ${activityId}`, 'info');
      
      const awardResult = await awardPointsAction({
            studentId: mockSubmission.studentId,
            points: pointsToAward,
            reason: mockSubmission.pointCategory,
            activityId,
            action: 'award',
            assignmentTitle: mockSubmission.assignmentTitle,
            idToken,
      });

      addLog(`📊 Points award result: ${awardResult.success ? 'SUCCESS' : 'FAILED'} - ${awardResult.message}`, 
             awardResult.success ? 'success' : 'error');

      if (!awardResult.success) {
        if (awardResult.message && awardResult.message.includes('already awarded')) {
          addLog('ℹ️ Points already awarded, continuing with grading...', 'warning');
        } else {
          throw new Error(awardResult.message);
        }
      }

      // Step 3: Grade submission
      addLog('📝 Calling gradeSubmissionAction...', 'info');
      
      const gradeResult = await gradeSubmissionAction({
            submissionId: mockSubmission.id,
            studentId: mockSubmission.studentId,
            assignmentTitle: mockSubmission.assignmentTitle,
            grade: 'Complete',
            feedback: feedback,
            idToken,
      });


      addLog(`✅ Grading result: ${gradeResult.success ? 'SUCCESS' : 'FAILED'} - ${gradeResult.message}`, 
             gradeResult.success ? 'success' : 'error');

      if (!gradeResult.success) {
        throw new Error(gradeResult.message);
      }

      addLog('🎉 Grading completed successfully!', 'success');
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`, 'error');
      setError(error.message);
      
      // Additional diagnostic info
      if (error.message.includes('Session invalid')) {
        addLog('🔍 This is a session authentication error', 'error');
        addLog('💡 Possible causes:', 'info');
        addLog('   - Token has expired or been revoked', 'info');
        addLog('   - Server-side verification failed (check server logs)', 'info');
        addLog('   - User permissions are insufficient (role missing or incorrect)', 'info');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔬 Grading Diagnostic Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">User Info:</h4>
            <div className="bg-gray-50 p-3 rounded text-sm dark:bg-gray-800">
              <p><strong>Display Name:</strong> {userData?.displayName || 'Not available'}</p>
              <p><strong>Email:</strong> {user?.email || 'Not available'}</p>
              <p><strong>Role:</strong> {userData?.role || 'Not available'}</p>
              <p><strong>UID:</strong> {user?.uid || 'Not available'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Mock Submission:</h4>
            <div className="bg-gray-50 p-3 rounded text-sm dark:bg-gray-800">
              <p><strong>Student:</strong> {mockSubmission.studentName}</p>
              <p><strong>Assignment:</strong> {mockSubmission.assignmentTitle}</p>
              <p><strong>Category:</strong> {mockSubmission.pointCategory}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Feedback:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-2 border rounded-md bg-transparent"
              rows={3}
              placeholder="Enter feedback..."
            />
          </div>

          <Button
            onClick={handleGradeSubmission}
            disabled={isSubmitting}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? '⏳ Processing...' : '🎯 Test Grading Process'}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Logs Display */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Process Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-white p-4 rounded-md text-sm font-mono max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className={`mb-1 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 
                  log.type === 'warning' ? 'text-yellow-400' : 
                  'text-blue-400'
                }`}>
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>🛠️ Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Check Browser Console:</strong> Look for any Firebase authentication errors</p>
          <p><strong>2. Verify Token:</strong> The logs above show if token generation is working</p>
          <p><strong>3. Check Server Logs:</strong> Look at your server console for detailed error messages</p>
          <p><strong>4. Test User Permissions:</strong> Ensure your user has the correct role (teacher/admin)</p>
          <p><strong>5. Firebase Admin Setup:</strong> Verify your Firebase Admin SDK is properly configured</p>
        </CardContent>
      </Card>
    </div>
  );
}
