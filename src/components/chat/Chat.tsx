// src/components/chat/Chat.tsx
'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Loader2, ArrowLeft, ArrowDownCircle, Reply, Pin, Trash2, Edit, X } from 'lucide-react';
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
  onSendMessage: (text: string, replyTo?: Message) => void;
  currentUser: User | null;
  onToggleContacts: () => void;
  allUsers: UserData[];
}

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


const MessageBubble = React.memo(({
  msg,
  currentUser,
  onReply,
  onPin,
  onEdit,
  onDelete,
}: {
  msg: Message;
  currentUser: User | null;
  onReply: (message: Message) => void;
  onPin: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}) => {
  const isSender = msg.senderId === currentUser?.uid;
  const messageTime = msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '';
  const senderPhoto = isSender ? currentUser?.photoURL : null; // TODO: get other user photo

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3',
        isSender ? 'flex-row-reverse' : 'justify-start'
      )}
    >
      <Avatar className='h-8 w-8'>
        <AvatarImage src={senderPhoto || undefined} alt={msg.senderName} />
        <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className={cn('max-w-[75%]', isSender ? 'flex flex-col items-end' : 'flex flex-col items-start')}>
        <div
          className={cn(
            'relative rounded-lg px-3 py-2 text-sm',
            isSender ? 'bg-primary text-primary-foreground' : 'bg-card',
            msg.isPinned && 'border-2 border-primary'
          )}
        >
          {msg.isPinned && <Pin className="absolute -top-2 -left-2 h-4 w-4 rotate-45 text-primary" />}
          {msg.replyTo && (
            <div className="mb-1 rounded bg-black/10 p-2">
              <p className="text-xs font-semibold">{msg.replyTo.senderName}</p>
              <p className="text-xs opacity-80">{msg.replyTo.text}</p>
            </div>
          )}
          {msg.text}
          <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-card rounded-full p-1 shadow-md"
               style={isSender ? { right: '100%', marginRight: '8px' } : { left: '100%', marginLeft: '8px' }}>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply(msg)}><Reply className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPin(msg)}><Pin className="h-3 w-3" /></Button>
              {isSender && (
                  <>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(msg)}><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(msg)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </>
              )}
          </div>
        </div>
        <div className={cn('mt-1 text-xs text-muted-foreground')}>{messageTime} {msg.edited && '(edited)'}</div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';


export const Chat = React.memo(function Chat({
  entity,
  messages,
  onSendMessage,
  currentUser,
  onToggleContacts,
  allUsers
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
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior,
        });
    }
  };

  useEffect(() => {
    const lastPinned = messages.filter(m => m.isPinned).sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
    setPinnedMessage(lastPinned || null);
    scrollToBottom();
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isScrolledUp = scrollHeight - scrollTop > clientHeight + 100;
    setShowScrollToBottom(isScrolledUp);
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
          />
        </React.Fragment>
      );
    });
  }, [messages, currentUser, pinnedMessage]);

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
      <div className='flex flex-col h-full bg-muted'>
        <header className='flex h-[60px] shrink-0 items-center gap-4 border-b bg-background p-4'>
          <Button variant='ghost' size='icon' onClick={onToggleContacts} className='md:hidden'>
            <ArrowLeft className='h-5 w-5' />
            <span className='sr-only'>Back</span>
          </Button>
          <div className='flex items-center gap-3'>
            <Avatar className='h-9 w-9'>
              <AvatarImage src={entity.avatar} alt={entity.name} />
              <AvatarFallback>{entity.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className='text-lg font-semibold'>{entity.name}</h2>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <ScrollArea
            className='h-full'
            onScroll={handleScroll}
            ref={scrollAreaRef}
          >
            <div className='space-y-4 p-4'>
              {pinnedMessage && (
                  <div className="sticky top-2 z-10">
                      <div className="rounded-md bg-amber-100 dark:bg-amber-900/50 p-2 border border-amber-300 dark:border-amber-700 flex items-center gap-2 text-xs">
                          <Pin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="font-semibold text-amber-700 dark:text-amber-300">{pinnedMessage.senderName}:</span>
                          <span className="truncate text-amber-800 dark:text-amber-200">{pinnedMessage.text}</span>
                      </div>
                  </div>
              )}
              {messageList}
            </div>
          </ScrollArea>
           {showScrollToBottom && (
              <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg"
                  onClick={() => scrollToBottom('smooth')}
              >
                  <ArrowDownCircle className="h-6 w-6" />
              </Button>
          )}
        </div>

        <footer className='shrink-0 border-t bg-background p-4 space-y-2'>
          {replyTo && (
            <div className="flex items-center justify-between rounded-md bg-muted p-2 text-sm">
              <div className="truncate">
                <p className="font-semibold">Replying to {replyTo.senderName}</p>
                <p className="truncate text-muted-foreground">{replyTo.text}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyTo(undefined)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {editingMessageId ? (
            <div className="flex items-center gap-2">
              <Input
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                placeholder="Editing message..."
                className="flex-1"
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
                placeholder={`Message ${entity.name}`}
                className='pr-12'
              />
              <Button
                type='submit'
                size='icon'
                className='absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2'
              >
                <Send className='h-4 w-4' />
              </Button>
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