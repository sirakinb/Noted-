import { useTRPC } from "@/trpc/client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTogetherApiKey } from "../TogetherApiKeyProvider";

interface LimitData {
  remaining: number | null;
  limit: number | null;
}

const DEFAULT_LIMIT_DATA: LimitData = { remaining: 0, limit: 0 };
const UNLIMITED_LIMIT_DATA: LimitData = { remaining: null, limit: null };

export const useLimits = () => {
  const { user, isLoaded } = useUser();
  const { apiKey } = useTogetherApiKey();

  const isBYOK = !!apiKey;
  const trpc = useTRPC();
  
  // Only enable queries when user is loaded and authenticated
  const isUserReady = isLoaded && !!user;

  // Transformations query
  const transformationsQuery = useQuery({
    ...trpc.limit.getTransformationsLeft.queryOptions(),
    enabled: isUserReady && !isBYOK,
    retry: false,
    staleTime: 30000, // 30 seconds
  });

  // Minutes query
  const minutesQuery = useQuery({
    ...trpc.limit.getMinutesLeft.queryOptions(),
    enabled: isUserReady,
    retry: false,
    staleTime: 30000, // 30 seconds
  });

  // Safe data extraction with comprehensive error handling
  const getTransformationsData = (): LimitData => {
    if (!isUserReady) return DEFAULT_LIMIT_DATA;
    if (isBYOK) return UNLIMITED_LIMIT_DATA;
    if (transformationsQuery.isLoading) return DEFAULT_LIMIT_DATA;
    if (transformationsQuery.error) return DEFAULT_LIMIT_DATA;
    
    const data = transformationsQuery.data;
    if (!data || typeof data !== 'object') return DEFAULT_LIMIT_DATA;
    
    return {
      remaining: typeof data.remaining === 'number' ? data.remaining : (data.remaining === null ? null : 0),
      limit: typeof data.limit === 'number' ? data.limit : (data.limit === null ? null : 0),
    };
  };

  const getMinutesData = (): LimitData => {
    if (!isUserReady) return DEFAULT_LIMIT_DATA;
    if (minutesQuery.isLoading) return DEFAULT_LIMIT_DATA;
    if (minutesQuery.error) return DEFAULT_LIMIT_DATA;
    
    const data = minutesQuery.data;
    if (!data || typeof data !== 'object') return DEFAULT_LIMIT_DATA;
    
    return {
      remaining: typeof data.remaining === 'number' ? data.remaining : (data.remaining === null ? null : 0),
      limit: typeof data.limit === 'number' ? data.limit : (data.limit === null ? null : 0),
    };
  };

  return {
    transformationsData: getTransformationsData(),
    minutesData: getMinutesData(),
    isTransformationsLoading: transformationsQuery.isLoading && isUserReady,
    isMinutesLoading: minutesQuery.isLoading && isUserReady,
    transformationsError: transformationsQuery.error,
    minutesError: minutesQuery.error,
  };
};
