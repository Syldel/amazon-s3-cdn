# Amazon S3 project

## Usage / Installation

### Pour installer un sous-module git dans votre dépôt principal :
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

## Example of Cloudfront domain :
domain: 'd2lftwi5onds8f.cloudfront.net'

## AWS SDK for JavaScript 
https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/
