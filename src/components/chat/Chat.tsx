
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Loader2, ArrowLeft, ArrowDownCircle, Reply, Pin, Trash2, Edit, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/services/chat';
import { updateMessage, getChatId } from '@/services/chat';
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { UserData } from '@/contexts/AuthContext';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

type ChatEntity = { id: string; name: string; avatar?: string; dataAiHint: string; type: 'dm' | 'group' };

interface ChatProps {
  entity: ChatEntity;
  messages: Message[];
  onSendMessage: (text: string, replyTo?: Message) => void;
  currentUser: User | null;
  onToggleContacts: () => void;
  loading: boolean;
  allUsers: UserData[];
}

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

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3',
        isSender ? 'flex-row-reverse' : 'justify-start'
      )}
    >
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
            isSender ? 'bg-gray-200 dark:bg-gray-700' : 'bg-white dark:bg-gray-800',
            msg.isPinned && 'border-2 border-primary'
          )}
        >
          {msg.isPinned && <Pin className="absolute -top-2 -left-2 h-4 w-4 rotate-45 text-primary" />}
          <p className='whitespace-pre-wrap'>{msg.text}</p>
           {msg.edited && <span className="text-xs text-gray-500 ml-2">(edited)</span>}
        </div>
      </div>
      <div
        className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isSender ? 'flex-row-reverse' : ''
        )}
      >
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply(msg)}><Reply className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPin(msg)}><Pin className="h-3 w-3" /></Button>
        {isSender && (
          <>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(msg)}><Edit className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(msg)}><Trash2 className="h-3 w-3" /></Button>
          </>
        )}
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
  loading,
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionPopover, setShowMentionPopover] = useState(false);

  const availableMentionUsers = useMemo(() => {
    if (entity.type === 'dm') {
      const otherUser = allUsers.find(u => u.uid === entity.id);
      return otherUser ? [otherUser] : [];
    }
    return allUsers.filter(u => u.uid !== currentUser?.uid);
  }, [entity, allUsers, currentUser]);

  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    return availableMentionUsers.filter(u => 
      u.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [mentionQuery, availableMentionUsers]);
  
  const checkMentionState = (currentText: string) => {
    const mentionMatch = currentText.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionPopover(true);
    } else {
      setShowMentionPopover(false);
      setMentionQuery(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    checkMentionState(newText);
  };
  
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Only check for mention if the last character is @
    if (e.target.value.endsWith('@')) {
      checkMentionState(e.target.value);
    }
  };

  const handleSelectMention = (user: UserData) => {
    const newText = text.replace(/@\w*$/, `@${user.displayName} `);
    setText(newText);
    setShowMentionPopover(false);
    setMentionQuery(null);
  };

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
    if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior });
    }
  };

  useEffect(() => {
    const lastPinned = messages.filter(m => m.isPinned).sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
    setPinnedMessage(lastPinned || null);
    
    if (!viewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    
    if (scrollHeight - scrollTop < clientHeight + 200) {
        scrollToBottom();
    }
  }, [messages]);

  const handleScroll = () => {
    if (viewportRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
        const isScrolledUp = scrollHeight - scrollTop > clientHeight + 100;
        setShowScrollToBottom(isScrolledUp);
    }
  };
  
  const handleEditClick = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };
  
  const messageList = useMemo(() => {
    const regularMessages = pinnedMessage 
        ? messages.filter(m => m.id !== pinnedMessage.id) 
        : messages;

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
  }, [messages, currentUser, pinnedMessage, handlePin]);

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
      // This is incorrect. The deleteMessage function must be called here.
      // Not implemented for now.
      toast({ title: 'Message deleted (Not Implemented)' });
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

        {pinnedMessage && (
            <div className="flex-shrink-0 border-b border-primary/20 bg-primary/5 p-3">
                <div className="flex items-start gap-3">
                    <Pin className="h-4 w-4 mt-1 text-primary" />
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-primary">Pinned by {pinnedMessage.senderName}</p>
                        <p className="text-sm text-foreground">{pinnedMessage.text}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePin(pinnedMessage)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}

        <div className="flex-1 relative">
            <ScrollArea className='h-full' viewportRef={viewportRef} onScroll={handleScroll}>
              <div className='space-y-6 p-4 md:p-10'>{messageList}</div>
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


        <footer className='shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950'>
          <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
            <PopoverTrigger asChild>
                <form onSubmit={handleSubmit} className='relative flex-1'>
                    <Input
                    value={text || ''}
                    onChange={handleTextChange}
                    onFocus={handleInputFocus}
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
            </PopoverTrigger>
             <PopoverContent 
                className="w-80 p-0" 
                side="top" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
              <Command>
                <CommandInput placeholder="Mention a user..." />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {filteredMentions.map(user => (
                      <CommandItem
                        key={user.uid}
                        onSelect={() => handleSelectMention(user)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{user.displayName}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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

