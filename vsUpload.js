class vsUpload {
	onComplete; // Callback when upload is complete
	onUpdate; // Callback for upload progress updates
	onError; // Callback for handling errors

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
        if(this.dropZone){
			this.dropZone.addEventListener('dragover', (event) => {
				event.preventDefault();
				this.dropZone.classList.add('drag-over');
			});

			this.dropZone.addEventListener('dragenter', (event) => {
				event.preventDefault();
			});

			this.dropZone.addEventListener('dragleave', () => {
				this.dropZone.classList.remove('drag-over');
			});

			this.dropZone.addEventListener('drop', (event) => {
				event.preventDefault();
				this.dropZone.classList.remove('drag-over');
				this.handleFiles(event.dataTransfer.files);
			});
        }
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
        const formData = new FormData();
        formData.append('file', file);

        // Add additional data to FormData
        for (const key in this.para) {
            formData.append(key, this.para[key]);
        }

        const xhr = new XMLHttpRequest();
        const ranID = this.createProgressBar(file);

        this.xhrRefs[ranID] = xhr; // Store the XHR reference
        formData.append('ranID', ranID);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = event.loaded / event.total * 100;
				
				if(typeof this.onUpdate === 'function') this.onUpdate(ranID, file);

                document.getElementById(ranID +'_progBar').value = percentComplete;
                document.getElementById(ranID +'_progTXT').innerHTML = (percentComplete +'%');
            }
        }, false);

	// Error event listener
	xhr.onerror = () => {
		if (typeof this.onError === 'function') {
			this.onError(ranID, file, `Network error occurred during the upload of ${file.name}.`);
		}
	};

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
				if(typeof this.onComplete === 'function'){
					this.onComplete(ranID, file);
				}
            }
        };

        xhr.open('POST', this.uploadURL, true);
        xhr.send(formData);
    }

    /**
     * Cancels an ongoing file upload.
     * @param {string} ranID - The unique ID of the upload to cancel.
     */
    cancelUpload(ranID) {
		if (this.xhrRefs[ranID]) {
			this.xhrRefs[ranID].abort(); // Abort the XHR request
			delete this.xhrRefs[ranID]; // Remove the reference

			// Update the UI accordingly
			document.getElementById(ranID).remove()
		}
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
}
