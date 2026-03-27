import { createContext, useContext, useState } from 'react';

/**
 * NewsContext — shares the currently visible news card across the component tree.
 * `Home.jsx` writes to it whenever the visible index changes.
 * `Layout.jsx` reads `getCurrentCard` and passes it to `<VoiceChat>`.
 */
const NewsContext = createContext({
  currentCard: null,
  setCurrentCard: () => {},
});

export function NewsProvider({ children }) {
  const [currentCard, setCurrentCard] = useState(null);
  return (
    <NewsContext.Provider value={{ currentCard, setCurrentCard }}>
      {children}
    </NewsContext.Provider>
  );
}

/** Hook for components that need to read or write the current card. */
export function useNewsContext() {
  return useContext(NewsContext);
}
