// src/app/(app)/chat/page.tsx
'use client';

import {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Search, Users, Loader2, MessageSquare, Hash} from 'lucide-react';
import {Chat} from '@/components/chat/Chat';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Message, getChatId, sendMessage, onMessages} from '@/services/chat';
import {Unsubscribe} from 'firebase/firestore';
import {useToast} from '@/hooks/use-toast';
import {useNotifications} from '@/contexts/NotificationsContext';
import {ScrollArea} from '@/components/ui/scroll-area';
import {cn} from '@/lib/utils';
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { School } from 'lucide-react';


type ChatEntityType = 'dm' | 'group';
type ChatEntity = {id: string; name: string; type: ChatEntityType; avatar?: string; dataAiHint: string, lastMessage?: string; status?: string; unreadCount?: number };

export default function ChatPage() {
  const {user: currentUser, fetchAllUsers, userData, role} = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {toast} = useToast();
  
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  
  const [selectedChat, setSelectedChat] = useState<ChatEntity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messageUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const [isContactListOpen, setIsContactListOpen] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
        setLoading(true);
        const users = await fetchAllUsers();
        setAllUsers(users);
        setLoading(false);
    }
    loadUsers();
  }, [fetchAllUsers]);

  const otherUsers = useMemo(() => {
    if (!currentUser || !role) return [];

    if (role === 'student') {
      const studentGen = userData?.gen;
      return allUsers.filter(u => {
        if (u.uid === currentUser.uid) return false;
        if (u.role === 'teacher' || u.role === 'admin') return true;
        if (u.role === 'student' && u.gen === studentGen) return true;
        return false;
      });
    }

    return allUsers.filter(u => u.uid !== currentUser.uid);
  }, [allUsers, currentUser, role, userData?.gen]);

  const groupChats = useMemo(() => {
    const groups: Omit<ChatEntity, 'type' | 'lastMessage' | 'unreadCount' | 'status'>[] = [];
    if (role === 'teacher' || role === 'admin') {
      const allStudents = allUsers.filter(u => u.role === 'student');
      const allGens = new Set(allStudents.map(student => student.gen).filter(Boolean));
      allGens.forEach(gen => {
        groups.push({id: `group-${gen}`, name: `${gen} Hub`, dataAiHint: 'group students'});
      });
    } else if (role === 'student' && userData?.gen) {
      groups.push({
        id: `group-${userData.gen}`,
        name: `${userData.gen} Hub`,
        dataAiHint: 'group students',
      });
    }
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }, [role, userData, allUsers]);

  const markChatAsRead = useCallback((chatId: string) => {
    localStorage.setItem(`lastSeen_${chatId}`, Date.now().toString());
  }, []);

  const handleSelectChat = useCallback((entity: ChatEntity) => {
    const newPath = entity.type === 'group' ? `/chat?group=${entity.id.replace('group-', '')}` : `/chat?dm=${entity.id}`;
    router.push(newPath, {scroll: false});
    setIsContactListOpen(false); // Close drawer on selection
  }, [router]);


  useEffect(() => {
    if (loading || !currentUser) return;
  
    const directMessageUserId = searchParams.get('dm');
    const groupChatId = searchParams.get('group');
  
    let targetEntity: ChatEntity | null = null;
  
    if (groupChatId) {
      const groupToSelect = groupChats.find(g => g.id === `group-${groupChatId}`);
      if (groupToSelect) {
        targetEntity = { ...groupToSelect, type: 'group' };
      }
    } else if (directMessageUserId) {
      const userToDm = allUsers.find(u => u.uid === directMessageUserId);
      if (userToDm) {
        targetEntity = {
          id: userToDm.uid,
          name: userToDm.displayName,
          type: 'dm',
          avatar: userToDm.photoURL,
          dataAiHint: 'user portrait',
        };
      }
    }
    
    setSelectedChat(targetEntity);

  }, [loading, currentUser, allUsers, groupChats, searchParams]);
  

  useEffect(() => {
      if (!selectedChat || !currentUser) return;

      if (messageUnsubscribeRef.current) {
        messageUnsubscribeRef.current();
      }

      let chatId: string;
      if (selectedChat.type === 'dm') {
        chatId = getChatId(currentUser.uid, selectedChat.id);
      } else {
        chatId = selectedChat.id;
      }
      
      setMessages([]);
      markChatAsRead(chatId);
      
      const unsubscribe = onMessages(chatId, newMessages => {
        setMessages(newMessages);
      });
      messageUnsubscribeRef.current = unsubscribe;

      return () => {
        if (messageUnsubscribeRef.current) {
          messageUnsubscribeRef.current();
        }
      };
    }, [selectedChat, currentUser, markChatAsRead]);

    const handleSendMessage = async (text: string, replyTo?: Message) => {
        if (!selectedChat || !text.trim() || !currentUser) return;
    
        let chatId: string;
    
        if (selectedChat.type === 'group') {
          chatId = selectedChat.id;
        } else {
          chatId = getChatId(currentUser.uid, selectedChat.id);
        }
    
        const messagePayload: any = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'User',
            text: text.trim(),
            read: false,
        };
    
        if (replyTo) {
            messagePayload.replyTo = {
                messageId: replyTo.id,
                text: replyTo.text,
                senderName: replyTo.senderName,
            };
        }
        
        await sendMessage(chatId, messagePayload);
      };

  const ContactList = () => (
    <div className="flex flex-col h-full bg-background border-r">
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <School className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Campus Connect</h1>
            </div>
          </div>
        </div>
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search people, files, messages..." className="bg-muted border-none pl-10 rounded-md" />
          </div>
        </div>
        <ScrollArea className="flex-1">
            <div className="flex flex-col p-2">
                {loading ? (
                    <div className="flex justify-center items-center p-4"> <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> </div>
                ) : (
                    <>
                    <div className="px-2 py-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase">Group Channels</h3>
                    </div>
                    {groupChats.map(chatItem => (
                        <button
                            key={chatItem.id}
                            className={cn(
                                "w-full text-left p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-3",
                                selectedChat?.id === chatItem.id && "bg-primary/10"
                            )}
                            onClick={() => handleSelectChat({...chatItem, type: 'group'})}
                        >
                           <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted text-muted-foreground">
                             <Hash className="h-4 w-4" />
                           </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm">{chatItem.name}</p>
                                    {chatItem.unreadCount && chatItem.unreadCount > 0 && <Badge className="h-5">{chatItem.unreadCount}</Badge>}
                                </div>
                            </div>
                        </button>
                    ))}
                     <div className="px-2 py-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase">Direct Messages</h3>
                    </div>
                    {otherUsers.map(chatItem => (
                        <button
                            key={chatItem.uid}
                            className={cn(
                                "w-full text-left p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-3",
                                selectedChat?.id === chatItem.uid && "bg-primary/10"
                            )}
                            onClick={() => handleSelectChat({id: chatItem.uid, name: chatItem.displayName, type: 'dm', avatar: chatItem.photoURL, dataAiHint: 'student portrait'})}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={chatItem.photoURL} alt={chatItem.displayName} data-ai-hint={'student portrait'} />
                                <AvatarFallback>{chatItem.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm">{chatItem.displayName}</p>
                                    {/* Placeholder for unread count */}
                                    {/* <Badge className="h-5">1</Badge> */}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {/* Placeholder for last message */}
                                    Hey, can we talk...
                                </p>
                            </div>
                        </button>
                    ))}
                    </>
                )}
            </div>
        </ScrollArea>
        <div className="p-3 border-t shrink-0">
          <div className="flex items-center gap-3">
             <Avatar className="h-9 w-9">
                <AvatarImage src={currentUser?.photoURL || ''} alt={currentUser?.displayName || ''} />
                <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold text-sm">{currentUser?.displayName}</p>
                <p className="text-xs text-green-500">Available</p>
            </div>
          </div>
        </div>
    </div>
  );

  return (
    <div className="h-full w-full flex overflow-hidden">
      {/* Mobile Drawer */}
        <Sheet open={isContactListOpen} onOpenChange={setIsContactListOpen}>
            <SheetContent side="left" className="p-0 w-[300px] border-r-0">
                <ContactList />
            </SheetContent>
        </Sheet>
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block md:w-[300px] lg:w-[350px] shrink-0">
            <ContactList />
        </div>

        <div className="flex-1 flex flex-col">
            {selectedChat ? (
                <Chat
                    key={selectedChat.id}
                    entity={selectedChat}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    currentUser={currentUser}
                    onToggleContacts={() => setIsContactListOpen(prev => !prev)}
                    allUsers={allUsers}
                />
                ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                        <div className="text-center text-muted-foreground">
                             <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold">Select a chat to start messaging</h2>
                            <p className="mt-1">Your conversations will appear here.</p>
                            <Button onClick={() => setIsContactListOpen(true)} className="mt-4 md:hidden">
                                <Users className="mr-2 h-4 w-4" />
                                Open Contacts
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}
