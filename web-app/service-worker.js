const cacheKey = "quranize-sw-v3";

self.addEventListener("fetch", event => {
    if (/^https?:\/\//.test(event.request.url)) intercept(event);
});

function intercept(event) {
    if (
        /\.(otf|ttf|woff|woff2)(\?.*)?$/.test(event.request.url) ||
        /\/scripts\/quran\/.*$/.test(event.request.url)
    ) respondStaleWhileRevalidate(event)
    else respondNetworkFirst(event);
}

function respondStaleWhileRevalidate(event) {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchedResponse = fetch(event.request).then(response => {
                putResponse(event.request, response);
                return response;
            }).catch(() => { });
            return cachedResponse ? cachedResponse : fetchedResponse;
        })
    );
}

function respondNetworkFirst(event) {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                putResponse(event.request, response);
                return response;
            })
            .catch(async () => (await caches.open(cacheKey)).match(event.request))
    );
}

async function putResponse(request, response) {
    const clonedResponse = response.clone();
    const cache = await caches.open(cacheKey);
    return cache.put(request, clonedResponse);
}
