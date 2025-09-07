// src/components/chat/Chat.tsx
'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Loader2, ArrowLeft, ArrowDownCircle, Reply, Pin, Trash2, Edit, X, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/services/chat';
import { updateMessage, getChatId, deleteMessage } from '@/services/chat';
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
import { UserData, useAuth } from '@/contexts/AuthContext';

type ChatEntity = { id: string; name: string; avatar?: string; dataAiHint: string; type: 'dm' | 'group' };
interface ChatProps {
  entity: ChatEntity;
  messages: Message[];
  onSendMessage: (text: string, replyTo?: Message, mentions?: UserData[]) => void;
  currentUser: User | null;
  onToggleContacts: () => void;
  allUsers: UserData[];
}

const MessageBubble = React.memo(({
  msg,
  currentUser,
  onReply,
  onPin,
  onEdit,
  onDelete,
  allUsers,
}: {
  msg: Message;
  currentUser: User | null;
  onReply: (message: Message) => void;
  onPin: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  allUsers: UserData[];
}) => {
  const isSender = msg.senderId === currentUser?.uid;
  const messageTime = msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '';
  const senderData = allUsers.find(u => u.uid === msg.senderId);
  const senderPhoto = senderData?.photoURL;
  
  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3',
        isSender ? 'flex-row-reverse' : 'justify-start'
      )}
    >
      <div className={cn('max-w-[75%]', isSender ? 'flex flex-col items-end' : 'flex flex-col items-start')}>
        <div
          className={cn(
            'relative w-fit rounded-xl p-3 text-sm',
            isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none',
            msg.isPinned && 'border-2 border-primary'
          )}
        >
          {msg.isPinned && <Pin className="absolute -top-2 -left-2 h-4 w-4 rotate-45 text-primary" />}
          <p className='whitespace-pre-wrap'>{msg.text}</p>
        </div>
        <div className={cn('mt-1 flex items-baseline gap-2 text-xs text-muted-foreground')}>
            <p>{isSender ? 'You' : msg.senderName}</p>
            <p>{messageTime}</p>
            {msg.edited && <span>(edited)</span>}
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
      <span className='rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
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
  allUsers,
}: ChatProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | undefined>(undefined);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);

  const handlePin = async (message: Message) => {
    if (!currentUser) return;
    let chatId: string;
    if (entity.type === 'dm') {
      chatId = getChatId(currentUser.uid, entity.id);
    } else {
      chatId = entity.id;
    }
    try {
      await updateMessage(chatId, message.id, { isPinned: !message.isPinned });
      toast({ title: message.isPinned ? 'Message Unpinned' : 'Message Pinned!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not pin message.' });
    }
  };

  useEffect(() => {
    setReplyTo(undefined);
    setEditingMessageId(null);
  }, [entity.id]);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'auto') => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior });
        }
    }
  };

  useEffect(() => {
    const lastPinned = messages.filter(m => m.isPinned).sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
    setPinnedMessage(lastPinned || null);
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            const { scrollTop, scrollHeight, clientHeight } = viewport;
            const isScrolledUp = scrollHeight - scrollTop > clientHeight + 100;
            setShowScrollToBottom(isScrolledUp);
        }
    }
  };

  const handleEditClick = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const messageList = useMemo(() => {
    const regularMessages = pinnedMessage ? messages.filter(m => m.id !== pinnedMessage.id) : messages;
    return regularMessages.map((msg, index) => {
      const prevMessage = regularMessages[index - 1];
      const showDateSeparator =
        msg.timestamp &&
        (!prevMessage ||
          !prevMessage.timestamp ||
          format(prevMessage.timestamp.toDate(), 'yyyy-MM-dd') !==
            format(msg.timestamp.toDate(), 'yyyy-MM-dd'));
      return (
        <React.Fragment key={msg.id}>
          {showDateSeparator && <DateSeparator date={msg.timestamp.toDate()} />}
          <MessageBubble
            msg={msg}
            currentUser={currentUser}
            onReply={setReplyTo}
            onPin={handlePin}
            onEdit={handleEditClick}
            onDelete={setDeletingMessage}
            allUsers={allUsers}
          />
        </React.Fragment>
      );
    });
  }, [messages, currentUser, pinnedMessage, allUsers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text, replyTo);
    setText('');
    setReplyTo(undefined);
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
      await updateMessage(chatId, editingMessageId, { text: editingText, edited: true });
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
      <div className='h-full flex flex-col bg-muted'>
        <header className='flex h-[65px] shrink-0 items-center gap-4 border-b bg-background p-4'>
          <Button variant='ghost' size='icon' onClick={onToggleContacts} className='md:hidden'>
            <ArrowLeft className='h-5 w-5' />
            <span className='sr-only'>Back</span>
          </Button>
          <div className="flex items-center gap-3">
             <Avatar className='h-10 w-10'>
                <AvatarImage src={entity.avatar} alt={entity.name} />
                <AvatarFallback>{entity.name.charAt(0)}</AvatarFallback>
            </Avatar>
             <div>
                <h2 className='text-base font-semibold'>{entity.name}</h2>
                <p className="text-xs text-muted-foreground">online</p>
             </div>
          </div>
          <div className="ml-auto">
            {showScrollToBottom && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => scrollToBottom('smooth')}
                >
                    <ArrowDownCircle className="h-6 w-6" />
                </Button>
            )}
          </div>
        </header>

        <div className="flex-1 min-h-0">
          <ScrollArea
            className='h-full'
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            <div className='space-y-6 p-4 md:p-6'>
              {messageList}
            </div>
          </ScrollArea>
        </div>

        <footer className='shrink-0 border-t bg-background p-4'>
          {editingMessageId ? (
            <div className="flex items-center gap-2">
              <Input
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                placeholder="Editing message..."
                className="h-12 w-full rounded-lg border-none bg-gray-100 pr-12 focus:ring-0 dark:bg-gray-800"
              />
              <Button onClick={handleSaveEdit} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='relative flex-1'>
              <Input
                value={text || ''}
                onChange={(e) => setText(e.target.value)}
                placeholder='Enter your message here'
                className='h-12 w-full rounded-lg bg-muted pr-28 focus-visible:ring-1 focus-visible:ring-ring'
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <Button type="button" variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
                <Button type="button" variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button>
                <Button
                  type='submit'
                  size='default'
                  className='rounded-lg'
                >
                  Send
                </Button>
              </div>
            </form>
          )}
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