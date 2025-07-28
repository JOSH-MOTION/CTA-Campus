import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {CheckCircle} from 'lucide-react';

const roadmapData = [
  {
    title: 'HTML',
    duration: '2 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          'Basic html structure',
          'Html elements',
          'Html attributes',
          'Content (p, link, img, headings, lists)',
          'Comments',
        ],
      },
      {
        title: 'Week 2',
        topics: ['Tables', 'Classes and id', 'Div/section', 'Forms'],
      },
    ],
  },
  {
    title: 'CSS',
    duration: '2 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          'Css syntax',
          'Selectors (element, id, class, combination)',
          'Css properties (color, width, height, background, border, margin, padding, fonts, display)',
        ],
      },
      {title: 'Week 2', topics: ['Box model', 'Float', 'Flexbox']},
    ],
  },
  {
    title: 'Tailwind',
    duration: '4 weeks',
    weeks: [
      {title: 'Week 1', topics: ['Responsive design', 'Grid system']},
      {title: 'Week 2', topics: ['Components']},
      {
        title: 'Week 3',
        topics: ['Calculator project (in class)', 'Horizons website (homework)'],
      },
      {
        title: 'Week 4',
        topics: ['Shopping Cart (in class)', 'Kawolegal (homework)'],
      },
    ],
  },
  {
    title: 'Git',
    duration: '2 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: ['Installing git', 'Initialize git in repo', 'Staging', 'Committing'],
      },
      {title: 'Week 2', topics: ['Pushing', 'Branching', 'Pulling']},
    ],
  },
  {
    title: 'JS',
    duration: '5 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          'Output (console.log, document.write)',
          'Variables (var, let, const)',
          'Data types (string, float, int, bool)',
          'Arithmetic operators (+, -, x, %)',
          'Comparisons (==, ===, !=, !==, >, <, >=, <=)',
          'Logical operators (AND, OR, NOT, ||, &&)',
        ],
      },
      {
        title: 'Week 2',
        topics: ['Arrays', 'Conditionals (if, else, else if, switch)', 'Loops (for, while, map)'],
      },
      {
        title: 'Week 3',
        topics: ['Functions(plain old functions, Arrow functions)', 'Objects'],
      },
      {title: 'Week 4', topics: ['OOP', 'Scope (this keyword)']},
      {
        title: 'Week 5',
        topics: ['JS Q&A, JS overview', 'JS simple algorithms', 'DOM manipulation'],
      },
    ],
  },
  {
    title: 'Data Structures and Algorithms',
    duration: '3 weeks',
    weeks: [
      {
        title: 'Data structures in JS',
        topics: ['Arrays(stack,queue)', 'Push, Pop, slice, splice', 'objects, classes'],
      },
      {
        title: 'Algorithms',
        topics: [
          'Big O notation',
          'Sort algorithms(bubble sort / quick sort)(intermediate)',
          'Search algorithms(linear search,/ binary search)(intermediate)',
          'List of even/odd/prime numbers (basic)',
          'Sum of even/odd/prime numbers(basic)',
          'Search and replace (intermediate)',
        ],
      },
    ],
  },
  {
    title: 'React',
    duration: '12 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          'Overview of React and SPAs',
          'Installing package managers (NPM, Yarn)',
          'Create React App (CRA)',
        ],
      },
      {
        title: 'Week 2',
        topics: [
          'Js import/export',
          'How react server works (yarn start / npm start)',
          'JSX',
          'Styling in React (inline, external)',
          'Components (and Destructuring)',
          'Props',
        ],
      },
      {
        title: 'Week 3',
        topics: [
          'Breaking content into components, how to link bootstrap (using the Pizza website)',
          'Passing props to replace hard coded text and content',
        ],
      },
      {
        title: 'Week 4',
        topics: [
          'Events (onClick, onChange)',
          'State (and spread operator) - counter example using both class and function components.',
          'Forms ( simple form with multiple inputs to collect data into the state. On submit, we log the values in the state to confirm that form works)',
        ],
      },
      {
        title: 'Week 5',
        topics: ['CRUD Project 1 (create, retrieve) - add users/see users project'],
      },
      {
        title: 'Week 6',
        topics: ['CRUD Project 2 (update, delete) - update users/delete users'],
      },
      {
        title: 'Week 7',
        topics: ['Routing (react router, links, routes, route params)', 'Kawolegal website project (assignment)'],
      },
      {
        title: 'Week 8',
        topics: ['Making API requests (in functional components using fetch or axios)'],
      },
      {
        title: 'Week 9',
        topics: ['Redux intro (flux architecture, setup - store, reducers, actions )'],
      },
      {
        title: 'Week 10',
        topics: [
          'Redux (connect to components, mapStateToProps, MapDispatchToProps - create and retrieve) - Bank account project (assignment)',
        ],
      },
      {
        title: 'Week 11',
        topics: ['Redux (edit and delete) - continue Bank account management project (assignment)'],
      },
      {
        title: 'Week 12',
        topics: ['React Project(CRUD application with redux - Notes project)'],
      },
    ],
  },
  {
    title: 'Firebase',
    duration: '3 weeks',
    weeks: [
      {
        title: 'Week 1-3',
        topics: ['Firebase connection', 'Firebase database / cloud firestore (CRUD)', 'Firebase authentication'],
      },
    ],
  },
  {
    title: 'React Native',
    duration: '8 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          'Setup React Native (install expo cli)',
          'Basic Components (Text, View)',
          'React Native Styles (Stylesheet.Create, flexbox)',
          'Available Core Library Components (Image, ImageBackground, Modal)',
        ],
      },
      {
        title: 'Week 2',
        topics: [
          'Forms and Buttons (TextInput, TouchableOpacity, KeyboardAvoidingView, SafeAreaView, Validation)',
          'Displaying List (FlatList, ScrollView)',
        ],
      },
      {title: 'Week 3', topics: ['Onboarding project exercise', 'Ecommerce app assignment']},
      {
        title: 'Week 4',
        topics: ['Routing with React Navigation (Stack)', 'React native blog app'],
      },
      {
        title: 'Week 5',
        topics: ['Ampersand contact app first 4 screens as exercise', 'Ampersand contact app last 4 screens as assignment'],
      },
      {
        title: 'Week 6',
        topics: [
          'Redux',
          'Firebase',
          'Authentication',
          'Add authentication to form and list project from week 2',
          'React Native Project (Ampersand project) - add authentication as assignment',
        ],
      },
      {title: 'Week 7', topics: ['How react native works under the hood', 'Wrap up']},
    ],
  },
  {
    title: 'Backend - NodeJS',
    duration: '9 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          'Setup a basic node server with http package',
          'Learn request-response cycle and objects',
          'Headers - content-type, accept,',
          'body,',
          'Methods - post, get, put, patch,',
          'Url',
          'Status codes - 200, 404, 500',
          'Implement routing on the request objects url',
          'Sending responses',
        ],
      },
      {
        title: 'Week 2',
        topics: [
          'Npm and package.json',
          'Setup node server with express',
          'Routing with app.use(), app.get(), app.post()',
          'Implement response.send()',
        ],
      },
      {
        title: 'Week 3',
        topics: [
          'Middlewares - the next() method',
          'General middlewares',
          'Route middlewares',
          'Serving static files - express.static middleware',
          'Parsing request objects - body-parser middleware',
        ],
      },
      {
        title: 'Week 4',
        topics: ['Postman', 'REST architecture', 'Getting organized - controllers, routes, models'],
      },
      {title: 'Week 5', topics: ['Databases - SQL and NoSQL', 'Setting up Mongodb']},
      {
        title: 'Week 6',
        topics: [
          'Mongoose core - schema, models, queries',
          'Setup mongoose for node',
          'Mongoose models',
          'Create and Retrieve data with mongoose',
        ],
      },
      {
        title: 'Week 7',
        topics: ['Update and Delete data with mongoose', 'Relationships in mongoose', 'Fetching relational data', 'Delete relational data'],
      },
      {title: 'Week 8', topics: ['validation - express validator?']},
      {
        title: 'Week 9',
        topics: ['Authentication', 'Sign up', 'Sign in', 'Tokens and authorizations', 'Jwt - sign , verify , decode', 'Route protection'],
      },
    ],
  },
  {
    title: 'Final Project',
    duration: '4 weeks',
    weeks: [],
  },
];

export default function RoadmapPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Academic Roadmap</h1>
        <p className="text-muted-foreground">
          The full curriculum from start to finish.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {roadmapData.map((topic, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="rounded-lg border bg-card px-4 shadow-sm"
          >
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-4">
                <span>{topic.title}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({topic.duration})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {topic.weeks.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {topic.weeks.map((week, weekIndex) => (
                    <Card key={weekIndex}>
                      <CardHeader>
                        <CardTitle className="text-base">{week.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {week.topics.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-2">
                              <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                              <span className="text-sm text-muted-foreground">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  Details for the final project will be provided later in the
                  course.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
