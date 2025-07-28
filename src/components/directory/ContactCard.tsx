
'use client';

import {useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Mail, Phone, Building, MessageSquareQuote, Loader2, ServerCrash, Bot, CalendarPlus} from 'lucide-react';
import {suggestContactMethod} from '@/ai/flows/suggested-contact-method';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Alert, AlertDescription, AlertTitle} from '../ui/alert';
import Link from 'next/link';
import {useAuth} from '@/contexts/AuthContext';


export interface Contact {
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  office: string;
  avatar: string;
  dataAiHint: string;
  availability: string;
  preferences: string;
}

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({contact}: ContactCardProps) {
  const {role} = useAuth();
  const [suggestion, setSuggestion] = useState<{contactMethod: string; reason: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getSuggestion = async () => {
    setIsLoading(true);
    setError('');
    setSuggestion(null);
    try {
      const result = await suggestContactMethod({
        personName: contact.name,
        availability: contact.availability,
        preferences: contact.preferences,
        urgency: 'Moderate - need a response within a day or two.',
      });
      setSuggestion(result);
    } catch (e) {
      console.error(e);
      setError('Could not get a suggestion at this time.');
    }
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      getSuggestion();
    }
  };

  return (
    <Card className="flex flex-col shadow-sm transition-all hover:shadow-md">
      <CardHeader className="items-center text-center">
        <Avatar className="h-24 w-24 border-2 border-primary/20">
          <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint={contact.dataAiHint} />
          <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="pt-4">
          <CardTitle>{contact.name}</CardTitle>
          <CardDescription>{contact.role}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 shrink-0" />
          <a href={`mailto:${contact.email}`} className="truncate hover:underline">
            {contact.email}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 shrink-0" />
          <span>{contact.phone}</span>
        </div>
        <div className="flex items-center gap-3">
          <Building className="h-4 w-4 shrink-0" />
          <span>{contact.office}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
         {role === 'student' && contact.name !== 'Library Front Desk' && (
           <Button className="w-full" asChild>
             <Link href="/book-session">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book a Session
            </Link>
          </Button>
        )}
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <MessageSquareQuote className="mr-2 h-4 w-4" />
              How to contact?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suggested Contact Method</DialogTitle>
              <DialogDescription>AI-powered suggestion for contacting {contact.name}.</DialogDescription>
            </DialogHeader>
            <div className="min-h-[150px] py-4">
              {isLoading && (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyzing...</p>
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <ServerCrash className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {suggestion && (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-accent/20 p-4 text-center">
                    <h3 className="font-semibold text-lg text-accent-foreground">{suggestion.contactMethod}</h3>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 shrink-0 mt-1" />
                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
