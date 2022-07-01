self.addEventListener("fetch", event => {
    event.respondWith(
        fetch(event.request)
            .then(response => caches
                .open("quranize-network-first")
                .then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                })
            )
            .catch(() => caches.match(event.request))
    );
});
