
// src/components/chat/Chat.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Users,
  Loader2,
  ArrowLeft,
  ArrowDownCircle,
  Reply,
  Pin,
  Trash2,
  Edit,
  X,
  Smile,
  MoreVertical,
  Search,
  Paperclip,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Picker from 'emoji-picker-react';
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
import { UserData } from '@/contexts/AuthContext';

type ChatEntity = {
  id: string;
  name: string;
  avatar?: string;
  dataAiHint: string;
  type: 'dm' | 'group';
};

interface ChatProps {
  entity: ChatEntity;
  messages: Message[];
  onSendMessage: (text: string, replyTo?: Message, mentions?: UserData[]) => void;
  currentUser: User | null;
  onToggleContacts: () => void;
  loading: boolean;
  allUsers: UserData[];
}

const MessageBubble = React.memo(({ msg, currentUser }: { msg: Message; currentUser: User | null }) => {
    const isSender = msg.senderId === currentUser?.uid;
    const messageTime = msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '';
    
    return (
        <div className={cn("group flex w-full items-start gap-3", isSender ? "flex-row-reverse" : "justify-start")}>
             {!isSender && (
                <Avatar className='h-8 w-8 shrink-0'>
                    <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
             )}
            <div className={cn("flex flex-col", isSender ? "items-end" : "items-start")}>
                 {!isSender && (
                    <p className='text-xs text-muted-foreground mb-1'>{msg.senderName}</p>
                 )}
                 <div className={cn("relative w-fit rounded-lg p-3 text-sm shadow-sm", isSender ? 'bg-primary text-primary-foreground' : 'bg-background')}>
                    <p className='whitespace-pre-wrap'>{msg.text}</p>
                 </div>
                  <p className='text-xs text-muted-foreground mt-1'>{messageTime}</p>
            </div>
        </div>
    )
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
  loading,
  allUsers,
}: ChatProps) {
  const [text, setText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom('auto');
  }, [messages, entity.id]);


  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'auto') => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      }
    }
  };

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
          <MessageBubble
            msg={msg}
            currentUser={currentUser}
          />
        </React.Fragment>
      );
    });
  }, [messages, currentUser, allUsers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <div className='h-full flex flex-col bg-muted/40'>
        {/* Header - Fixed */}
        <header className='flex h-[60px] shrink-0 items-center gap-4 border-b bg-background p-3'>
          <Button
            variant='ghost'
            size='icon'
            onClick={onToggleContacts}
            className='md:hidden'
          >
            <ArrowLeft className='h-5 w-5' />
            <span className='sr-only'>Back</span>
          </Button>
          <Avatar className='h-10 w-10'>
            <AvatarFallback>{entity.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className='text-md font-semibold'>{entity.name}</h2>
            <p className="text-xs text-muted-foreground">{allUsers.length} members</p>
          </div>
           <Button variant="ghost" size="icon">
             <Search className="h-5 w-5" />
           </Button>
           <Button variant="ghost" size="icon">
             <MoreVertical className="h-5 w-5" />
           </Button>
        </header>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 min-h-0">
          <ScrollArea
            className='h-full'
            ref={scrollAreaRef}
          >
            <div className='space-y-6 p-4 md:p-6'>{messageList}</div>
          </ScrollArea>
        </div>

        {/* Input Area - Fixed */}
        <footer className='shrink-0 border-t bg-background p-4'>
            <form onSubmit={handleSubmit} className='relative w-full flex items-center gap-2'>
                <Input
                value={text || ''}
                onChange={(e) => setText(e.target.value)}
                placeholder='Type a message...'
                className='h-12 w-full rounded-full border-input bg-muted pr-24 focus-visible:ring-1'
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute right-24 h-9 w-9 rounded-full text-muted-foreground">
                      <Smile className='h-5 w-5' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 border-none mb-2">
                    <Picker onEmojiClick={(emojiObject) => setText(prev => prev + emojiObject.emoji)} />
                  </PopoverContent>
                </Popover>
                 <Button variant="ghost" size="icon" className="absolute right-14 h-9 w-9 rounded-full text-muted-foreground">
                    <Paperclip className="h-5 w-5" />
                </Button>
                <Button
                type='submit'
                size='icon'
                className='h-10 w-10 rounded-full bg-primary text-primary-foreground'
                >
                <Send className='h-5 w-5' />
                </Button>
            </form>
        </footer>
      </div>
  );
});
