// src/app/(app)/chat/page.tsx
'use client';

import {useState, useEffect, useMemo} from 'react';
import {useSearchParams} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Search, Send, User, Users, Loader2} from 'lucide-react';
import {Chat} from '@/components/chat/Chat';
import {useAuth, UserData} from '@/contexts/AuthContext';

const initialMessages: Record<string, Message[]> = {
  'group-Gen 30': [
    {sender: 'Alice Johnson', text: 'Hello everyone! Just a reminder about the group project deadline on Friday.', time: '9:00 AM'},
    {sender: 'Charlie Brown', text: 'Thanks for the reminder, Alice!', time: '9:05 AM'},
  ],
};

type ChatEntity = {id: string; name: string; avatar?: string; dataAiHint: string};
type Message = {sender: string; text: string; time: string};

export default function ChatPage() {
  const {fetchAllUsers, userData, role} = useAuth();
  const searchParams = useSearchParams();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedChat, setSelectedChat] = useState<ChatEntity | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);

  const directMessageUserId = searchParams.get('dm');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const users = await fetchAllUsers();
      setAllUsers(users);

      // If a user ID is passed in the URL, select that user for a direct message.
      if (directMessageUserId) {
        const userToDm = users.find(u => u.uid === directMessageUserId);
        if (userToDm) {
          setSelectedChat({
            id: userToDm.uid,
            name: userToDm.displayName,
            avatar: userToDm.photoURL,
            dataAiHint: 'user portrait',
          });
        }
      }

      setLoading(false);
    };
    loadUsers();
  }, [fetchAllUsers, directMessageUserId]);
  
  const allStudents = useMemo(() => allUsers.filter(u => u.role === 'student'), [allUsers]);

  const groupChats = useMemo(() => {
    const groups: ChatEntity[] = [];
    const allGens = new Set(allStudents.map(student => student.gen).filter(Boolean));

    if (role === 'teacher') {
      // Teachers see all group chats that exist based on student data.
      allGens.forEach(gen => {
        groups.push({
          id: `group-${gen}`,
          name: `${gen} Hub`,
          dataAiHint: 'group students',
        });
      });
    } else if (role === 'student' && userData?.gen) {
      // Students only see their own generation's group chat.
      groups.push({
        id: `group-${userData.gen}`,
        name: `${userData.gen} Hub`,
        dataAiHint: 'group students',
      });
    }

    // Sort groups alphabetically by name
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }, [role, userData, allStudents]);

  const handleSelectChat = (entity: ChatEntity) => {
    setSelectedChat(entity);
  };

  const handleSendMessage = (text: string) => {
    if (!selectedChat || !text.trim()) return;

    const newMessage: Message = {sender: 'You', text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})};

    setMessages(prev => {
      const existingMessages = prev[selectedChat.id] || [];
      return {
        ...prev,
        [selectedChat.id]: [...existingMessages, newMessage],
      };
    });
  };

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
        <Tabs defaultValue="dms" className="flex flex-1 flex-col overflow-hidden">
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
                  {allUsers.filter(u => u.uid !== userData?.uid).map(user => (
                    <Button
                      key={user.uid}
                      variant={selectedChat?.id === user.uid ? 'secondary' : 'ghost'}
                      className="h-auto w-full justify-start p-3"
                      onClick={() => handleSelectChat({id: user.uid, name: user.displayName, avatar: user.photoURL, dataAiHint: 'student portrait'})}
                    >
                      <Avatar className="mr-3 h-10 w-10">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {messages[user.uid]?.slice(-1)[0]?.text || 'No messages yet'}
                        </p>
                      </div>
                    </Button>
                  ))}
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
                  {groupChats.map(group => (
                    <Button
                      key={group.id}
                      variant={selectedChat?.id === group.id ? 'secondary' : 'ghost'}
                      className="h-auto w-full justify-start p-3"
                      onClick={() => handleSelectChat(group)}
                    >
                      <Avatar className="mr-3 h-10 w-10">
                        <AvatarFallback>G</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {messages[group.id]?.slice(-1)[0]?.text || 'No messages yet'}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="flex flex-col md:col-span-2 xl:col-span-3">
        {selectedChat ? (
          <Chat
            entity={selectedChat}
            messages={messages[selectedChat.id] || []}
            onSendMessage={handleSendMessage}
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
