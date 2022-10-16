self.addEventListener("fetch", event => {
    if (event.request.method == "GET" && /^https?:\/\//.test(event.request.url))
        respondStaleWhileRevalidate(event);
});

function respondStaleWhileRevalidate(event) {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            let fetchedResponse = fetch(event.request).then(response => {
                putResponse(event.request, response);
                return response;
            }).catch(() => { });
            return cachedResponse ? cachedResponse : fetchedResponse;
        })
    );
}

async function putResponse(request, response) {
    let clonedResponse = response.clone();
    const cache = await caches.open("quranize-sw-v3");
    return await cache.put(request, clonedResponse);
}
