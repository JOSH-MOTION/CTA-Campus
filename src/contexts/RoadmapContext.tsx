// src/contexts/RoadmapContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect} from 'react';
import { useAuth } from './AuthContext';
import { onRoadmapStatus, setWeekCompletion, WeekCompletionStatus } from '@/services/roadmap';

// The structure for a single topic, including its unique ID
export interface Topic {
  id: string;
  title: string;
}

// The structure for a week, containing multiple topics
export interface Week {
  title: string;
  topics: Topic[];
}

// The structure for a main subject area in the roadmap
export interface RoadmapSubject {
  title: string;
  duration: string;
  weeks: Week[];
}

interface RoadmapContextType {
  completedWeeks: Set<string>;
  toggleWeekCompletion: (weekId: string, currentStatus: boolean) => void;
  roadmapData: RoadmapSubject[];
  loading: boolean;
}

const roadmapData: RoadmapSubject[] = [
  {
    title: 'HTML',
    duration: '2 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          {id: 'html-1-1', title: 'Basic html structure'},
          {id: 'html-1-2', title: 'Html elements'},
          {id: 'html-1-3', title: 'Html attributes'},
          {id: 'html-1-4', title: 'Content (p, link, img, headings, lists)'},
          {id: 'html-1-5', title: 'Comments'},
        ],
      },
      {
        title: 'Week 2',
        topics: [
            {id: 'html-2-1', title: 'Tables'}, 
            {id: 'html-2-2', title: 'Classes and id'}, 
            {id: 'html-2-3', title: 'Div/section'}, 
            {id: 'html-2-4', title: 'Forms'}
        ],
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
          {id: 'css-1-1', title: 'Css syntax'},
          {id: 'css-1-2', title: 'Selectors (element, id, class, combination)'},
          {id: 'css-1-3', title: 'Css properties (color, width, height, background, border, margin, padding, fonts, display)'},
        ],
      },
      {title: 'Week 2', topics: [
          {id: 'css-2-1', title: 'Box model'}, 
          {id: 'css-2-2', title: 'Float'}, 
          {id: 'css-2-3', title: 'Flexbox'}
      ]},
    ],
  },
  {
    title: 'Tailwind',
    duration: '4 weeks',
    weeks: [
      {title: 'Week 1', topics: [
          {id: 'tailwind-1-1', title: 'Responsive design'}, 
          {id: 'tailwind-1-2', title: 'Grid system'}
      ]},
      {title: 'Week 2', topics: [
          {id: 'tailwind-2-1', title: 'Components'}
      ]},
      {
        title: 'Week 3',
        topics: [
          {id: 'tailwind-3-1', title: 'Calculator project (in class)'}, 
          {id: 'tailwind-3-2', title: 'Horizons website (homework)'}
        ],
      },
      {
        title: 'Week 4',
        topics: [
            {id: 'tailwind-4-1', title: 'Shopping Cart (in class)'}, 
            {id: 'tailwind-4-2', title: 'Kawolegal (homework)'}
        ],
      },
    ],
  },
  {
    title: 'Git',
    duration: '2 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          {id: 'git-1-1', title: 'Installing git'},
          {id: 'git-1-2', title: 'Initialize git in repo'},
          {id: 'git-1-3', title: 'Staging'},
          {id: 'git-1-4', title: 'Committing'},
        ],
      },
      {title: 'Week 2', topics: [
          {id: 'git-2-1', title: 'Pushing'}, 
          {id: 'git-2-2', title: 'Branching'}, 
          {id: 'git-2-3', title: 'Pulling'}
      ]},
    ],
  },
  {
    title: 'JS',
    duration: '5 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          {id: 'js-1-1', title: 'Output (console.log, document.write)'},
          {id: 'js-1-2', title: 'Variables (var, let, const)'},
          {id: 'js-1-3', title: 'Data types (string, float, int, bool)'},
          {id: 'js-1-4', title: 'Arithmetic operators (+, -, x, %)'},
          {id: 'js-1-5', title: 'Comparisons (==, ===, !=, !==, >, <, >=, <=)'},
          {id: 'js-1-6', title: 'Logical operators (AND, OR, NOT, ||, &&)'},
        ],
      },
      {
        title: 'Week 2',
        topics: [
            {id: 'js-2-1', title: 'Arrays'}, 
            {id: 'js-2-2', title: 'Conditionals (if, else, else if, switch)'}, 
            {id: 'js-2-3', title: 'Loops (for, while, map)'}
        ],
      },
      {
        title: 'Week 3',
        topics: [
            {id: 'js-3-1', title: 'Functions(plain old functions, Arrow functions)'}, 
            {id: 'js-3-2', title: 'Objects'}
        ],
      },
      {title: 'Week 4', topics: [
          {id: 'js-4-1', title: 'OOP'},
          {id: 'js-4-2', title: 'Scope (this keyword)'},
      ]},
      {
        title: 'Week 5',
        topics: [
          {id: 'js-5-1', title: 'JS Q&A, JS overview'},
          {id: 'js-5-2', title: 'JS simple algorithms'},
          {id: 'js-5-3', title: 'DOM manipulation'},
        ],
      },
    ],
  },
  {
    title: 'Data Structures and Algorithms',
    duration: '3 weeks',
    weeks: [
      {
        title: 'Data structures in JS',
        topics: [
          {id: 'ds-1-1', title: 'Arrays(stack,queue)'},
          {id: 'ds-1-2', title: 'Push, Pop, slice, splice'},
          {id: 'ds-1-3', title: 'objects, classes'},
        ],
      },
      {
        title: 'Algorithms',
        topics: [
          {id: 'ds-2-1', title: 'Big O notation'},
          {id: 'ds-2-2', title: 'Sort algorithms(bubble sort / quick sort)(intermediate)'},
          {id: 'ds-2-3', title: 'Search algorithms(linear search,/ binary search)(intermediate)'},
          {id: 'ds-2-4', title: 'List of even/odd/prime numbers (basic)'},
          {id: 'ds-2-5', title: 'Sum of even/odd/prime numbers(basic)'},
          {id: 'ds-2-6', title: 'Search and replace (intermediate)'},
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
          {id: 'react-1-1', title: 'Overview of React and SPAs'},
          {id: 'react-1-2', title: 'Installing package managers (NPM, Yarn)'},
          {id: 'react-1-3', title: 'Create React App (CRA)'},
        ],
      },
      {
        title: 'Week 2',
        topics: [
          {id: 'react-2-1', title: 'Js import/export'},
          {id: 'react-2-2', title: 'How react server works (yarn start / npm start)'},
          {id: 'react-2-3', title: 'JSX'},
          {id: 'react-2-4', title: 'Styling in React (inline, external)'},
          {id: 'react-2-5', title: 'Components (and Destructuring)'},
          {id: 'react-2-6', title: 'Props'},
        ],
      },
      {
        title: 'Week 3',
        topics: [
          {id: 'react-3-1', title: 'Breaking content into components, how to link bootstrap (using the Pizza website)'},
          {id: 'react-3-2', title: 'Passing props to replace hard coded text and content'},
        ],
      },
      {
        title: 'Week 4',
        topics: [
          {id: 'react-4-1', title: 'Events (onClick, onChange)'},
          {id: 'react-4-2', title: 'State (and spread operator) - counter example using both class and function components.'},
          {id: 'react-4-3', title: 'Forms ( simple form with multiple inputs to collect data into the state. On submit, we log the values in the state to confirm that form works)'},
        ],
      },
      {
        title: 'Week 5',
        topics: [{id: 'react-5-1', title: 'CRUD Project 1 (create, retrieve) - add users/see users project'}],
      },
      {
        title: 'Week 6',
        topics: [{id: 'react-6-1', title: 'CRUD Project 2 (update, delete) - update users/delete users'}],
      },
      {
        title: 'Week 7',
        topics: [
          {id: 'react-7-1', title: 'Routing (react router, links, routes, route params)'},
          {id: 'react-7-2', title: 'Kawolegal website project (assignment)'},
        ],
      },
      {
        title: 'Week 8',
        topics: [{id: 'react-8-1', title: 'Making API requests (in functional components using fetch or axios)'}],
      },
      {
        title: 'Week 9',
        topics: [{id: 'react-9-1', title: 'Redux intro (flux architecture, setup - store, reducers, actions )'}],
      },
      {
        title: 'Week 10',
        topics: [
          {id: 'react-10-1', title: 'Redux (connect to components, mapStateToProps, MapDispatchToProps - create and retrieve) - Bank account project (assignment)'},
        ],
      },
      {
        title: 'Week 11',
        topics: [{id: 'react-11-1', title: 'Redux (edit and delete) - continue Bank account management project (assignment)'}],
      },
      {
        title: 'Week 12',
        topics: [{id: 'react-12-1', title: 'React Project(CRUD application with redux - Notes project)'}],
      },
    ],
  },
  {
    title: 'Firebase',
    duration: '3 weeks',
    weeks: [
      {
        title: 'Week 1-3',
        topics: [
            {id: 'firebase-1-1', title: 'Firebase connection'}, 
            {id: 'firebase-1-2', title: 'Firebase database / cloud firestore (CRUD)'}, 
            {id: 'firebase-1-3', title: 'Firebase authentication'}
        ],
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
          {id: 'rn-1-1', title: 'Setup React Native (install expo cli)'},
          {id: 'rn-1-2', title: 'Basic Components (Text, View)'},
          {id: 'rn-1-3', title: 'React Native Styles (Stylesheet.Create, flexbox)'},
          {id: 'rn-1-4', title: 'Available Core Library Components (Image, ImageBackground, Modal)'},
        ],
      },
      {
        title: 'Week 2',
        topics: [
          {id: 'rn-2-1', title: 'Forms and Buttons (TextInput, TouchableOpacity, KeyboardAvoidingView, SafeAreaView, Validation)'},
          {id: 'rn-2-2', title: 'Displaying List (FlatList, ScrollView)'},
        ],
      },
      {title: 'Week 3', topics: [
          {id: 'rn-3-1', title: 'Onboarding project exercise'},
          {id: 'rn-3-2', title: 'Ecommerce app assignment'},
      ]},
      {
        title: 'Week 4',
        topics: [
            {id: 'rn-4-1', title: 'Routing with React Navigation (Stack)'}, 
            {id: 'rn-4-2', title: 'React native blog app'}
        ],
      },
      {
        title: 'Week 5',
        topics: [
          {id: 'rn-5-1', title: 'Ampersand contact app first 4 screens as exercise'},
          {id: 'rn-5-2', title: 'Ampersand contact app last 4 screens as assignment'},
        ],
      },
      {
        title: 'Week 6',
        topics: [
          {id: 'rn-6-1', title: 'Redux'},
          {id: 'rn-6-2', title: 'Firebase'},
          {id: 'rn-6-3', title: 'Authentication'},
          {id: 'rn-6-4', title: 'Add authentication to form and list project from week 2'},
          {id: 'rn-6-5', title: 'React Native Project (Ampersand project) - add authentication as assignment'},
        ],
      },
      {title: 'Week 7', topics: [
          {id: 'rn-7-1', title: 'How react native works under the hood'},
          {id: 'rn-7-2', title: 'Wrap up'},
      ]},
    ],
  },
  {
    title: 'Backend - NodeJS',
    duration: '9 weeks',
    weeks: [
      {
        title: 'Week 1',
        topics: [
          {id: 'node-1-1', title: 'Setup a basic node server with http package'},
          {id: 'node-1-2', title: 'Learn request-response cycle and objects'},
          {id: 'node-1-3', title: 'Headers - content-type, accept,'},
          {id: 'node-1-4', title: 'body,'},
          {id: 'node-1-5', title: 'Methods - post, get, put, patch,'},
          {id: 'node-1-6', title: 'Url'},
          {id: 'node-1-7', title: 'Status codes - 200, 404, 500'},
          {id: 'node-1-8', title: 'Implement routing on the request objects url'},
          {id: 'node-1-9', title: 'Sending responses'},
        ],
      },
      {
        title: 'Week 2',
        topics: [
          {id: 'node-2-1', title: 'Npm and package.json'},
          {id: 'node-2-2', title: 'Setup node server with express'},
          {id: 'node-2-3', title: 'Routing with app.use(), app.get(), app.post()'},
          {id: 'node-2-4', title: 'Implement response.send()'},
        ],
      },
      {
        title: 'Week 3',
        topics: [
          {id: 'node-3-1', title: 'Middlewares - the next() method'},
          {id: 'node-3-2', title: 'General middlewares'},
          {id: 'node-3-3', title: 'Route middlewares'},
          {id: 'node-3-4', title: 'Serving static files - express.static middleware'},
          {id: 'node-3-5', title: 'Parsing request objects - body-parser middleware'},
        ],
      },
      {
        title: 'Week 4',
        topics: [
            {id: 'node-4-1', title: 'Postman'}, 
            {id: 'node-4-2', title: 'REST architecture'}, 
            {id: 'node-4-3', title: 'Getting organized - controllers, routes, models'}
        ],
      },
      {title: 'Week 5', topics: [
          {id: 'node-5-1', title: 'Databases - SQL and NoSQL'},
          {id: 'node-5-2', title: 'Setting up Mongodb'},
      ]},
      {
        title: 'Week 6',
        topics: [
          {id: 'node-6-1', title: 'Mongoose core - schema, models, queries'},
          {id: 'node-6-2', title: 'Setup mongoose for node'},
          {id: 'node-6-3', title: 'Mongoose models'},
          {id: 'node-6-4', title: 'Create and Retrieve data with mongoose'},
        ],
      },
      {
        title: 'Week 7',
        topics: [
            {id: 'node-7-1', title: 'Update and Delete data with mongoose'}, 
            {id: 'node-7-2', title: 'Relationships in mongoose'}, 
            {id: 'node-7-3', title: 'Fetching relational data'}, 
            {id: 'node-7-4', title: 'Delete relational data'}
        ],
      },
      {title: 'Week 8', topics: [{id: 'node-8-1', title: 'validation - express validator?'}]},
      {
        title: 'Week 9',
        topics: [
          {id: 'node-9-1', title: 'Authentication'},
          {id: 'node-9-2', title: 'Sign up'},
          {id: 'node-9-3', title: 'Sign in'},
          {id: 'node-9-4', title: 'Tokens and authorizations'},
          {id: 'node-9-5', title: 'Jwt - sign , verify , decode'},
          {id: 'node-9-6', title: 'Route protection'},
        ],
      },
    ],
  },
  {
    title: 'Final Project',
    duration: '4 weeks',
    weeks: [],
  },
];

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

export const RoadmapProvider: FC<{children: ReactNode}> = ({children}) => {
  const [completedWeeks, setCompletedWeeks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsubscribe = onRoadmapStatus((status) => {
      const completed = new Set<string>();
      Object.entries(status).forEach(([weekId, isCompleted]) => {
        if (isCompleted) {
          completed.add(weekId);
        }
      });
      setCompletedWeeks(completed);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleWeekCompletion = (weekId: string, currentStatus: boolean) => {
    if (role === 'teacher' || role === 'admin') {
      setWeekCompletion(weekId, !currentStatus);
    }
  };

  return (
    <RoadmapContext.Provider value={{roadmapData, completedWeeks, toggleWeekCompletion, loading}}>
      {children}
    </RoadmapContext.Provider>
  );
};

export const useRoadmap = (): RoadmapContextType => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
