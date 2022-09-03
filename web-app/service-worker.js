self.addEventListener("fetch", event => {
    event.respondWith(
        fetch(event.request)
            .then(response => event.request.url.startsWith("http") ? caches
                .open("quranize-network-first")
                .then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                }) : response
            )
            .catch(() => caches.match(event.request))
    );
});
