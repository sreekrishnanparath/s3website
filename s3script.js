var albumBucketName = "sree-bkt3";
var bucketRegion = "eu-west-1";
var IdentityPoolId = "eu-west-1:5927a492-baa1-4b73-968e-8e73f2d2c20f";

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName }
});


function displayAlbums(){

  s3.listObjects({ Delimiter: "/" }, function(err, data) {

    if (err) {
      return alert("There was an error loading albums: " + err.message);
    } else {
      var albums = data.CommonPrefixes.map(function(commonPrefix) {
        var prefix = commonPrefix.Prefix;
        var albumName = decodeURIComponent(prefix.replace("/", ""));
        console.log(albumName);
        return getHtml([
          "<li class=\"list-group-item\">",
          "<span onclick=\"displayAlbum('" + albumName + "')\">",
            albumName       ,
          "</span>",
          "</li>"
        ]);
      });
      var htmlTemplate = [
        "<ul class=\"list-group\">",
        getHtml(albums),
        "</ul>"
      ];
      document.getElementById("albumList").innerHTML = getHtml(htmlTemplate);
    }
  });
}

function createAlbum(albumName) {
  albumName = albumName.trim();
  if (!albumName) {
    return alert("Album names must contain at least one non-space character.");
  }
  if (albumName.indexOf("/") !== -1) {
    return alert("Album names cannot contain slashes.");
  }
  var albumKey = encodeURIComponent(albumName)+"/";
  s3.headObject({ Key: albumKey }, function(err, data) {
    if (!err) {
      return alert("Album already exists.");
    }
    if (err.code !== "NotFound") {
      return alert("There was an error creating your album: " + err.message);
    }
    s3.putObject({ Key: albumKey }, function(err, data) {
      if (err) {
        return alert("There was an error creating your album: " + err.message);
      }
      alert("Successfully created album.");
      displayAlbums();
      displayAlbum(albumName);
    });
  });
}

function displayAlbum(albumName) {
  document.getElementById("albumName").innerHTML = albumName;
  var albumPhotosKey = encodeURIComponent(albumName) + "/";
  s3.listObjects({ Prefix: albumPhotosKey }, function(err, data) {
    if (err) {
      return alert("There was an error viewing your album: " + err.message);
    }
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + albumBucketName + "/";

    var photos = data.Contents.map(function(photo) {
      var photoKey = photo.Key;
      var photoUrl = bucketUrl + encodeURIComponent(photoKey);

      //onerror=\"this.onerror=null; this.remove();\"

      if(!isValidImage(photoUrl)){
        return null;
      }

      return getHtml([
        "<div class=\"col-lg-3 col-md-4 col-6\">",
          "<a href=\"#\" class=\"d-block mb-4 h-100\">",
            '<img class="img-fluid img-thumbnail"  style="width:250px;height:250px;" src="' + photoUrl + '"/>',
            "<span class=\"input-group-text btn btn-danger btn-sm\" style=\"font-weight:bold;font-color:white;margin-top:2%;\" onclick=\"deletePhoto('" +
          albumName +
          "','" +
          photoKey +
          "')\">Delete</span>",
          "</a>",

          "</div>"

      ]);

    });

          var htmlTemplate = [
            getHtml(photos)
          ];

  document.getElementById("photoGrid").innerHTML = getHtml(htmlTemplate);

  });
}

function isValidImage(url) {
    return(url.match(/^http[^\?]*.(jpg|jpeg|gif|png|tiff|bmp)(\?(.*))?$/gmi) != null);
}

      function addPhoto() {
              var albumName = document.getElementById('albumName').innerText
              if (!albumName.length) {
                return alert("Please choose album first.");
              }
                var files = document.getElementById("photoupload").files;
                if (!files.length) {
                  return alert("Please choose a file to upload.");
                }
                if (files)
                {
                    var file = files[0];
                    var fileName = file.name;
                    var filePath = albumName+'/' + fileName;
                    var fileUrl = 'https://' + bucketRegion + '.amazonaws.com/my-first-bucket/' +  filePath;

                    s3.upload({
                                    Key: filePath,
                                    Body: file,
ACL: 'public-read'

                                }, function(err, data) {
                                    if(err) {
                                        alert(err);
                                    }

                                    alert('Successfully Uploaded!');
                                    document.getElementById("photoupload").value = []
                                    displayAlbum(albumName);
                                }).on('httpUploadProgress', function (progress) {
                                    var uploaded = parseInt((progress.loaded * 100) / progress.total);
                                    $("progress").attr('value', uploaded);
                                });
                }
      };

function deletePhoto(albumName, photoKey) {
  s3.deleteObject({ Key: photoKey }, function(err, data) {
    if (err) {
      return alert("There was an error deleting your photo: ", err.message);
    }
    alert("Successfully deleted photo.");
    displayAlbum(albumName);
  });
}

function deleteAlbum() {
var albumName = document.getElementById('albumName').innerText
  var albumKey = encodeURIComponent(albumName) + "/";
  s3.listObjects({ Prefix: albumKey }, function(err, data) {
    if (err) {
      return alert("There was an error deleting your album: ", err.message);
    }
    var objects = data.Contents.map(function(object) {
      return { Key: object.Key };
    });
    s3.deleteObjects(
      {
        Delete: { Objects: objects, Quiet: true }
      },
      function(err, data) {
        if (err) {
          return alert("There was an error deleting your album: ", err.message);
        }
        alert("Successfully deleted album.");
        document.getElementById('albumName').innerText = "";
        document.getElementById('photoGrid').innerText = "";
        displayAlbums();

      }
    );
  });
}
