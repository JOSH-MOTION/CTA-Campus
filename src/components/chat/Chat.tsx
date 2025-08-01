// src/components/chat/Chat.tsx
'use client';

import {useState, useRef, useEffect} from 'react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Send, Reply, Pin, X, Pencil, Trash2, Check, Loader2, Paperclip, Smile, Mic, Video, Phone, Search, CheckCheck, MoreVertical} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {Message} from '@/services/chat';
import {deleteMessage, updateMessage, getChatId} from '@/services/chat';
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
    const isEdited = msg.edited;
    const messageTime = msg.timestamp ? format(msg.timestamp.toDate(), 'p') : '';
    const readStatus = msg.read ? <CheckCheck className="h-4 w-4 text-sky-400" /> : <Check className="h-4 w-4" />;

    return (
        <div className={cn("flex items-end gap-3 group w-full", isSender ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                  'max-w-[65%] rounded-lg p-2 text-sm shadow-sm relative text-white',
                  isSender ? 'bg-[#005c4b]' : 'bg-[#202c33]'
                )}
              >
              {isSender && (
                  <div className="absolute top-0 -right-[8px] h-0 w-0 border-x-[8px] border-x-transparent border-t-[8px] border-t-[#005c4b]" />
              )}
               {!isSender && (
                  <div className="absolute top-0 -left-[8px] h-0 w-0 border-x-[8px] border-x-transparent border-t-[8px] border-t-[#202c33]" />
              )}

              {!isSender && entity.type === 'group' && (
                <p className="font-semibold text-xs text-primary mb-1">{msg.senderName}</p>
              )}

              {msg.replyTo && (
                  <div className="mb-2 rounded-md bg-black/20 p-2 border-l-2 border-primary">
                      <p className="font-bold text-xs">{msg.replyTo.senderName}</p>
                      <p className="text-xs truncate opacity-80">{msg.replyTo.text}</p>
                  </div>
              )}
              
              {editingMessageId === msg.id ? (
                  <div className="space-y-2 mt-2">
                      <Input 
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="bg-white/10 text-white h-9"
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSaveEdit()}
                      />
                      <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleSaveEdit} disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCancelEdit}>
                              <X className="h-4 w-4"/>
                          </Button>
                      </div>
                  </div>
              ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
               <div className="flex items-center justify-end gap-1 mt-1">
                 {isEdited && <p className="text-xs opacity-70">Edited</p>}
                 <p className="text-xs opacity-70">{messageTime}</p>
                 {isSender && readStatus}
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
            <span className="bg-[#111b21] text-gray-400 text-xs px-3 py-1 rounded-full">
                {label}
            </span>
        </div>
    );
};

  return (
    <>
    <div className="flex h-full flex-col bg-[#0b141a]">
      <header className="flex h-[60px] items-center gap-4 border-b border-white/10 bg-[#202c33] p-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={entity.avatar} alt={entity.name} data-ai-hint={entity.dataAiHint} />
          <AvatarFallback>{entity.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-medium text-gray-100 flex-1">{entity.name}</h2>
        <div className="flex items-center gap-2 text-gray-300">
            <Button variant="ghost" size="icon" className="hover:bg-white/10"><Video className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon" className="hover:bg-white/10"><Phone className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon" className="hover:bg-white/10"><Search className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon" className="hover:bg-white/10"><MoreVertical className="h-5 w-5"/></Button>
        </div>
      </header>

      <ScrollArea className="flex-1 bg-transparent" ref={scrollAreaRef}>
        <div className="space-y-2 p-4 md:p-10">
          {messages.map((msg, index) => {
             const prevMessage = messages[index - 1];
             const showDateSeparator = !prevMessage || format(prevMessage.timestamp.toDate(), 'yyyy-MM-dd') !== format(msg.timestamp.toDate(), 'yyyy-MM-dd');
            return (
                <React.Fragment key={msg.id}>
                    {showDateSeparator && <DateSeparator date={msg.timestamp.toDate()} />}
                    <MessageBubble msg={msg} />
                </React.Fragment>
            )
          })}
        </div>
      </ScrollArea>

      <footer className="bg-[#202c33] p-3">
        {replyTo && (
            <div className="mb-2 p-2 rounded-t-lg bg-[#2a3942] text-sm relative">
                <p className="text-primary text-xs font-semibold">Replying to {replyTo.senderName}</p>
                <p className="truncate text-gray-300">{replyTo.text}</p>
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-gray-300" onClick={() => setReplyTo(undefined)}>
                    <X className="h-4 w-4"/>
                </Button>
            </div>
        )}
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-white/10"><Smile className="h-6 w-6"/></Button>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-white/10"><Paperclip className="h-6 w-6"/></Button>
            <form onSubmit={handleSubmit} className="relative flex-1">
            <Input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message"
                className="bg-[#2a3942] border-none text-gray-200 rounded-lg h-12 focus:ring-0 pr-12"
                disabled={editingMessageId !== null}
            />
            </form>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-white/10">
                {text ? <Send className="h-6 w-6" onClick={handleSubmit} /> : <Mic className="h-6 w-6" />}
            </Button>
        </div>
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
