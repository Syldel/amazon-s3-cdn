AWS = require 'aws-sdk'
fs = require 'fs'
q = require 'q'
find = require 'find'
path = require 'path'
cdnizerFactory = require 'cdnizer'
mime = require 'mime'

module.exports = class S3App

  constructor: ->
    console.log 'Start S3/CDN processus!  NODE_ENV:', process.env.NODE_ENV

    args = process.argv.slice 2
    if args[0] is '--config' and args[1]

      @params = require args[1]

      @cdnizerProcessus().then () =>
        console.log 'Cdnizer processus COMPLETE'
        @s3Processus()
      , (err) ->
        console.log err

    else
      console.log 'Configuration error (Don\'t forget to add --config arg)'


  cdnizerProcessus: () ->
    deferred = q.defer()

    if @params.cdnDomain
      @getFilesByExtensionsSequence @params.fileExtensions
      .then (files) =>
        filenames = files.map (f) =>
          @getFilename f
        @initCdnizer filenames

        @getFilesByExtensionsSequence ['html', 'js', 'css']
        .then (tFiles) =>
          for file in tFiles
            contents = fs.readFileSync file, 'utf8'
            newContents = @cdnizer contents
            fs.writeFileSync file, newContents

          deferred.resolve()
        , (err) ->
          deferred.reject err
      , (err) ->
        deferred.reject err
    else
      deferred.reject 'Error! No CDN domain defined!'

    deferred.promise


  initCdnizer: (pFiles) ->
    @cdnizer = cdnizerFactory
      defaultCDNBase: @params.cdnDomain + '/' + @params.subDir
      allowRev: yes
      allowMin: yes
      files: pFiles


  getFilesByExtensionsSequence: (pExtensions, pIndex = 0) ->
    deferred = q.defer()

    if pIndex > pExtensions.length - 1
      deferred.resolve []
    else
      console.log '\nFind local ' + pExtensions[pIndex] + ' files'
      @findFilesByExtension pExtensions[pIndex], @params.localDir
      .then (filesA) =>
        @getFilesByExtensionsSequence pExtensions, pIndex + 1
        .then (filesB) ->
          filesC = filesA.concat filesB
          deferred.resolve filesC
        , (err) ->
          deferred.reject err

      , (err) ->
        console.log ' @findFilesByExtension err:', err
        deferred.reject err

    deferred.promise


  findFilesByExtension: (pExtension, pLocalDir) ->
    deferred = q.defer()

    find.file new RegExp('\\.' + pExtension + '$'), pLocalDir, (files) ->
      console.log ' ->', pExtension, 'files:', files
      deferred.resolve files

    deferred.promise


  s3Processus: () ->
    console.log '\nInit S3 client'
    @awsS3Client = new AWS.S3 @params.s3Options

    console.log 'Delete S3 subdirectory ' + @params.subDir + '/'
    @listS3BucketObject(@params.subDir + '/').then (contents) =>
      contents = contents.map (object) ->
        object =
          Key: object.Key
      @deleteFiles(contents).then (deleted) =>
        console.log 'deleted:', deleted

        @extensionsUploadSequence @params.fileExtensions
        .then () ->
          console.log '\nUpload COMPLETE'


  extensionsUploadSequence: (pExtensions, pIndex = 0) ->
    deferred = q.defer()

    if pIndex > pExtensions.length - 1
      deferred.resolve()
    else
      console.log '\nFind local ' + pExtensions[pIndex] + ' files'
      @findFilesByExtension pExtensions[pIndex], @params.localDir
      .then (files) =>
        @uploadSequence(files).then () =>
          @extensionsUploadSequence pExtensions, pIndex + 1
          .then () ->
            deferred.resolve()
          , (err) ->
            deferred.reject err

      , (err) ->
        console.log ' @findFilesByExtension err:', err
        deferred.reject err

    deferred.promise


  uploadSequence: (pArray, pIndex = 0) ->
    deferred = q.defer()

    if pIndex > pArray.length - 1
      deferred.resolve()
    else
      @uploadFile pArray[pIndex]
      .then (etag) =>
        console.log ' etag:', etag
        @uploadSequence pArray, pIndex + 1
        .then () ->
          deferred.resolve()
        , (err) ->
          deferred.reject err

      , (err) ->
        console.log ' @uploadFile err:', err
        deferred.reject err

    deferred.promise


  getFilename: (pPath) ->
    # Just keep the filename with extension of the path!
    normalizedLocalDir = path.normalize @params.localDir

    fileNameWithExt = path.normalize(pPath).replace normalizedLocalDir, ''
    if fileNameWithExt.substr(0, 1) is '/' or fileNameWithExt.substr(0, 1) is '\\'
      fileNameWithExt = fileNameWithExt.substring 1

    fileNameWithExt = fileNameWithExt.replace /\\/gi, '\/'

    fileNameWithExt


  uploadFile: (pPath) ->
    deferred = q.defer()

    fileNameWithExt = @getFilename pPath
    console.log 'uploadFile', @params.subDir + '/' + fileNameWithExt + ' (' + mime.getType(pPath) + ')'

    if @params.subDir and @params.s3Bucket
      fs.readFile pPath, (err, fileData) =>
        params =
          ACL: 'public-read'
          Key: @params.subDir + '/' + fileNameWithExt
          Body: fileData
          ContentType: mime.getType(pPath)
          Bucket: @params.s3Bucket
          #Tagging: (For example, "Key1=Value1")

        @awsS3Client.putObject params, (error, data) ->
          if error
            console.log 'putObject error:', error
            deferred.reject error
          else
            deferred.resolve data.ETag
    else
      deferred.reject 'Bad params!'

    deferred.promise


  deleteFiles: (pObjectKeys) ->
    deferred = q.defer()

    if pObjectKeys.length is 0
      deferred.resolve []
    else
      params =
        Bucket: @params.s3Bucket
        Delete:
          Objects: pObjectKeys
          Quiet: no

      @awsS3Client.deleteObjects params, (err, data) ->
        if err
          console.log 'deleteObjects err:', err
          deferred.reject err
        else
          deferred.resolve data.Deleted

    deferred.promise


  listS3BucketObject: (pDirectory) ->
    deferred = q.defer()

    params =
      Bucket: @params.s3Bucket
      #Delimiter: 'production'
      #EncodingType: url
      #Marker: pDirectory
      #MaxKeys: 0
      #Prefix: 'STRING_VALUE'

    @awsS3Client.listObjects params, (err, data) ->
      if err
        console.log 'listObjects err:', err.stack
        deferred.reject err
      else
        if data.Contents
          filteredContents = data.Contents.filter (content) ->
            content.Key and content.Key.substr(0, pDirectory.length) is pDirectory

          deferred.resolve filteredContents
        else
          deferred.reject 'Error: No Contents Array!'

    deferred.promise


S3App = new S3App()