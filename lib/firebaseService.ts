import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { NewsTopic, NewsSource, NewsCategory } from './types';
import { calculateBiasDistribution } from './utils';
// Helper to convert Firestore Timestamp to string
const convertTimestamp = (timestamp: any): string => {
    if (!timestamp) return new Date().toISOString();
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    // Handle already string or date
    return new Date(timestamp).toISOString();
};
// Fetch all news topics
export async function fetchNewsTopics(): Promise<NewsTopic[]> {
    try {
        const topicsRef = collection(db, 'topics');
        const q = query(topicsRef, orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const topics: NewsTopic[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            topics.push({
                id: doc.id,
                ...data,
                // FIX: Convert timestamp correctly
                updatedAt: convertTimestamp(data.updatedAt),
            } as NewsTopic);
        });
        return topics;
    } catch (error) {
        console.error('Error fetching topics:', error);
        return [];
    }
}
// Fetch a single topic by ID with all its sources
export async function fetchTopicById(id: string): Promise<NewsTopic | null> {
    try {
        const topicRef = doc(db, 'topics', id);
        const topicSnap = await getDoc(topicRef);
        if (!topicSnap.exists()) {
            return null;
        }
        const topicData = topicSnap.data();
        // Fetch sources for this topic
        const sourcesRef = collection(db, 'topics', id, 'sources');
        const sourcesSnapshot = await getDocs(sourcesRef);
        const sources: NewsSource[] = [];
        sourcesSnapshot.forEach((doc) => {
            const data = doc.data();
            sources.push({
                id: doc.id,
                ...data,
                publishedAt: convertTimestamp(data.publishedAt),
            } as NewsSource);
        });
        const biasDistribution = calculateBiasDistribution(sources);
        return {
            id: topicSnap.id,
            ...topicData,
            updatedAt: convertTimestamp(topicData.updatedAt),
            sources,
            sourceCount: sources.length,
            biasDistribution,
        } as NewsTopic;
    } catch (error) {
        console.error('Error fetching topic:', error);
        return null;
    }
}
// Fetch topics by category
export async function fetchTopicsByCategory(category: NewsCategory): Promise<NewsTopic[]> {
    if (category === '全部') {
        return fetchNewsTopics();
    }
    try {
        const topicsRef = collection(db, 'topics');
        const q = query(
            topicsRef,
            where('category', '==', category),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const topics: NewsTopic[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            topics.push({
                id: doc.id,
                ...data,
                updatedAt: convertTimestamp(data.updatedAt),
            } as NewsTopic);
        });
        return topics;
    } catch (error) {
        console.error('Error fetching topics by category:', error);
        return [];
    }
}
