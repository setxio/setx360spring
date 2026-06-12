import fs from 'fs';

const homeViewPath = 'c:\\Users\\montg\\OneDrive\\Desktop\\SETX 360 Final\\src\\components\\HomeView.tsx';
const searchViewPath = 'c:\\Users\\montg\\OneDrive\\Desktop\\SETX 360 Final\\src\\components\\SearchView.tsx';

let homeView = fs.readFileSync(homeViewPath, 'utf8');
const searchView = fs.readFileSync(searchViewPath, 'utf8');

// 1. Update imports in HomeView
const importsToAdd = `import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { WikiArticleView } from './wiki/WikiArticleView';
import { WikiEditModal } from './wiki/WikiEditModal';
import { Globe, Loader2, User, MessageSquare, ShoppingBag, ExternalLink, Image as ImageIcon, Video, Play, X } from 'lucide-react';
`;

homeView = homeView.replace(/import \{ Search, Moon, Sun,.*\} from 'lucide-react';/, (match) => {
  return match.replace(" } from 'lucide-react'", ", Globe, Loader2, User, MessageSquare, ShoppingBag, ExternalLink, Image as ImageIcon, Video, Play, X } from 'lucide-react'");
});

homeView = homeView.replace("import './HomeView.css';", `${importsToAdd}\nimport './HomeView.css';\nimport './SearchView.css';`); // Need SearchView.css for results layout

// 2. Add state
const stateToAdd = `
  // Search state
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Wiki state
  const [selectedWikiItem, setSelectedWikiItem] = useState<any>(null);
  const [wikiDetails, setWikiDetails] = useState<any>(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
`;

homeView = homeView.replace(/const \[query, setQuery\] = useState\(''\);/, `const [query, setQuery] = useState('');${stateToAdd}`);
homeView = homeView.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
homeView = homeView.replace(/import \{ motion \} from 'framer-motion';/, "import { motion, AnimatePresence } from 'framer-motion';");

// 3. Extract handleSearchSubmit, handleWikiClick, handleResultClick from SearchView
const searchSubmitMatch = searchView.match(/const handleSearchSubmit = async [\s\S]*?const handleWikiClick = async/);
const wikiClickMatch = searchView.match(/const handleWikiClick = async [\s\S]*?const handleResultClick = \(/);
const resultClickMatch = searchView.match(/const handleResultClick = \([\s\S]*?const quickLinks = \[/);

if (searchSubmitMatch && wikiClickMatch && resultClickMatch) {
  const fns = searchSubmitMatch[0].replace('const handleWikiClick = async', '') +
              wikiClickMatch[0].replace('const handleResultClick = (', '') +
              resultClickMatch[0].replace('const quickLinks = [', '');
  
  // Replace handleSearchSubmit in HomeView
  homeView = homeView.replace(/const handleSearchSubmit = \([\s\S]*?return \(/, `${fns}\n\n  return (`);
}

// 4. Add hasSearched block
const hasSearchedBlockMatch = searchView.match(/\/\/ Google-like Results View[\s\S]*?\/\/ Classic Landing Page Mode/);
if (hasSearchedBlockMatch) {
  const hasSearchedBlock = hasSearchedBlockMatch[0].replace('// Classic Landing Page Mode', '');
  homeView = homeView.replace(/return \(/, `${hasSearchedBlock}\n\n  return (`);
}

// 5. Add Wiki modals to bottom
const modalsMatch = searchView.match(/\{\/\* Wiki Details Modal \*\/\}[\s\S]*?<\/div>\n  \);\n\};/);
if (modalsMatch) {
  homeView = homeView.replace(/<\/div>\n  \);\n\};/, `\n      ${modalsMatch[0]}`);
}

fs.writeFileSync(homeViewPath, homeView);
console.log('HomeView.tsx updated');
