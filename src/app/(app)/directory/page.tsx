import {ContactCard} from '@/components/directory/ContactCard';
import {Input} from '@/components/ui/input';

const contacts = [
  {
    name: 'Dr. Evelyn Reed',
    role: 'Professor, Head of Computer Science',
    department: 'Computer Science',
    email: 'e.reed@university.edu',
    phone: '555-123-4567',
    office: 'Tech Building, Room 404',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman professor',
    availability:
      'Available for meetings on Tuesdays and Thursdays from 2 PM to 4 PM. Generally responsive to emails within 24 hours on weekdays.',
    preferences: 'Email is the preferred method for initial contact. For urgent matters, please contact the department secretary.',
  },
  {
    name: 'John Carter',
    role: 'Student Services Advisor',
    department: 'Student Affairs',
    email: 'j.carter@university.edu',
    phone: '555-987-6543',
    office: 'Admin Building, Room 101',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'man advisor',
    availability: 'Office hours are Monday-Friday, 9 AM to 5 PM. Drop-ins are welcome, but appointments are recommended.',
    preferences: 'Prefers appointments to be scheduled via the online portal. Quick questions can be sent via email.',
  },
  {
    name: 'Library Front Desk',
    role: 'General Inquiries',
    department: 'University Library',
    email: 'library@university.edu',
    phone: '555-555-5555',
    office: 'Library, Main Floor',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'library desk',
    availability: 'Staffed 24/7 during the semester. Response times for email may vary.',
    preferences: 'For immediate assistance, calling the front desk or visiting in person is best. Emails are suitable for non-urgent requests.',
  },
  {
    name: 'Dr. Alan Grant',
    role: 'Professor',
    department: 'Paleontology',
    email: 'a.grant@university.edu',
    phone: '555-246-8135',
    office: 'Geology Building, Room 218',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'male professor',
    availability:
      'Often in the field. Best to check his updated office door schedule. Rarely checks email on weekends.',
    preferences: 'Prefers email for all communication. Avoid phone calls unless it is a true emergency related to a dig site.',
  },
];

export default function DirectoryPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
        <p className="text-muted-foreground">Find contact information for faculty and departments.</p>
      </div>

      <div className="relative">
        <Input placeholder="Search for name, department..." className="w-full" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map(contact => (
          <ContactCard key={contact.name} contact={contact} />
        ))}
      </div>
    </div>
  );
}
