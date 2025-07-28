// src/components/chat/Chat.tsx
'use client';

import {useState, useRef, useEffect} from 'react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Send} from 'lucide-react';
import {cn} from '@/lib/utils';

type ChatEntity = {id: string; name: string; avatar: string; dataAiHint: string};
type Message = {sender: string; text: string; time: string};

interface ChatProps {
  entity: ChatEntity;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export function Chat({entity, messages, onSendMessage}: ChatProps) {
  const [text, setText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(text);
    setText('');
  };

  return (
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
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn('flex items-end gap-3', msg.sender === 'You' ? 'justify-end' : 'justify-start')}
            >
              {msg.sender !== 'You' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[70%] rounded-lg p-3 text-sm shadow-sm',
                  msg.sender === 'You'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                )}
              >
                <p className="font-semibold">{msg.sender}</p>
                <p>{msg.text}</p>
                <p className="mt-1 text-xs opacity-70">{msg.time}</p>
              </div>
               {msg.sender === 'You' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your message..."
            className="pr-14"
          />
          <Button type="submit" size="icon" className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
