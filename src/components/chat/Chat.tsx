// src/components/chat/Chat.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { UserData } from '@/contexts/AuthContext';

interface ChatProps {
    entity: { id: string; name: string; type: 'dm' | 'group'; avatar?: string, dataAiHint: string };
    messages: Message[];
    onSendMessage: (text: string, replyTo?: Message) => void;
    currentUser: User | null;
    onToggleContacts: () => void;
    loading: boolean;
    allUsers: UserData[];
}

const DateSeparator = ({ date }: { date: Date }) => {
  const formattedDate = isToday(date)
    ? 'Today'
    : isYesterday(date)
    ? 'Yesterday'
    : format(date, 'MMMM d, yyyy');

  return (
    <div className="text-center text-xs text-gray-500 my-4">
      <span className="bg-gray-100 dark:bg-gray-900 px-2 rounded-full">{formattedDate}</span>
    </div>
  );
};


const MessageBubble = ({
    msg,
    currentUser,
    onReply,
    onPin,
    onEdit,
    onDelete,
    allUsers
  }: {
    msg: Message;
    currentUser: User | null;
    onReply: (message: Message) => void;
    onPin: (message: Message) => void;
    onEdit: (message: Message) => void;
    onDelete: (message: Message) => void;
    allUsers: UserData[];
  }) => {
    const isCurrentUser = msg.senderId === currentUser?.uid;
    const sender = allUsers.find(u => u.uid === msg.senderId);

    return (
        <div className={cn("group flex w-full items-start gap-3", isCurrentUser && "justify-end")}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={sender?.photoURL} alt={sender?.displayName} />
                    <AvatarFallback>{sender?.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn("max-w-[70%]", isCurrentUser && "order-1")}>
                <div
                className={cn(
                    "relative rounded-lg px-3 py-2 shadow-sm",
                    isCurrentUser ? "bg-primary text-primary-foreground" : "bg-white dark:bg-gray-800"
                )}
                >
                {!isCurrentUser && <p className="text-xs font-semibold mb-1">{msg.senderName}</p>}
                {msg.replyTo && (
                    <div className="mb-1 border-l-2 border-primary/50 pl-2 text-xs opacity-80">
                        <p className="font-semibold">{msg.replyTo.senderName}</p>
                        <p className="truncate">"{msg.replyTo.text}"</p>
                    </div>
                )}
                <p className="text-sm break-words">{msg.text}</p>
                <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                    <span>{format(msg.timestamp.toDate(), 'HH:mm')}</span>
                    {msg.edited && <span>(edited)</span>}
                </div>
                </div>
            </div>
            <div className={cn(
                "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", 
                isCurrentUser ? "order-2" : "order-3"
            )}>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReply(msg)}><Reply className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPin(msg)}><Pin className="h-4 w-4" /></Button>
                {isCurrentUser && (
                    <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(msg)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(msg)}><Trash2 className="h-4 w-4" /></Button>
                    </>
                )}
            </div>
            {isCurrentUser && (
                 <Avatar className="h-8 w-8 order-4">
                    <AvatarImage src={sender?.photoURL} alt={sender?.displayName} />
                    <AvatarFallback>{sender?.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}

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
      <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
        {/* Header - Fixed */}
        <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
          <Button variant="ghost" size="icon" onClick={onToggleContacts} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleContacts} className="hidden md:flex">
            <Users className="h-5 w-5" />
            <span className="sr-only">Toggle Contacts</span>
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={entity.avatar} alt={entity.name} />
            <AvatarFallback>{entity.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="flex-1 text-lg font-semibold">{entity.name}</h2>
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
        </header>

        {/* Pinned Message - Fixed */}
        {pinnedMessage && (
          <div className="shrink-0 border-b border-primary/20 bg-primary/5 p-3">
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

        {/* Messages Area - Scrollable */}
        <div className="flex-1 min-h-0 relative">
          <ScrollArea 
            className="absolute inset-0" // Make ScrollArea fill the container
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            <div className="space-y-1 p-4 md:p-6 pb-4"> {/* Add bottom padding to prevent overlap with footer */}
              {messageList}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area - Fixed at Bottom */}
        <footer className="shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sticky bottom-0 z-10">
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
            <>
              {replyTo && (
                <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Replying to {replyTo.senderName}</p>
                    <p className="italic truncate">"{replyTo.text}"</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setReplyTo(undefined)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="relative flex-1">
                <Input
                  value={text || ''}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your message..."
                  className="h-12 w-full rounded-lg border-none bg-gray-100 pr-12 focus:ring-0 dark:bg-gray-800"
                  disabled={editingMessageId !== null}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </>
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
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
