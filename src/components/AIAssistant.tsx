// src/components/AIAssistant.tsx
'use client';

import {useState, useRef, useEffect, type FormEvent} from 'react';
import {Bot, User, Loader2, CornerDownLeft, Sparkles, Trash2} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {faqChatbot} from '@/ai/flows/faq-chatbot';
import {cn} from '@/lib/utils';
import {useToast} from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { Message, onAiChatHistory, addAiChatMessage, clearAiChatHistory } from '@/services/aiChat';
import { Unsubscribe } from 'firebase/firestore';

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const historyUnsubscribeRef = useRef<Unsubscribe | null>(null);


  useEffect(() => {
    if (user) {
      if (historyUnsubscribeRef.current) {
        historyUnsubscribeRef.current();
      }
      historyUnsubscribeRef.current = onAiChatHistory(user.uid, setMessages);
    }
    return () => {
      if (historyUnsubscribeRef.current) {
        historyUnsubscribeRef.current();
      }
    };
  }, [user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const currentInput = input;
    const userMessage: Message = { id: 'temp-user', role: 'user', content: currentInput };
    
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await faqChatbot({query: currentInput});
      const assistantMessageContent = response.answer;

      const userMessageToSave: Omit<Message, 'id'> = { role: 'user', content: currentInput };
      await addAiChatMessage(user.uid, userMessageToSave);
      
      const assistantMessageToSave: Omit<Message, 'id'> = { role: 'assistant', content: assistantMessageContent };
      await addAiChatMessage(user.uid, assistantMessageToSave);

    } catch (error) {
      console.error('Error with chatbot:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: "Sorry, I'm having trouble connecting. Please try again later.",
      });
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
      if (!user) return;
      try {
          await clearAiChatHistory(user.uid);
          setMessages([]);
          toast({
              title: "History Cleared",
              description: "Your chat history with the assistant has been deleted."
          })
      } catch (error) {
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not clear your chat history.'
          })
      }
  }

  return (
    <Sheet>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                <Bot className="h-7 w-7" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="text-accent" />
              AI-Powered Assistant
            </SheetTitle>
            {messages.length > 0 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handleClearHistory}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Clear History</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
          <SheetDescription>
            Answers FAQs related to campus facilities, policies, and procedures. Your chat history is saved.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 overflow-hidden" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4 py-4">
            {messages.filter(m => m.id !== 'temp-user').length === 0 && !isLoading && (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-muted-foreground">
                  Ask me anything about campus life!
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={message.id === 'temp-user' ? `temp-${index}`: message.id}
                className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : '')}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg p-3 text-sm shadow-sm',
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'
                  )}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages.filter(m => m.id !== 'temp-user').length > 0 && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[75%] rounded-lg bg-card p-3 text-sm shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter>
          <form onSubmit={handleSendMessage} className="relative w-full">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about library hours..."
              className="pr-12"
              disabled={isLoading || !user}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              disabled={isLoading || !input.trim() || !user}
              variant="ghost"
            >
              <CornerDownLeft className="h-4 w-4" />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
