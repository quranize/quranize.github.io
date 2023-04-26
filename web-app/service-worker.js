const cacheKey = "quranize-sw-v3";

self.addEventListener("install", (_event) => {
    self.skipWaiting();
});

self.addEventListener("fetch", event => {
    if (/^https?:\/\//.test(event.request.url)) intercept(event);
});

function intercept(event) {
    if (
        /\.(otf|ttf|woff|woff2)(\?.*)?$/.test(event.request.url) ||
        /\/scripts\/quran\/.*$/.test(event.request.url) ||
        /\/scripts\/quranize\/.*$/.test(event.request.url)
    ) respondStaleWhileRevalidate(event)
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
