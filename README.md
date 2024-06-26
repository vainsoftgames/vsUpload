# vsUpload
HTML5 Uploader with Drag-n-Drop support

Add script to `<head>`
```html
<script type="text/javascript" src="vsUpload.js"></script>
```

Init the class
```html
<script>
var _upload = new vsUpload('FILE INPUT FIELD ID', 'PROGRESS DIV ID', 'DRAG-N-DROP DIV ID', 'URL POST FILE TO');
</script>
```
example:
```html
<script>
var _upload = new vsUpload('input_file', 'upload_prog', 'file_upload_wrapper', 'https://example.com/files');
_upload.setAllowedFileTypes(['jpg','jpeg','png','webp']);
_upload.setup_clipboard('chatINPUT_msg');
_upload.asset_loc = '../assets/js/';

// Show preview of file before upload
_upload.onPreview = function(file){
};
// File upload complete
_upload.onComplete = function(ranID, file, data){

};
</script>
```

Only accept certain file types
```js
_upload.setAllowedFileTypes(['jpg','obj']);
```

Supports pasting images into text field
```js
_upload.setup_clipboard('textfield_id');
````

Screen Capture (Still)
```js
_upload.captureScreen();
```

Screen Capture detect
```js
if(_upload.isScreenCaptureSupported()){
  _upload.captureScreen();
}
```

Screen Capture (Video)
```js
_upload.captureScreen(false);
```

Screen Capture (Video & Preview)
```js
_upload.captureScreen(false, true);
_upload.onPreview = function(file){
};
// To stop video capture call:
_upload.fnc_stopCapture();
```



Handles
```js
// File Upload Complete
_upload.onComplete = function(ranID, file, response){}

// File Upload Progress
_upload.onUpdate = function(ranID, file){}

// File error
_upload.onError = function(ranID, file, error){}

/** Screen Capture
  @param {boolean} singleFrame - Determines whether to capture a single frame or record a video.
  @param {boolean} preview - Determines whether to return for preview or directly upload
*/
_upload.captureScreen(singleFrame = true, preview = false);
```
