# Amazon S3 + CDN project

## Presentation

This module updates paths in your distribution browser files (.html, .css, .js) to target a CDN domain then upload files to an Amaszon S3 bucket.

## Usage / Installation

### Install like a node_modules :

```sh
npm install amazon-s3-cdn --save
```

### To launch the script use :
`"s3cdn": "amazon-s3-cdn --config ../../s3-config.js"`

DON'T FORGET TO DEFINE YOUR "s3-config.js" FILE!!!

AND DEFINE YOUR AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_REGION, AWS_S3_BUCKET, etc.

## Submodules

### Pour installer en sous-module git dans votre dépôt principal :
`git submodule add https://github.com/Syldel/amazon-s3-cdn`

### Après avoir cloné le projet parent qui contient des sous-modules :
Le répertoire "amazon-s3-cdn" est présent mais vide. Vous devez exécuter deux commandes : `git submodule init` pour initialiser votre fichier local de configuration, et `git submodule update` pour tirer toutes les données de ce projet et récupérer le commit approprié tel que listé dans votre super-projet.

### submodules-install
Look to "submodules-install" to install submodule contents
https://github.com/kettek/submodules-install

### Heroku
Warning! Unfortunately Heroku doesn't manage submodules

### Help about submodules
https://git-scm.com/book/fr/v2/Utilitaires-Git-Sous-modules


## Qu'est-ce qu'Amazon CloudFront ?
Amazon CloudFront est un service web qui accélère la distribution de vos contenus web statiques et dynamiques, tels que des fichiers .html, .css, .js multimédias et image, à vos utilisateurs.
CloudFront diffuse votre contenu à travers un réseau mondial de centres de données appelés emplacements périphériques.
Lorsqu'un utilisateur demande le contenu que vous proposez avec CloudFront, il est dirigé vers l'emplacement périphérique qui fournit la latence la plus faible et, par conséquent, le contenu est remis avec les meilleures performances possibles.

- Si le contenu se trouve déjà dans l'emplacement périphérique avec la plus faible latence, CloudFront le remet immédiatement.

- Si le contenu ne se trouve pas à cet emplacement périphérique, CloudFront l'extrait d'une origine que vous avez définie — comme un compartiment Amazon S3, un canal MediaPackage ou un serveur HTTP (par exemple, un serveur web), et que vous avez identifiée comme étant la source de la version définitive de votre contenu.

### Example of Cloudfront domain :
domain: 'xxxxxxxxxxxxxx.cloudfront.net'

### CORS problems
Example of error:
"Access to font at 'https://xxxxxxxxxxxxxx.cloudfront.net/production/glyphicons-halflings-regular.xxxxxxxxxxxxxx.woff' from origin 'https://xxxxxxxxxxxxxx-web-app.herokuapp.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."

https://stackoverflow.com/questions/12358173/correct-s3-cloudfront-cors-configuration


In Amazon S3, go in "Permissions / Autorisations', then "CORS Configuration" and add :

```
<CORSConfiguration>
   <CORSRule>
     <AllowedOrigin>*</AllowedOrigin>
     <AllowedMethod>GET</AllowedMethod>
   </CORSRule>
</CORSConfiguration>
```

In your CloudFront distribution go to Behavior -> choose a behavior -> Edit
Enable "Options", then choose "Whitelist" and add :
- Origin
- Access-Control-Request-Headers
- Access-Control-Request-Method

You probably need to Invalid cloudfront cache after that.

### CloudFront gzip compression
https://docs.aws.amazon.com/fr_fr/AmazonCloudFront/latest/DeveloperGuide/ServingCompressedFiles.html#compressed-content-cloudfront

In your CloudFront distribution go to Behavior -> choose a behavior -> Edit
Set "Yes" to "Compresser automatiquement les objets"

### CloudFront Leverage browser caching
https://docs.aws.amazon.com/fr_fr/AmazonCloudFront/latest/DeveloperGuide/Expiration.html

### AWS SDK for JavaScript 
https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/
