// src/app/(app)/chat/page.tsx
'use client';

import {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Search, Send, User, Users, Loader2} from 'lucide-react';
import {Chat} from '@/components/chat/Chat';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Message, getChatId, sendMessage, onMessages} from '@/services/chat';
import {Unsubscribe} from 'firebase/firestore';
import {useToast} from '@/hooks/use-toast';
import {Badge} from '@/components/ui/badge';

type ChatEntityType = 'dm' | 'group';
type ChatEntity = {id: string; name: string; type: ChatEntityType; avatar?: string; dataAiHint: string};

export default function ChatPage() {
  const {user: currentUser, fetchAllUsers, userData, role} = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {toast} = useToast();

  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedChat, setSelectedChat] = useState<ChatEntity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'dms' | 'groups'>('dms');
  const messageUnsubscribeRef = useRef<Unsubscribe | null>(null);

  const [unreadCounts, setUnreadCounts] = useState<{[chatId: string]: number}>({});
  const [allChatListeners, setAllChatListeners] = useState<Unsubscribe[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const users = await fetchAllUsers();
      setAllUsers(users);
      setLoading(false);
    };
    loadUsers();
  }, [fetchAllUsers]);

  const otherUsers = useMemo(() => allUsers.filter(u => u.uid !== currentUser?.uid), [allUsers, currentUser]);

  const groupChats = useMemo(() => {
    const groups: Omit<ChatEntity, 'type'>[] = [];
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

  const handleSelectChat = useCallback((entity: ChatEntity) => {
    setSelectedChat(entity);
    const newPath = entity.type === 'group' ? `/chat?group=${entity.id.replace('group-', '')}` : `/chat?dm=${entity.id}`;
    router.push(newPath, {scroll: false});
  }, [router]);

  useEffect(() => {
    if (loading || !currentUser) return;
    
    // Auto-select chat based on URL on initial load
    const directMessageUserId = searchParams.get('dm');
    const groupChatId = searchParams.get('group');

    if (groupChatId) {
        const groupToSelect = groupChats.find(g => g.id === `group-${groupChatId}`);
        if (groupToSelect && !selectedChat) {
          setSelectedChat({...groupToSelect, type: 'group'});
          setActiveTab('groups');
        }
      } else if (directMessageUserId) {
        const userToDm = allUsers.find(u => u.uid === directMessageUserId);
        if (userToDm && !selectedChat) {
            setSelectedChat({
              id: userToDm.uid,
              name: userToDm.displayName,
              type: 'dm',
              avatar: userToDm.photoURL,
              dataAiHint: 'user portrait',
            });
          setActiveTab('dms');
        }
      }
  }, [loading, allUsers, groupChats, currentUser, searchParams, selectedChat]);
  
  
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
      
      setMessages([]); // Clear previous messages
      setUnreadCounts(prev => ({...prev, [chatId]: 0}));
      
      const unsubscribe = onMessages(chatId, newMessages => {
        setMessages(newMessages);
      });
      messageUnsubscribeRef.current = unsubscribe;

      if(selectedChat.type === 'group') {
        setActiveTab('groups')
      } else {
        setActiveTab('dms')
      }

      return () => {
        if (messageUnsubscribeRef.current) {
          messageUnsubscribeRef.current();
        }
      };
    }, [selectedChat, currentUser]);


  const handleSendMessage = async (text: string, replyTo?: Message) => {
    if (!selectedChat || !text.trim() || !currentUser) return;

    let chatId: string;
    if (selectedChat.type === 'dm') {
      chatId = getChatId(currentUser.uid, selectedChat.id);
    } else {
      chatId = selectedChat.id;
    }

    let messagePayload: any = {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        text: text.trim(),
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
  
  const handleTabChange = (value: string) => {
      const newTab = value as 'dms' | 'groups';
      setActiveTab(newTab);
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
      <div className="flex flex-col border-r bg-card md:col-span-1 xl:col-span-1">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Campus Connect</h1>
          <p className="text-muted-foreground">Direct and group messages.</p>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search" className="pl-9" />
          </div>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="mx-4 grid w-auto grid-cols-2">
            <TabsTrigger value="dms">
              <User className="mr-2" /> DMs
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="mr-2" /> Groups
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="dms" className="m-0">
              {loading ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {otherUsers.map(user => {
                    const chatId = getChatId(currentUser!.uid, user.uid);
                    const unreadCount = unreadCounts[chatId] || 0;
                    return (
                        <Button
                        key={user.uid}
                        variant={selectedChat?.id === user.uid && selectedChat.type === 'dm' ? 'secondary' : 'ghost'}
                        className="h-auto w-full justify-start p-3 relative"
                        onClick={() => handleSelectChat({id: user.uid, name: user.displayName, type: 'dm', avatar: user.photoURL, dataAiHint: 'student portrait'})}
                        >
                        <Avatar className="mr-3 h-10 w-10">
                            <AvatarImage src={user.photoURL} alt={user.displayName} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className="font-semibold">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                        </div>
                        {unreadCount > 0 && (
                            <Badge className="absolute right-3 top-1/2 -translate-y-1/2">{unreadCount}</Badge>
                        )}
                        </Button>
                    )
                  })}
                </div>
              )}
            </TabsContent>
            <TabsContent value="groups" className="m-0">
              {loading ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {groupChats.map(group => {
                     const unreadCount = unreadCounts[group.id] || 0;
                     return (
                        <Button
                        key={group.id}
                        variant={selectedChat?.id === group.id ? 'secondary' : 'ghost'}
                        className="h-auto w-full justify-start p-3 relative"
                        onClick={() => handleSelectChat({...group, type: 'group'})}
                        >
                        <Avatar className="mr-3 h-10 w-10">
                            <AvatarFallback>G</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className="font-semibold">{group.name}</p>
                        </div>
                         {unreadCount > 0 && (
                            <Badge className="absolute right-3 top-1/2 -translate-y-1/2">{unreadCount}</Badge>
                        )}
                        </Button>
                     )
                  })}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="flex flex-col md:col-span-2 xl:col-span-3">
        {selectedChat ? (
          <Chat
            key={selectedChat.id}
            entity={selectedChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={currentUser}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-background">
            <p className="text-muted-foreground">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
