# puppeteer-test

This repository is a proof of concept about how to use puppeteer for scrapping pages and navigating between them.

If you are about to use it, make sure you own the target website, as it could lead to an unwanted amount of requests to the target server.

## Note

`ts-node` isn't used because node parameters can't be passed through it yet, and are required to load the modules.

## Usage

`yarn install` : Installs the dependencies

`mkdir dist logs` : Creates the required folders

`yarn start` : Compiles the code and starts the application