import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { searchModuleByKeywordApi } from '../../api/module/ModuleApi';
import RelationshipsData from './RelationshipData';

export const useRelationshipList = (moduleName, recordId, relationshipType) => {
    const [relationships, setRelationships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch relationships using RelationshipsData
    const fetchRelationships = useCallback(async (isRefresh = false, pageNum = 1, search = '') => {
        if (!moduleName || !recordId || !relationshipType) {
            setError('Missing required parameters');
            setLoading(false);
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (pageNum === 1) {
                setLoading(true);
            }
            setError(null);

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('Missing authentication token');
            }

            let relationshipData = [];

            if (search) {
                // Use search API for keyword search
                const searchResults = await searchModuleByKeywordApi(relationshipType, search, pageNum);
                if (searchResults.data) {
                    relationshipData = searchResults.data.map(item => ({
                        id: item.id,
                        ...item.attributes
                    }));
                }
            } else {
                // Use RelationshipsData to get relationship list
                // This might need to be implemented based on your relationship API structure
                // For now, using a placeholder approach
                const relatedLink = `/Api/V8/module/${moduleName}/${recordId}/relationships/${relationshipType.toLowerCase()}`;
                const data = await RelationshipsData.getDataByPage(token, relatedLink, pageNum, 20);
                relationshipData = data.accounts || [];
            }
            
            if (pageNum === 1) {
                setRelationships(relationshipData);
            } else {
                setRelationships(prev => [...prev, ...relationshipData]);
            }
            
            // Simple pagination check - if we got less than 20 items, assume no more
            setHasMore(relationshipData.length >= 20);
            setPage(pageNum);

        } catch (err) {
            console.error('Error fetching relationships:', err);
            setError(err.message || 'An error occurred while fetching relationships');
            if (pageNum === 1) {
                setRelationships([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [moduleName, recordId, relationshipType]);

    // Refresh list
    const refreshList = useCallback(() => {
        setPage(1);
        fetchRelationships(true, 1, searchQuery);
    }, [fetchRelationships, searchQuery]);

    // Load more items
    const loadMore = useCallback(() => {
        if (hasMore && !loading && !refreshing) {
            const nextPage = page + 1;
            fetchRelationships(false, nextPage, searchQuery);
        }
    }, [hasMore, loading, refreshing, page, fetchRelationships, searchQuery]);

    // Search relationships
    const searchRelationships = useCallback((query) => {
        setSearchQuery(query);
        setPage(1);
        fetchRelationships(false, 1, query);
    }, [fetchRelationships]);

    // Initial load
    useEffect(() => {
        fetchRelationships();
    }, [fetchRelationships]);

    return {
        relationships,
        loading,
        refreshing,
        error,
        hasMore,
        refreshList,
        loadMore,
        searchRelationships
    };
};
