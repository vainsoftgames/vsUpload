class vsUpload {
	onComplete; // Callback when upload is complete
	onUpdate; // Callback for upload progress updates
	onError; // Callback for handling errors
	onStart; // Callback when starting
	onPreview; // If wanting to preview before uploading
	fnc_stopCapture;
	
	asset_loc; // Location js is located, needed for vsWorker_upload.js

    /**
     * Creates an instance of vsUpload.
     * @param {string} inputID - The ID of the file input element.
     * @param {string} progressContainerId - The ID of the container where progress bars will be displayed.
     * @param {string} dropZoneID - The ID of the drop zone for drag-and-drop uploads.
     * @param {string} uploadURL - The URL where files will be uploaded.
     */
    constructor(inputID, progressContainerID, dropZoneID, uploadURL) {
        if(inputID) this.inputElement = document.getElementById(inputID);
        if(progressContainerID) this.progressContainer = document.getElementById(progressContainerID);
        if(dropZoneID) this.dropZone = document.getElementById(dropZoneID);
        if(uploadURL) this.uploadURL = uploadURL;

        this.para = {}; // Dictionary to hold additional data
        this.allowedFileTypes = []; // Array to hold allowed file types
        this.xhrRefs = {}; // Ref to XHR

        this.setup();
    }

    setup() {
    	if(this.inputElement){
			this.inputElement.addEventListener('change', (event) => {
				this.handleFiles(event.target.files);
			});
        }

        // Drag and Drop Events
         if(this.dropZone) this.setup_drop(this.dropZone);
    }
	setup_drop(divID){
		let dropzone = document.getElementById(divID);
		dropzone.addEventListener('dragover', (event) => {
			event.preventDefault();
			dropzone.classList.add('drag-over');
		});

		dropzone.addEventListener('dragenter', (event) => {
			event.preventDefault();
		});

		dropzone.addEventListener('dragleave', () => {
			dropzone.classList.remove('drag-over');
		});

		dropzone.addEventListener('drop', (event) => {
			event.preventDefault();
			dropzone.classList.remove('drag-over');
			this.handleFiles(event.dataTransfer.files);
		});
	}
	setup_clipboard(divID){
		document.getElementById(divID).addEventListener('paste', (event) => {
			const items = (event.clipboardData || event.originalEvent.clipboardData).items;
	
			for (const item of items) {
				if (item.type.indexOf('image') === 0) {
					const blob = item.getAsFile();
	
					// Generate a filename based on MIME type
					let filename = "pasted-image";
					let extension = blob.type.match(/\/(.*?)$/);
					if (extension) {
						extension = extension[1];
						if (extension === "jpeg") extension = "jpg"; // Common practice to use .jpg
						filename += "." + extension;
					}
	
					const file = new File([blob], filename, { type: blob.type });
					this.uploadFile(file);
				}
			}
		});
	}

    /**
     * Sets additional parameters to be sent along with the file upload.
     * @param {Object} data - Additional data as a key-value pair object.
     */
    setPara(data) {
        this.para = data;
    }

    /**
     * Sets the allowed file types for upload.
     * @param {Array} types - An array of allowed file extensions.
     */
    setAllowedFileTypes(types) {
        this.allowedFileTypes = types;
    }

    /**
     * Handles the file upload process for selected files.
     * @param {FileList} files - List of files selected for upload.
     */
    handleFiles(files) {
        const filteredFiles = Array.from(files).filter(file => {
            if (!this.isFileAllowed(file)) {
                alert(`File type not supported: ${file.name}`);
                return false;
            }
            return true;
        });

        for (const file of filteredFiles) {
            this.uploadFile(file);
        }
    }

    /**
     * Generates a unique ID.
     * @param {number} length - The length of the ID.
     * @returns {string} - A unique ID string.
     */
    uniqueID(length) {
		let result = '';
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const charactersLength = characters.length;
		let counter = 0;
		while (counter < length) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
			counter += 1;
		}
		return result;
	}


    /**
     * Checks if a file's type is allowed.
     * @param {File} file - The file to check.
     * @returns {boolean} - True if the file type is allowed, false otherwise.
     */
    isFileAllowed(file) {
        if (this.allowedFileTypes.length === 0) {
            return true; // If no file type restriction is set, allow all files
        }
        const fileType = file.name.split('.').pop().toLowerCase();
        return this.allowedFileTypes.includes(fileType);
    }

    /**
     * Handles the file upload to the server.
     * @param {File} file - The file to be uploaded.
     */
    uploadFile(file) {
        const ranID = this.createProgressBar(file);

        const worker = new Worker(this.asset_loc +'vainsoft/vsWorker_upload.js?_cache='+ (Date.now()));
        this.xhrRefs[ranID] = worker;

        worker.postMessage({
            action: 'upload',
            file: file,
            url: this.uploadURL,
            additionalData: this.para,
            ranID: ranID
        });

        worker.onmessage = (event) => {
            const { ranID, progress, complete, response, error, aborted } = event.data;
			console.log('local on message', event.data);
            if (progress !== undefined) {
                document.getElementById(ranID + '_progBar').value = progress;
                document.getElementById(ranID + '_progTXT').innerHTML = progress + '%';
                if (typeof this.onUpdate === 'function') this.onUpdate(ranID, file);
            }
            if (complete) {
                if (typeof this.onComplete === 'function') this.onComplete(ranID, file, response);
                worker.terminate();
                delete this.xhrRefs[ranID];
            }
            if (error) {
                if (typeof this.onError === 'function') this.onError(ranID, file, error);
                worker.terminate();
                delete this.xhrRefs[ranID];
            }
            if (aborted) {
                worker.terminate();
                delete this.xhrRefs[ranID];
                document.getElementById(ranID).remove();
            }
        };
    }

    /**
     * Cancels an ongoing file upload.
     * @param {string} ranID - The unique ID of the upload to cancel.
     */
    cancelUpload(ranID) {
		const worker = this.xhrRefs[ranID];
		if(work) worker.postMessage({ action: 'abort', ranID: ranID });
	}

    createProgressBar(file) {
        const ranID = this.uniqueID(10);
        const wrapper = document.createElement('div');
    	wrapper.id = ranID;
    	wrapper.className = 'vsUpload_item';

        const fileSIZE = this.formatFileSize(file.size);
        const fileEXT = file.name.split('.').pop().toUpperCase();
        const fileNAME = file.name.split('.').slice(0, -1).join('.');
        let thumbnailSrc = this.getThumbnailSrc(file, fileEXT.toLowerCase());

		wrapper.innerHTML = (`
			<div class="thumb">
				<img src="${thumbnailSrc}" id="${ranID}_img">
			</div>
			<div class="title">${fileNAME}<br><span><span class="ext">${fileEXT}</span> | <span class="filesize">${fileSIZE}</span></span></div>
			<div class="prog_bar"><progress id="${ranID}_progBar" value="0" max="100"></div>
			<div class="prog_txt" id="${ranID}_progTXT">0%</div>
			<div class="btns"><button value="X" id="${ranID}_cancel">`);

        this.progressContainer.appendChild(wrapper);
        this.previewImage(file, `${ranID}_img`);

        return ranID;
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
    getThumbnailSrc(file, fileEXT) {
      const supportedImageTypes = ['jpg', 'jpeg', 'png', 'gif'];
      if (supportedImageTypes.includes(fileEXT)) {
        return URL.createObjectURL(file);
        }
        else false;
    }

    previewImage(file, imageElementId) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById(imageElementId).src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

	
	/**
		Will trigger Share prompt to user.
		Allowing the user to select what Screen or Window to capture
	*/
	isScreenCaptureSupported() {
		return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
	}
	
	/**
		Captures the screen based on the singleFrame parameter.
		@param {boolean} singleFrame - Determines whether to capture a single frame or record a video.
	*/
	async captureScreen(singleFrame = true, preview = false){
		try {
            const screenStream  = await navigator.mediaDevices.getDisplayMedia({ video: true });

            if (singleFrame) this.captureSingleFrame(screenStream, preview);
            else {
				const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				const combinedStream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()]);
				this.recordVideo(combinedStream, preview);
			}
        }
		catch (err) {
            console.error('Error: ' + err);
        }
	}
	/**
		Captures a single frame from the screen and uploads it.
		@param {MediaStream} stream - The media stream to capture the frame from.
	*/
    captureSingleFrame(stream = MediaStream, preview = false) {
        const video = document.createElement('video');
        video.srcObject = stream;

        video.onloadedmetadata = async () => {
            video.play();

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;

            if (video.parentNode) {
                video.parentNode.removeChild(video);
            }

            canvas.toBlob(async (blob) => {
                const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
				
				if(preview && typeof this.onPreview === 'function') this.onPreview(file);
				else this.uploadFile(file);
            }, 'image/jpeg');
        };
    }

	/**
		Records a video from the screen and uploads it.
		@param {MediaStream} stream - The media stream to record the video from.
	*/
    recordVideo(stream = MediaStream, preview = false) {
        const mediaRecorder = new MediaRecorder(stream);
        let recordedChunks = [];

        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, {
                type: 'video/webm'
            });
            const file = new File([blob], 'screen_recording.webm', { type: 'video/webm' });

            if(preview && typeof this.onPreview === 'function') this.onPreview(file);
			else this.uploadFile(file);
            recordedChunks = [];
        };

        mediaRecorder.start();
		
		this.fnc_stopCapture = () => {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
        };
    }
}
