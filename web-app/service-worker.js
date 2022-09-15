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
    console.log(`not serving ${event.request.url}`);
}

function respondNetworkFirst(event) {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                let clonedResponse = response.clone();
                caches.open("quranize-network-first")
                    .then(cache => cache.put(event.request, clonedResponse));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
}
