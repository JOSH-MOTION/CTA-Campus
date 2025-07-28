'use client';

import {useState, useRef, useEffect, type FormEvent} from 'react';
import {Bot, User, Loader2, CornerDownLeft, Sparkles} from 'lucide-react';
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    if (!input.trim()) return;

    const userMessage: Message = {role: 'user', content: input};
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await faqChatbot({query: input});
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error with chatbot:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: "Sorry, I'm having trouble connecting. Please try again later.",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

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
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            AI-Powered Assistant
          </SheetTitle>
          <SheetDescription>
            Answers FAQs related to campus facilities, policies, and procedures.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 overflow-hidden" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4 py-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-muted-foreground">
                  Ask me anything about campus life!
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
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
            {isLoading && (
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
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              disabled={isLoading || !input.trim()}
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
