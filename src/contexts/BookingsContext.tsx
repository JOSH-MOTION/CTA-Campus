'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FC, type ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

export type MeetingType = 'online' | 'in-person';
export type BookingStatus = 'pending' | 'accepted' | 'rejected';

export interface Booking {
  id: string;
  studentId: string;
  studentName?: string;
  staffId: string;
  staffName?: string;
  dateTime: Timestamp;
  reason: string;
  meetingType: MeetingType;
  status: BookingStatus;
  meetingLink?: string; // NEW: Google Meet link
  responseNote?: string; // NEW: Optional note from teacher
  createdAt: Timestamp;
  respondedAt?: Timestamp; // NEW: When teacher responded
}

export type NewBookingInput = {
  staffId: string;
  dateTime: Date;
  reason: string;
  meetingType: MeetingType;
};

interface BookingsContextType {
  bookings: Booking[];
  loading: boolean;
  addBooking: (input: NewBookingInput) => Promise<void>;
  updateBookingStatus: (
    bookingId: string, 
    status: Exclude<BookingStatus, 'pending'>,
    meetingLink?: string,
    responseNote?: string
  ) => Promise<void>;
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export const BookingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user, role, userData, allUsers, loading: authLoading } = useAuth();
  const { addNotificationForUser } = useNotifications();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const bookingsCol = collection(db, 'bookings');

    let q;
    if (role === 'teacher') {
      // Teachers see bookings where they are the staff member
      q = query(
        bookingsCol, 
        where('staffId', '==', user.uid), 
        orderBy('dateTime', 'desc')
      );
    } else if (role === 'admin') {
      // Admins see all bookings
      q = query(bookingsCol, orderBy('dateTime', 'desc'));
    } else {
      // Students see their own bookings
      q = query(
        bookingsCol, 
        where('studentId', '==', user.uid), 
        orderBy('dateTime', 'desc')
      );
    }

    unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ 
          id: d.id, 
          ...(d.data() as Omit<Booking, 'id'>) 
        })) as Booking[];
        setBookings(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching bookings:', err);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, role, authLoading]);

  const addBooking = useCallback(
    async (input: NewBookingInput) => {
      if (!user || role !== 'student') {
        throw new Error('Only students can create bookings.');
      }
      
      const staff = allUsers.find((u) => u.uid === input.staffId);

      const payload = {
        studentId: user.uid,
        studentName: userData?.displayName ?? 'Student',
        staffId: input.staffId,
        staffName: staff?.displayName ?? 'Staff',
        dateTime: Timestamp.fromDate(input.dateTime),
        reason: input.reason,
        meetingType: input.meetingType,
        status: 'pending' as BookingStatus,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'bookings'), payload);

      // Notify the staff member
      try {
        await addNotificationForUser(input.staffId, {
          title: 'New booking request',
          description: `${payload.studentName} requested a ${payload.meetingType} session`,
          href: '/bookings',
        });
      } catch (e) {
        console.error('Failed to notify staff about booking request:', e);
      }
    },
    [user, role, userData, allUsers, addNotificationForUser]
  );

  const updateBookingStatus = useCallback(
    async (
      bookingId: string, 
      status: Exclude<BookingStatus, 'pending'>,
      meetingLink?: string,
      responseNote?: string
    ) => {
      if (!user || (role !== 'teacher' && role !== 'admin')) {
        throw new Error('Not authorized');
      }
      
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      const bookingRef = doc(db, 'bookings', bookingId);
      const updateData: any = { 
        status,
        respondedAt: serverTimestamp()
      };

      // Add meeting link if provided and it's an online meeting
      if (meetingLink && booking.meetingType === 'online') {
        updateData.meetingLink = meetingLink;
      }

      // Add response note if provided
      if (responseNote) {
        updateData.responseNote = responseNote;
      }

      await updateDoc(bookingRef, updateData);

      // Notify the student
      try {
        let description = `${booking.staffName ?? 'Staff'} ${status} your ${booking.meetingType} session`;
        
        if (status === 'accepted') {
          if (booking.meetingType === 'online' && meetingLink) {
            description += `. Meeting link: ${meetingLink}`;
          }
          if (responseNote) {
            description += `. Note: ${responseNote}`;
          }
        } else if (status === 'rejected' && responseNote) {
          description += `. Reason: ${responseNote}`;
        }

        await addNotificationForUser(booking.studentId, {
          title: `Booking ${status}`,
          description,
          href: '/book-session',
        });
      } catch (e) {
        console.error('Failed to notify student about booking status:', e);
      }
    },
    [user, role, bookings, addNotificationForUser]
  );

  const value = useMemo(
    () => ({ bookings, loading, addBooking, updateBookingStatus }),
    [bookings, loading, addBooking, updateBookingStatus]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = (): BookingsContextType => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within a BookingsProvider');
  return ctx;
};