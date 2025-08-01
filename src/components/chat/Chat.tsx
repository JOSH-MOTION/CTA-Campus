'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/services/chat';
import { deleteMessage, updateMessage, getChatId } from '@/services/chat';
import type { User } from 'firebase/auth';
import { format, isToday, isYesterday } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type ChatEntity = { id: string; name: string; avatar?: string; dataAiHint: string; type: 'dm' | 'group' };

interface ChatProps {
  entity: ChatEntity;
  messages: Message[];
  onSendMessage: (text: string, replyTo?: Message) => void;
  currentUser: User | null;
  onToggleContacts: () => void;
  loading: boolean;
}

const MessageBubble = React.memo(({ msg, currentUser }: { msg: Message; currentUser: User | null }) => {
  const isSender = msg.senderId === currentUser?.uid;
  const messageTime = msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '';

  return (
    <div className={cn('flex w-full items-start gap-3', isSender ? 'flex-row-reverse' : 'justify-start')}>
      {!isSender && (
        <Avatar className='h-8 w-8'>
          <AvatarImage src={`https://placehold.co/100x100.png?text=${msg.senderName.charAt(0)}`} alt={msg.senderName} />
          <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-[75%]', isSender ? 'flex flex-col items-end' : 'flex flex-col items-start')}>
        <div className={cn('mb-1 flex items-baseline gap-2', isSender ? 'flex-row-reverse' : 'justify-start')}>
          <p className='text-xs'>{isSender ? 'You' : msg.senderName}</p>
          <p className='text-xs text-gray-500'>{messageTime}</p>
        </div>
        <div
          className={cn(
            'relative w-fit rounded-lg p-3 text-sm shadow-sm',
            isSender ? 'bg-gray-200 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
          )}
        >
          <p className='whitespace-pre-wrap'>{msg.text}</p>
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

const DateSeparator = React.memo(({ date }: { date: Date }) => {
  let label;
  if (!date) return null;
  if (isToday(date)) {
    label = 'Today';
  } else if (isYesterday(date)) {
    label = 'Yesterday';
  } else {
    label = format(date, 'MMMM d, yyyy');
  }

  return (
    <div className='my-4 flex justify-center'>
      <span className='rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400'>
        {label}
      </span>
    </div>
  );
});
DateSeparator.displayName = 'DateSeparator';

export const Chat = React.memo(function Chat({
  entity,
  messages,
  onSendMessage,
  currentUser,
  onToggleContacts,
  loading
}: ChatProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | undefined>(undefined);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setReplyTo(undefined);
    setEditingMessageId(null);
  }, [entity.id]);

  const messageList = useMemo(() => {
    return messages.map((msg, index) => {
      const prevMessage = messages[index - 1];
      const showDateSeparator =
        msg.timestamp &&
        (!prevMessage ||
          !prevMessage.timestamp ||
          format(prevMessage.timestamp.toDate(), 'yyyy-MM-dd') !==
            format(msg.timestamp.toDate(), 'yyyy-MM-dd'));
      return (
        <React.Fragment key={msg.id}>
          {showDateSeparator && <DateSeparator date={msg.timestamp.toDate()} />}
          <MessageBubble msg={msg} currentUser={currentUser} />
        </React.Fragment>
      );
    });
  }, [messages, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text, replyTo);
    setText('');
    setReplyTo(undefined);
  };

  const handleReplyTo = (message: Message) => {
    setReplyTo(message);
  };

  const handleEditClick = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim() || !currentUser) return;

    let chatId: string;
    if (entity.type === 'dm') {
      chatId = getChatId(currentUser.uid, entity.id);
    } else {
      chatId = entity.id;
    }

    setIsProcessing(true);
    try {
      await updateMessage(chatId, editingMessageId, editingText);
      toast({ title: 'Message updated' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update message.' });
    } finally {
      setIsProcessing(false);
      handleCancelEdit();
    }
  };

  const handleDelete = async () => {
    if (!deletingMessage || !currentUser) return;

    let chatId: string;
    if (entity.type === 'dm') {
      chatId = getChatId(currentUser.uid, entity.id);
    } else {
      chatId = entity.id;
    }

    setIsProcessing(true);
    try {
      await deleteMessage(chatId, deletingMessage.id);
      toast({ title: 'Message deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete message.' });
    } finally {
      setIsProcessing(false);
      setDeletingMessage(null);
    }
  };

  return (
    <>
      <div className='flex h-full flex-col bg-gray-100 dark:bg-gray-900'>
        <header className='flex h-[60px] flex-shrink-0 items-center gap-4 border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950'>
          <Button variant='ghost' size='icon' onClick={onToggleContacts} className='md:hidden'>
            <ArrowLeft className='h-5 w-5' />
            <span className='sr-only'>Back</span>
          </Button>
          <Button variant='ghost' size='icon' onClick={onToggleContacts} className='hidden md:flex'>
            <Users className='h-5 w-5' />
            <span className='sr-only'>Toggle Contacts</span>
          </Button>
          <Avatar className='h-10 w-10'>
            <AvatarImage src={entity.avatar} alt={entity.name} />
            <AvatarFallback>{entity.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className='flex-1 text-lg font-semibold'>{entity.name}</h2>
        </header>

        <ScrollArea className='flex-1'>
          <div className='space-y-6 p-4 md:p-10'>{messageList}</div>
        </ScrollArea>

        <footer className='shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950'>
          <form onSubmit={handleSubmit} className='relative flex-1'>
            <Input
              value={text || ''}
              onChange={(e) => setText(e.target.value)}
              placeholder='Write your message...'
              className='h-12 w-full rounded-lg border-none bg-gray-100 pr-12 focus:ring-0 dark:bg-gray-800'
              disabled={editingMessageId !== null}
            />
            <Button
              type='submit'
              size='icon'
              className='absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30'
            >
              <Send className='h-5 w-5' />
            </Button>
          </form>
        </footer>
      </div>
      <AlertDialog open={!!deletingMessage} onOpenChange={(open) => !open && setDeletingMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isProcessing}>
              {isProcessing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});