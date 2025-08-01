// src/components/AIAssistant.tsx
'use client';

import {useState, useRef, useEffect, type FormEvent, type MouseEvent, type TouchEvent} from 'react';
import {Bot, User, Loader2, CornerDownLeft, Sparkles, Trash2, GripVertical} from 'lucide-react';
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
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const isChatPage = pathname === '/chat';
  const isMobile = useIsMobile();

  // Drag and drop state
  const [position, setPosition] = useState({ x: 24, y: isChatPage ? 96 : 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPosition(pos => ({ ...pos, y: isChatPage ? 96 : 24 }));
  }, [isChatPage]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const handleDragStart = (clientX: number, clientY: number) => {
    if (dragRef.current) {
        setIsDragging(true);
        offset.current = {
            x: clientX - dragRef.current.getBoundingClientRect().left,
            y: clientY - dragRef.current.getBoundingClientRect().top
        };
    }
  }
  
  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    handleDragStart(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e: TouchEvent<HTMLButtonElement>) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (isDragging && dragRef.current) {
        let newX = window.innerWidth - (clientX - offset.current.x + dragRef.current.offsetWidth);
        let newY = window.innerHeight - (clientY - offset.current.y + dragRef.current.offsetHeight);

        newX = Math.max(8, Math.min(newX, window.innerWidth - dragRef.current.offsetWidth - 8));
        newY = Math.max(8, Math.min(newY, window.innerHeight - dragRef.current.offsetHeight - 8));

        setPosition({ x: newX, y: newY });
    }
  };
  
  const handleMouseMove = (e: globalThis.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };
  
  const handleTouchMove = (e: globalThis.TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
   useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);


  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await faqChatbot({query: currentInput});
      const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', content: response.answer };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error with chatbot:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: "Sorry, I'm having trouble connecting. Please try again later.",
      });
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  }

  return (
    <div
      ref={dragRef}
      className="fixed z-50"
      style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
    >
      <Sheet>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button 
                  size="icon" 
                  className="h-14 w-14 rounded-full shadow-lg relative group/aibtn flex items-center justify-center"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                   <div 
                     className="absolute left-0 top-0 bottom-0 w-4 cursor-move flex items-center justify-center opacity-20 md:opacity-0 group-hover/aibtn:opacity-100 transition-opacity"
                   >
                    <GripVertical className="h-5 w-5 text-primary-foreground/50" />
                   </div>
                  <Bot className="h-7 w-7" />
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>AI Assistant (Draggable)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <SheetContent className={cn("flex w-full flex-col sm:max-w-lg", isMobile && "h-full")}>
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
              Answers FAQs related to campus facilities, policies, and procedures. Your chat history is not saved.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-hidden" ref={scrollAreaRef}>
            <div className="space-y-4 pr-4 py-4">
               {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    Ask me anything about campus life!
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
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
                ))
              )}
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
    </div>
  );
}
