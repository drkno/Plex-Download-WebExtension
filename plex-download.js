(async() => {
    if (document.querySelectorAll('div[class*="PrePlayDetailsGroupItem-label"]').length < 2) {
        alert('No plex media file could be found.');
        return;
    }

    class ExtendedPromise extends Promise {
        static any(promises) {
            return Promise.all(promises.map(p => p.then(
                val => Promise.reject(val),
                err => Promise.resolve(err)
            )))
            .then(
                errors => Promise.reject(errors),
                val => Promise.resolve(val)
            );
        };
    }

    class PlexDownload {
        constructor(location, localStorage) {
            this.location = location;
            this.localStorage = localStorage;
        }

        _getMediaInfo() {
            const mediaIdStr = decodeURIComponent(this.location.hash);
            const mediaIdSpl = mediaIdStr.split('/');
            const users = JSON.parse(this.localStorage.users).users;
            const serverInfo = users.find(d => d.authToken === this.localStorage.myPlexAccessToken)
                .servers.find(d => d.machineIdentifier === mediaIdSpl[2]);
            return {
                mediaId: mediaIdSpl[mediaIdSpl.length - 1].split('&')[0],
                plexToken: serverInfo.accessToken,
                plexServerUris: serverInfo.connections.map(d => d.uri)
            };
        }

        async _testReachable(uri) {
            await fetch(uri, {method: 'HEAD'});
            return uri;
        }

        async _getDownloadUrl(mediaInfo) {
            const serverUri = await ExtendedPromise.any(mediaInfo.plexServerUris.map(this._testReachable));
            const metadataUri = `${serverUri}/library/metadata/${mediaInfo.mediaId}?X-Plex-Token=${mediaInfo.plexToken}`;
            const dom = new DOMParser().parseFromString(await (await fetch(metadataUri)).text(), 'application/xml');
            return `${serverUri}${dom.getElementsByTagName('Part')[0].getAttribute('key')}?download=1&X-Plex-Token=${mediaInfo.plexToken}`;
        }
    
        getDownloadUrl() {
            const mediaInfo = this._getMediaInfo();
            return this._getDownloadUrl(mediaInfo);
        }
    }

    if (!window._downloader) {
        window._downloader = new PlexDownload(window.location, window.localStorage);
    }
    window.document.location = await window._downloader.getDownloadUrl();
})();
