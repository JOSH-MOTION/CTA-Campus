// src/components/chat/Chat.tsx
'use client';

import React, {useState, useRef, useEffect} from 'react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Send, Users, Loader2, ArrowLeft} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {Message} from '@/services/chat';
import {deleteMessage, updateMessage, getChatId} from '@/services/chat';
import type {User} from 'firebase/auth';
import {format, isToday, isYesterday} from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type ChatEntity = {id: string; name: string; avatar?: string; dataAiHint: string; type: 'dm' | 'group'};

interface ChatProps {
  entity: ChatEntity;
  messages: Message[];
  onSendMessage: (text: string, replyTo?: Message) => void;
  currentUser: User | null;
  onToggleContacts: () => void;
}

export function Chat({entity, messages, onSendMessage, currentUser, onToggleContacts}: ChatProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | undefined>(undefined);
  const viewportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, entity]);
  
  useEffect(() => {
      setReplyTo(undefined);
      setEditingMessageId(null);
  },[entity])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text, replyTo);
    setText('');
    setReplyTo(undefined);
  };
  
  const handleReplyTo = (message: Message) => {
    setReplyTo(message);
  }

  const handleEditClick = (message: Message) => {
      setEditingMessageId(message.id);
      setEditingText(message.text);
  }

  const handleCancelEdit = () => {
      setEditingMessageId(null);
      setEditingText('');
  }

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
        toast({ title: "Message updated" });
    } catch(error) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to update message." });
    } finally {
        setIsProcessing(false);
        handleCancelEdit();
    }
  }

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
        toast({ title: "Message deleted" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to delete message." });
    } finally {
        setIsProcessing(false);
        setDeletingMessage(null);
    }
  }

  const MessageBubble = ({msg}: {msg: Message}) => {
    const isSender = msg.senderId === currentUser?.uid;
    const messageTime = msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '';

    return (
        <div className={cn("flex items-start gap-3 w-full", isSender ? 'justify-end' : 'justify-start')}>
             {!isSender && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${msg.senderName.charAt(0)}`} alt={msg.senderName} />
                    <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
             )}
            <div className={cn("max-w-[75%]", isSender ? 'flex flex-col items-end' : 'flex flex-col items-start')}>
                 <div className="flex items-center gap-2 mb-1">
                     <p className={cn("text-xs", isSender && "text-right")}>{isSender ? "You" : msg.senderName}</p>
                     <p className="text-xs text-gray-500">{messageTime}</p>
                </div>
                <div
                    className={cn(
                      'rounded-lg p-3 text-sm shadow-sm relative w-fit',
                      isSender ? 'bg-gray-200 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
                    )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
            </div>
        </div>
    )
  }

  const DateSeparator = ({ date }: { date: Date }) => {
    let label;
    if (isToday(date)) {
        label = 'Today';
    } else if (isYesterday(date)) {
        label = 'Yesterday';
    } else {
        label = format(date, 'MMMM d, yyyy');
    }

    return (
        <div className="flex justify-center my-4">
            <span className="bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                {label}
            </span>
        </div>
    );
};

  return (
    <>
    <div className="flex h-full w-full flex-col bg-gray-100 dark:bg-gray-900">
      <header className="flex h-[60px] flex-shrink-0 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleContacts}>
            <Users className="h-5 w-5" />
            <span className="sr-only">Toggle Contacts</span>
        </Button>
        <Avatar className="h-10 w-10">
            <AvatarImage src={entity.avatar} alt={entity.name} />
            <AvatarFallback>{entity.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold flex-1">{entity.name}</h2>
      </header>

      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <div className="space-y-6 p-4 md:p-10">
          {messages.map((msg, index) => {
             const prevMessage = messages[index - 1];
             const showDateSeparator = msg.timestamp && (!prevMessage || !prevMessage.timestamp || format(prevMessage.timestamp.toDate(), 'yyyy-MM-dd') !== format(msg.timestamp.toDate(), 'yyyy-MM-dd'));
            return (
                <React.Fragment key={msg.id}>
                    {showDateSeparator && <DateSeparator date={msg.timestamp.toDate()} />}
                    <MessageBubble msg={msg} />
                </React.Fragment>
            )
          })}
        </div>
      </ScrollArea>

      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-4 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex-1">
          <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write your message..."
              className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg h-12 focus:ring-0 pr-12 w-full"
              disabled={editingMessageId !== null}
          />
          <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg">
              <Send className="h-5 w-5" />
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
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Delete
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
