self.addEventListener("fetch", event => {
    if (event.request.method == "GET" && /^https?:\/\//.test(event.request.url))
        intercept(event);
});

function intercept(event) {
    if (/\.(otf|ttf|woff|woff2)(\?.*)?$/.test(event.request.url))
        respondStaleWhileRevalidate(event)
    else
        respondNetworkFirst(event);
}

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

function respondNetworkFirst(event) {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                putResponse(event.request, response);
                return response;
            })
            .catch(() => caches.match(event.request))
    );
}

async function putResponse(request, response) {
    let clonedResponse = response.clone();
    const cache = await caches.open("quranize-sw-v2");
    return await cache.put(request, clonedResponse);
}
