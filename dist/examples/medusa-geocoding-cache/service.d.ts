export declare class GeocodingCacheService {
    protected cachingModuleService_: any;
    protected logger_: any;
    constructor({ cachingModuleService, logger }: any);
    getCachedReverse(lat: number, lng: number): Promise<any>;
    setCachedReverse(lat: number, lng: number, data: any): Promise<void>;
    getCachedForward(query: string): Promise<any>;
    setCachedForward(query: string, data: any): Promise<void>;
}
export declare class RateLimitedQueue {
    private queue;
    private processing;
    private readonly minInterval;
    enqueue<T>(fn: () => Promise<T>): Promise<T>;
    private process;
}
