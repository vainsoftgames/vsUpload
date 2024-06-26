let xhr;

self.onmessage = function(event) {
    const { action, file, url, additionalData, ranID } = event.data;
	console.log('on message', event.data);

    if (action === 'upload') {
        const formData = new FormData();
		formData.append('ranID', ranID);
        formData.append('file', file);

        for (const key in additionalData) {
            formData.append(key, additionalData[key]);
        }

        xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = event.loaded / event.total * 100;
                self.postMessage({ ranID, progress: percentComplete });
            }
        }, false);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                self.postMessage({ ranID, complete: true, response: xhr.responseText });
            }
        };

        xhr.onerror = () => {
            self.postMessage({ ranID, error: `Network error occurred during the upload of ${file.name}.` });
        };

        xhr.open('POST', url, true);
        xhr.send(formData);
    } else if (action === 'abort' && xhr) {
        xhr.abort();
        self.postMessage({ ranID, aborted: true });
    }
};
