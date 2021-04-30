# Fawcart application

The main objective of this application is to provide a common cart for different shopping websites like [Flipkart](https://www.flipkart.com), [Amazon](https://www.amazon.in), [Wallmart](https://www.walmart.com/) etc.


## Setup/Install
1. __Fork__ - fork to create a copy of this repo to your own account. (skip fork, if you don't intent to contribute)
2. __clone__ - run `git clone` to download repo to your own pc.
3. __Install mongoDB__ - download and install [MongoDB](https://www.mongodb.com/try/download/community). Check if added to path.
4. __Install nodeJS__ - download and install [nodeJS](https://nodejs.org/en/download/). Check if npm is added to path.
5. __Install packages__ - run `npm install` to install all project dependencies.
6. __Time to run__ -
    - __start mongoDB instance__ - run `mongo` in terminal.
    - __start nodejs process__ - run `node app.js` in another terminal.
    - __run in browser__ - open browser and type url `localhost:80`. This website will also be hosted on internet by _ngrok_ and url will be logged in console. In case default port 80 is not available, change port in the `config.env` file.


## Working
#### Adding products
The user first visits the original website, opens up the product, and copy-paste its url into out app. Our app then uses **web-scraping** to add the product with its attributes like title, price, instock/outstock etc. This web-scraping is not compulsary ofcourse, means you can also add the product by manually entering the attributes.

#### Viewing products
Products are arranged in tabular format using bootstrap-dataTable.

#### Updating products
One click on the "update" button and the app visits all the product's url, scrap their attributes and show the updated info on the dashboard, like how many and which products have price change, or gone out of stock.


## Technology used
- [mongoDB](https://docs.mongodb.com/guides)
- [mongoose](https://mongoosejs.com/docs)
- [bootstrap](https://getbootstrap.com/docs)	
- [javascript](https://javascript.info)
- [jquery](https://learn.jquery.com)
- [nodejs](https://nodejs.org/en/docs/guides)
- [express](https://expressjs.com)
- [puppeteer](https://pptr.dev)
- [cheerio](https://github.com/cheeriojs/cheerio)
- [ejs](https://ejs.co)
- [connect-flash](https://github.com/jaredhanson/connect-flash)


## future work
- Extending Web-scraping feature for all shoping websites. For now it only works for amazon & flipkart.
- Adding authentication, login/signup functionality.
- Adding more products-caparision techniques.
