# vsUpload
HTML5 Uploader with Drag-n-Drop support

Add script to `<head>`
```
<script type="text/javascript" src="vsUpload.js"></script>
```

Init the class
```
<script>
var upload = new vsUpload('FILE INPUT FIELD ID', 'PROGRESS DIV ID', 'DRAG-N-DROP DIV ID', 'URL POST FILE TO');
</script>
```
example:
```
<script>
var upload = new vsUpload('input_file', 'upload_prog', 'file_upload_wrapper', 'https://example.com/files');
</script>
```

Only accept certain file types
```
upload.setAllowedFileTypes(['jpg','obj']);
```

Screen Capture
```
upload.captureScreen();

or

if(upload.isScreenCaptureSupported()){
  upload.captureScreen();
}
```



Handles
```
// File Upload Complete
upload.onComplete = function(ranID, file){}

// File Upload Progress
upload.onUpdate = function(ranID, file){}

// File error
upload.onError = function(ranID, file, error){}
```
