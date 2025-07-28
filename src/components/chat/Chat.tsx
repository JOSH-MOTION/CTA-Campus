// src/components/chat/Chat.tsx
'use client';

import {useState, useRef, useEffect} from 'react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Send, Reply, Pin, X, Pencil, Trash2, Check, Loader2} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {Message} from '@/services/chat';
import {deleteMessage, updateMessage} from '@/services/chat';
import type {User} from 'firebase/auth';
import {format} from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type ChatEntity = {id: string; name: string; avatar?: string; dataAiHint: string; type: 'dm' | 'group'};

interface ChatProps {
  entity: ChatEntity;
  messages: Message[];
  onSendMessage: (text: string, replyTo?: Message) => void;
  currentUser: User | null;
}

export function Chat({entity, messages, onSendMessage, currentUser}: ChatProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | undefined>(undefined);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
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
        chatId = entity.id;
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
        chatId = entity.id;
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


  return (
    <>
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b bg-card p-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={entity.avatar} alt={entity.name} data-ai-hint={entity.dataAiHint} />
          <AvatarFallback>{entity.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold">{entity.name}</h2>
      </header>

      <ScrollArea className="flex-1 bg-background/50" ref={scrollAreaRef}>
        <div className="space-y-6 p-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn('flex items-end gap-3 group', msg.senderId === currentUser?.uid ? 'flex-row-reverse' : 'flex-row')}
            >
              {msg.senderId !== currentUser?.uid && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[70%] rounded-lg p-3 text-sm shadow-sm relative',
                  msg.senderId === currentUser?.uid
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                )}
              >
                <div className={cn("absolute top-1/2 -translate-y-1/2 flex bg-background border rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity",  msg.senderId === currentUser?.uid ? '-left-28' : '-right-28')}>
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReplyTo(msg)}>
                       <Reply className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7">
                       <Pin className="h-4 w-4" />
                   </Button>
                   {msg.senderId === currentUser?.uid && (
                       <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(msg)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeletingMessage(msg)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                       </>
                   )}
                </div>

                {msg.replyTo && (
                    <div className="mb-2 rounded-md bg-black/10 p-2">
                        <p className="font-bold text-xs">{msg.replyTo.senderName}</p>
                        <p className="text-xs truncate">{msg.replyTo.text}</p>
                    </div>
                )}
                
                <p className="font-semibold">{msg.senderName}</p>
                {editingMessageId === msg.id ? (
                    <div className="space-y-2 mt-2">
                        <Input 
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="bg-background text-foreground h-9"
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSaveEdit()}
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                                Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                <X className="h-4 w-4"/>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p>{msg.text}</p>
                )}
                <p className="mt-1 text-xs opacity-70">
                   {msg.timestamp ? format(msg.timestamp.toDate(), 'p') : '...'}
                </p>
              </div>
               {msg.senderId === currentUser?.uid && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{currentUser?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="border-t bg-card p-4">
        {replyTo && (
            <div className="mb-2 p-2 rounded-md bg-muted text-sm relative">
                <p className="text-muted-foreground text-xs">Replying to <span className="font-semibold">{replyTo.senderName}</span></p>
                <p className="truncate">{replyTo.text}</p>
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setReplyTo(undefined)}>
                    <X className="h-4 w-4"/>
                </Button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your message..."
            className="pr-14"
            disabled={editingMessageId !== null}
          />
          <Button type="submit" size="icon" className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2" disabled={!text.trim() || editingMessageId !== null}>
            <Send className="h-4 w-4" />
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
