// src/contexts/BookingsContext.tsx (MIGRATED TO MONGODB)
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FC, type ReactNode } from 'react';
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
  dateTime: string;
  reason: string;
  meetingType: MeetingType;
  status: BookingStatus;
  meetingLink?: string;
  responseNote?: string;
  createdAt: string;
  respondedAt?: string;
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

  const fetchBookings = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      setBookings([]);
      return;
    }

    setLoading(true);
    try {
      let url = '/api/bookings';
      
      if (role === 'teacher') {
        url += `?staffId=${user.uid}`;
      } else if (role === 'student') {
        url += `?studentId=${user.uid}`;
      }
      // Admin sees all bookings (no filter)

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        const fetchedBookings = result.bookings.map((booking: any) => ({
          ...booking,
          id: booking._id,
          dateTime: new Date(booking.dateTime).toISOString(),
          createdAt: new Date(booking.createdAt).toISOString(),
          respondedAt: booking.respondedAt ? new Date(booking.respondedAt).toISOString() : undefined,
        }));
        setBookings(fetchedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user, role, authLoading]);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const addBooking = useCallback(
    async (input: NewBookingInput) => {
      if (!user || role !== 'student') {
        throw new Error('Only students can create bookings.');
      }
      
      const staff = allUsers.find((u) => u.uid === input.staffId);

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: user.uid,
            studentName: userData?.displayName ?? 'Student',
            staffId: input.staffId,
            staffName: staff?.displayName ?? 'Staff',
            dateTime: input.dateTime.toISOString(),
            reason: input.reason,
            meetingType: input.meetingType,
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to create booking');
        }

        // Notify the staff member
        await addNotificationForUser(input.staffId, {
          title: 'New booking request',
          description: `${userData?.displayName ?? 'Student'} requested a ${input.meetingType} session`,
          href: '/bookings',
        });

        await fetchBookings();
      } catch (error: any) {
        console.error('Error creating booking:', error);
        throw error;
      }
    },
    [user, role, userData, allUsers, addNotificationForUser, fetchBookings]
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

      try {
        const updateData: any = { 
          status,
          respondedAt: new Date().toISOString(),
        };

        if (meetingLink && booking.meetingType === 'online') {
          updateData.meetingLink = meetingLink;
        }

        if (responseNote) {
          updateData.responseNote = responseNote;
        }

        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to update booking');
        }

        // Notify the student
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

        await fetchBookings();
      } catch (error: any) {
        console.error('Error updating booking:', error);
        throw error;
      }
    },
    [user, role, bookings, addNotificationForUser, fetchBookings]
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