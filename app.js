// Generated by CoffeeScript 2.3.2
(function() {
  var AWS, S3App, cdnizerFactory, find, fs, mime, path, q;

  AWS = require('aws-sdk');

  fs = require('fs');

  q = require('q');

  find = require('find');

  path = require('path');

  cdnizerFactory = require('cdnizer');

  mime = require('mime');

  module.exports = S3App = class S3App {
    constructor() {
      var args;
      console.log('Start S3/CDN processus!  NODE_ENV:', process.env.NODE_ENV);
      args = process.argv.slice(2);
      if (args[0] === '--config' && args[1]) {
        this.params = require(args[1]);
        this.cdnizerProcessus().then(() => {
          console.log('Cdnizer processus COMPLETE');
          return this.s3Processus();
        }, function(err) {
          return console.log(err);
        });
      } else {
        console.log('Configuration error (Don\'t forget to add --config arg)');
      }
    }

    cdnizerProcessus() {
      var deferred;
      deferred = q.defer();
      if (this.params.cdnDomain) {
        this.getFilesByExtensionsSequence(this.params.fileExtensions).then((files) => {
          var filenames;
          filenames = files.map((f) => {
            return this.getFilename(f);
          });
          this.initCdnizer(filenames);
          return this.getFilesByExtensionsSequence(['html', 'js', 'css']).then((tFiles) => {
            var contents, file, i, len, newContents;
            for (i = 0, len = tFiles.length; i < len; i++) {
              file = tFiles[i];
              contents = fs.readFileSync(file, 'utf8');
              newContents = this.cdnizer(contents);
              fs.writeFileSync(file, newContents);
            }
            return deferred.resolve();
          }, function(err) {
            return deferred.reject(err);
          });
        }, function(err) {
          return deferred.reject(err);
        });
      } else {
        deferred.reject('Error! No CDN domain defined!');
      }
      return deferred.promise;
    }

    initCdnizer(pFiles) {
      return this.cdnizer = cdnizerFactory({
        defaultCDNBase: this.params.cdnDomain + '/' + this.params.subDir,
        allowRev: true,
        allowMin: true,
        files: pFiles,
        matchers: [
          {
            pattern: /(url\(['"]?)([a-zA-Z-_.0-9]+)([\?|#]?[^)]*['"]?\))/gi,
            fallback: false
          }
        ]
      });
    }

    getFilesByExtensionsSequence(pExtensions, pIndex = 0) {
      var deferred;
      deferred = q.defer();
      if (pIndex > pExtensions.length - 1) {
        deferred.resolve([]);
      } else {
        console.log('\nFind local ' + pExtensions[pIndex] + ' files');
        this.findFilesByExtension(pExtensions[pIndex], this.params.localDir).then((filesA) => {
          return this.getFilesByExtensionsSequence(pExtensions, pIndex + 1).then(function(filesB) {
            var filesC;
            filesC = filesA.concat(filesB);
            return deferred.resolve(filesC);
          }, function(err) {
            return deferred.reject(err);
          });
        }, function(err) {
          console.log(' @findFilesByExtension err:', err);
          return deferred.reject(err);
        });
      }
      return deferred.promise;
    }

    findFilesByExtension(pExtension, pLocalDir) {
      var deferred;
      deferred = q.defer();
      find.file(new RegExp('\\.' + pExtension + '$'), pLocalDir, function(files) {
        console.log(' ->', pExtension, 'files:', files);
        return deferred.resolve(files);
      });
      return deferred.promise;
    }

    s3Processus() {
      console.log('\nInit S3 client');
      this.awsS3Client = new AWS.S3(this.params.s3Options);
      console.log('Delete S3 subdirectory ' + this.params.subDir + '/');
      return this.listS3BucketObject(this.params.subDir + '/').then((contents) => {
        contents = contents.map(function(object) {
          return object = {
            Key: object.Key
          };
        });
        return this.deleteFiles(contents).then((deleted) => {
          console.log('deleted:', deleted);
          return this.extensionsUploadSequence(this.params.fileExtensions).then(function() {
            return console.log('\nUpload COMPLETE');
          });
        });
      });
    }

    extensionsUploadSequence(pExtensions, pIndex = 0) {
      var deferred;
      deferred = q.defer();
      if (pIndex > pExtensions.length - 1) {
        deferred.resolve();
      } else {
        console.log('\nFind local ' + pExtensions[pIndex] + ' files');
        this.findFilesByExtension(pExtensions[pIndex], this.params.localDir).then((files) => {
          return this.uploadSequence(files).then(() => {
            return this.extensionsUploadSequence(pExtensions, pIndex + 1).then(function() {
              return deferred.resolve();
            }, function(err) {
              return deferred.reject(err);
            });
          });
        }, function(err) {
          console.log(' @findFilesByExtension err:', err);
          return deferred.reject(err);
        });
      }
      return deferred.promise;
    }

    uploadSequence(pArray, pIndex = 0) {
      var deferred;
      deferred = q.defer();
      if (pIndex > pArray.length - 1) {
        deferred.resolve();
      } else {
        this.uploadFile(pArray[pIndex]).then((etag) => {
          console.log(' etag:', etag);
          return this.uploadSequence(pArray, pIndex + 1).then(function() {
            return deferred.resolve();
          }, function(err) {
            return deferred.reject(err);
          });
        }, function(err) {
          console.log(' @uploadFile err:', err);
          return deferred.reject(err);
        });
      }
      return deferred.promise;
    }

    getFilename(pPath) {
      var fileNameWithExt, normalizedLocalDir;
      // Just keep the filename with extension of the path!
      normalizedLocalDir = path.normalize(this.params.localDir);
      fileNameWithExt = path.normalize(pPath).replace(normalizedLocalDir, '');
      if (fileNameWithExt.substr(0, 1) === '/' || fileNameWithExt.substr(0, 1) === '\\') {
        fileNameWithExt = fileNameWithExt.substring(1);
      }
      fileNameWithExt = fileNameWithExt.replace(/\\/gi, '\/');
      return fileNameWithExt;
    }

    uploadFile(pPath) {
      var deferred, fileNameWithExt;
      deferred = q.defer();
      fileNameWithExt = this.getFilename(pPath);
      console.log('uploadFile', this.params.subDir + '/' + fileNameWithExt + ' (' + mime.getType(pPath) + ')');
      if (this.params.subDir && this.params.s3Bucket) {
        fs.readFile(pPath, (err, fileData) => {
          var params;
          params = {
            ACL: 'public-read',
            Key: this.params.subDir + '/' + fileNameWithExt,
            Body: fileData,
            ContentType: mime.getType(pPath),
            Bucket: this.params.s3Bucket
          };
          //Tagging: (For example, "Key1=Value1")
          return this.awsS3Client.putObject(params, function(error, data) {
            if (error) {
              console.log('putObject error:', error);
              return deferred.reject(error);
            } else {
              return deferred.resolve(data.ETag);
            }
          });
        });
      } else {
        deferred.reject('Bad params!');
      }
      return deferred.promise;
    }

    deleteFiles(pObjectKeys) {
      var deferred, params;
      deferred = q.defer();
      if (pObjectKeys.length === 0) {
        deferred.resolve([]);
      } else {
        params = {
          Bucket: this.params.s3Bucket,
          Delete: {
            Objects: pObjectKeys,
            Quiet: false
          }
        };
        this.awsS3Client.deleteObjects(params, function(err, data) {
          if (err) {
            console.log('deleteObjects err:', err);
            return deferred.reject(err);
          } else {
            return deferred.resolve(data.Deleted);
          }
        });
      }
      return deferred.promise;
    }

    listS3BucketObject(pDirectory) {
      var deferred, params;
      deferred = q.defer();
      params = {
        Bucket: this.params.s3Bucket
      };
      //Delimiter: 'production'
      //EncodingType: url
      //Marker: pDirectory
      //MaxKeys: 0
      //Prefix: 'STRING_VALUE'
      this.awsS3Client.listObjects(params, function(err, data) {
        var filteredContents;
        if (err) {
          console.log('listObjects err:', err.stack);
          return deferred.reject(err);
        } else {
          if (data.Contents) {
            filteredContents = data.Contents.filter(function(content) {
              return content.Key && content.Key.substr(0, pDirectory.length) === pDirectory;
            });
            return deferred.resolve(filteredContents);
          } else {
            return deferred.reject('Error: No Contents Array!');
          }
        }
      });
      return deferred.promise;
    }

  };

  S3App = new S3App();

}).call(this);
