const cacheKey = "quranize-sw-v3";

self.addEventListener("install", (_event) => {
    self.skipWaiting();
});

self.addEventListener("fetch", event => {
    if (/^https?:\/\//.test(event.request.url)) intercept(event);
});

function intercept(event) {
    const path = new URL(event.request.url).pathname;
    const swrPrefixes = ["/styles/fontawesome/", "/styles/fonts/", "/scripts/quran/"];
    if (swrPrefixes.some(p => path.startsWith(p))) respondStaleWhileRevalidate(event)
    else respondNetworkFirst(event);
}

function respondStaleWhileRevalidate(event) {
    const fetchedResponse = fetchRequest(event.request).catch(() => { });
    event.respondWith(
        caches.open(cacheKey)
            .then(cache => cache.match(event.request))
            .then(cachedResponse => cachedResponse ? cachedResponse : fetchedResponse)
    );
}

function respondNetworkFirst(event) {
    event.respondWith(
        fetchRequest(event.request)
            .catch(async () => (await caches.open(cacheKey)).match(event.request))
    );
}

async function fetchRequest(request) {
    const response = await fetch(request);
    putResponse(request, response);
    return response;
}

async function putResponse(request, response) {
    const clonedResponse = response.clone();
    const cache = await caches.open(cacheKey);
    return cache.put(request, clonedResponse);
}
