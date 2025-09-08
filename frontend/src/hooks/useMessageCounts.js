import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Custom hook to fetch message count for all characters
 * @param {Array} characters - Array of character objects with id property
 * @returns {Object} Object with character IDs as keys and message counts as values
 */
export function useMessageCounts(characters = []) {
  const [messageCounts, setMessageCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedIds = useRef('');

  // Memoize character IDs to prevent unnecessary re-fetches
  const characterIds = useMemo(() => {
    return characters.map(char => char?.id).filter(Boolean).sort();
  }, [characters]);

  // Create a stable string representation of the IDs for comparison
  const characterIdsString = characterIds.join(',');

  useEffect(() => {
    // Skip if no characters or if we already fetched for these exact character IDs
    if (!characterIds || characterIds.length === 0) {
      setMessageCounts({});
      return;
    }

    // Prevent duplicate API calls for the same set of character IDs
    if (lastFetchedIds.current === characterIdsString) {
      return;
    }

    const fetchMessageCounts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const base = import.meta.env.VITE_API_BASE_URL;
        if (!base) {
          console.warn('VITE_API_BASE_URL not configured');
          setLoading(false);
          return;
        }

        const url = `${base.replace(/\/$/, '')}/characters/message-count`;
        const headers = { 'Content-Type': 'application/json' };
        
        // Add auth token if available
        const stored = localStorage.getItem('pronily:auth:token');
        if (stored) {
          const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
          headers['Authorization'] = `bearer ${tokenOnly}`;
        } else if (import.meta.env.VITE_API_AUTH_TOKEN) {
          headers['Authorization'] = import.meta.env.VITE_API_AUTH_TOKEN;
        }

        console.log('Fetching message counts for characters:', characterIds);

        // Make single GET request to fetch all message counts
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          
          // Transform array response to object with character_id as keys
          const counts = {};
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.character_id && typeof item.count_message === 'number') {
                counts[item.character_id] = item.count_message;
              }
            });
          }
          
          setMessageCounts(counts);
          // Mark these character IDs as fetched
          lastFetchedIds.current = characterIdsString;
        } else {
          console.warn('Failed to fetch message counts:', response.status);
          setError(`Failed to fetch message counts: ${response.status}`);
          // Set all counts to 0 as fallback
          const fallbackCounts = {};
          characterIds.forEach(id => {
            fallbackCounts[id] = 0;
          });
          setMessageCounts(fallbackCounts);
        }
      } catch (err) {
        console.error('Error fetching message counts:', err);
        setError(err.message);
        // Set all counts to 0 as fallback
        const fallbackCounts = {};
        characterIds.forEach(id => {
          fallbackCounts[id] = 0;
        });
        setMessageCounts(fallbackCounts);
      } finally {
        setLoading(false);
      }
    };

    fetchMessageCounts();
  }, [characterIdsString]); // Use the string representation instead of the array

  /**
   * Get formatted message count for a character
   * @param {number} characterId - Character ID
   * @returns {string} Formatted message count (e.g., "1.2k", "1M")
   */
  const getFormattedCount = (characterId) => {
    const count = messageCounts[characterId];
    if (count === undefined || count === null) return '0';
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    } else {
      return count.toString();
    }
  };

  return {
    messageCounts,
    loading,
    error,
    getFormattedCount,
  };
}
