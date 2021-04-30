const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

//requiring product model
let Product = require('../models/product');

let browser;

//Scrape Functions
async function scrapeData(url, page) {
    if(url.includes('amazon'))
        return scrapeData_amazon(url,page);
    else if(url.includes('flipkart'))
        return scrapeData_flipkart(url,page);
    else if(url.includes('walmart'))
        return scrapeData_walmart(url,page);
    else return new Promise(res=>res({error_msg : 'No webscrap-support for this website yet.'}));
}
    
async function scrapeData_walmart(url, page) {
    try {
        // wallmart scrapper
        await page.goto(url, {waitUntil: 'load', timeout : 0});
        const html = await page.evaluate(()=> document.body.innerHTML);
        const $ = await cheerio.load(html);

        let title = $("h1").text().trim();
        let price = $(".price-characteristic").attr("content");

        if(title.toLowerCase().includes('verify your identity'))
            return {error_msg : 'Sorry, CAPTCHA found while scrapping :('};

        if(!price) {
            let dollars = $("#price > div > span.hide-content.display-inline-block-m > span > span.price-group.price-out-of-stock > span.price-characteristic").text();
            let cents = $("#price > div > span.hide-content.display-inline-block-m > span > span.price-group.price-out-of-stock > span.price-mantissa").text();
            price = dollars+'.'+cents;
        }
        price='$'+price;

        let seller = '';
        let checkSeller = $('.seller-name');
        if(checkSeller) {
            seller = checkSeller.text();
        }

        let outOfStock = '';
        let checkOutOfStock = $('.prod-ProductOffer-oosMsg');
        if(checkOutOfStock) {
            outOfStock = checkOutOfStock.text();
        }

        let deliveryNotAvaiable = '';
        let checkDeliveryNotAvailable = $('.fulfillment-shipping-text');
        if(checkDeliveryNotAvailable) {
            deliveryNotAvaiable = checkDeliveryNotAvailable.text();
        }

        let stock = '';

        if(!(seller.includes('Walmart')) || outOfStock.includes('Out of Stock') || 
            deliveryNotAvaiable.includes('Delivery not available')) {
                stock = 'Out of stock';
            } else {
                stock = 'In stock';
            }

        return {
            title,
            price,
            stock,
            url,
            company:'Walmart'
        }

    } catch (error) {
        console.log(error);
    }
}

async function scrapeData_amazon(url, page) {
    try {
        await page.goto(url, {waitUntil: 'load', timeout : 0});
        const html = await page.evaluate(()=> document.body.innerHTML);
        const $ = await cheerio.load(html);

        let title = $("#productTitle").text().trim();
        if(title.toLowerCase().includes('verify your identity'))
            return {};
        
        let price = ($("#priceblock_ourprice").length?$("#priceblock_ourprice"):
                    $('#priceblock_dealprice').length?$('#priceblock_dealprice'):
                    $('#soldByThirdParty').length?$('#soldByThirdParty'):'0')
                    .text().trim();
        let stock = $("#availability").text().trim().startsWith('I')==false?"Out of stock":"In stock";

        return {
            title,
            price,
            stock,
            url,
            company:'Amazon'
        }

    } catch (error) {
        console.log(error);
    }
}

async function scrapeData_flipkart(url, page) {
    try {
        await page.goto(url, {waitUntil: 'load', timeout : 0});
        const html = await page.evaluate(()=> document.body.innerHTML);
        const $ = await cheerio.load(html);

        let title = $(".B_NuCI").text().trim();
        if(title.toLowerCase().includes('verify your identity'))
            return {error_msg : 'Sorry, CAPTCHA found while scrapping :('};
        
        let price = $(".CEmiEU ._30jeq3").length?$(".CEmiEU ._30jeq3").text().trim():'0';
        price=price.replace(',','').replace(',','');
        let stock = ($("._16FRp0").length || $("._1dVbu9").length) ?"Out of stock":"In stock";

        return {
            title,
            price,
            stock,
            url,
            company:'Flipkart'
        }

    } catch (error) {
        console.log(error);
    }
}

//GET routes starts here

router.get('/', (req,res)=> {

    Product.find({})
        .then(products => {
            res.render('./admin/dashboard', {products : products});
    });
    
});
router.get('/dashboard', (req,res)=> {

    Product.find({})
        .then(products => {
            res.render('./admin/dashboard', {products : products});
    });
    
});

router.get('/product/new', async (req, res)=> {
    try {
        let url = req.query.search;
        if(url) {
            browser = await puppeteer.launch({ args: ['--no-sandbox'], headless:true });
            const page = await browser.newPage();
            let result = await scrapeData(url,page);

            if(!result || result.error_msg){
                req.flash('error_msg', result? result.error_msg:'Unknown error');
                return res.redirect('/product/new');
            }
            if(!result.stock) result.stock='Out of stock';
            if(result.price.startsWith('$'))
            result.price = +result.price.substr(1).trim() * 75.14;
            else if(result.price.startsWith('₹'))
            result.price = +result.price.substr(1).trim();
            else result.price=+result.price;
            
            let productData = {
                title : result.title,
                price : result.price,
                stock : result.stock,
                productUrl : result.url,
                company : result.company
            };
            // console.dir(productData);
            res.render('./admin/newproduct', {productData : productData});
            browser.close();
        } else {
            let productData = {
                title : "",
                price : "",
                stock : "",
                productUrl : ""
            };
            res.render('./admin/newproduct', {productData : productData});
        }
    } catch (error) {
        req.flash('error_msg', error);
        res.redirect('/product/new');
    }
});

router.get('/product/search', (req,res)=> {
    let userSku = req.query.sku;
    if(userSku) {
        Product.findOne({sku : userSku})
            .then(product => {
                if(!product) {
                    req.flash('error_msg', 'Product does not exist in the database.');
                    return res.redirect('/product/search');
                }

                res.render('./admin/search', {productData : product});
            })
            .catch(err => {
                req.flash('error_msg', 'ERROR: '+err);
                res.redirect('/product/new');
            });
    } else {
        res.render('./admin/search', {productData : ''});
    }
});

router.get('/products/instock', (req,res)=> {
    Product.find({newstock : "In stock"})
        .then(products => {
            res.render('./admin/instock', {products : products});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/dashboard');
        });
});

router.get('/products/outofstock', (req,res)=> {
    Product.find({newstock : "Out of stock"})
        .then(products => {
            res.render('./admin/outofstock', {products : products});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/dashboard');
        });
});

router.get('/products/pricechanged', (req,res)=> {
    Product.find({})
        .then(products => {
            res.render('./admin/pricechanged', {products : products});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/dashboard');
        });
});

router.get('/products/backinstock', (req,res)=> {
    Product.find({$and: [{oldstock : 'Out of stock'},{newstock : 'In stock'}]})
        .then(products => {
            res.render('./admin/backinstock', {products : products});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/dashboard');
        });
});

router.get('/products/updated', (req,res)=> {
    Product.find({updatestatus : "Updated"})
        .then(products => {
            res.render('./admin/updatedproducts', {products : products});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/dashboard');
        });
});


router.get('/products/notupdated', (req,res)=> {
    Product.find({updatestatus : "Not Updated"})
        .then(products => {
            res.render('./admin/notupdatedproducts', {products : products});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/dashboard');
        });
});

router.get('/update', (req,res)=> {
    res.render('./admin/update', {message : ''});
});

//POST routes starts here

router.post('/product/new', (req,res)=> {
    let {title, price, stock, url, sku, company} = req.body;

    let newProduct = {
        title : title,
        newprice : price,
        oldprice : price,
        newstock : stock,
        oldstock : stock,
        sku : sku,
        company : company,
        url : url,
        updatestatus : "Updated"
    };

    Product.findOne({ sku : sku})
        .then(product => {
            if(product) {
                req.flash('error_msg', 'Product already exist in the database.');
                return res.redirect('/product/new');
            }

            Product.create(newProduct)
                .then(product => {
                    req.flash('success_msg', 'Product added successfully in the database.');
                    res.redirect('/product/new');
                })
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/product/new');
        });
});

router.post('/update', async(req, res)=>{
    try {
        // res.render('./admin/update', {message: 'update started.'});
        console.log('Starting update..')

        let products = await Product.find({});
        browser = await puppeteer.launch({ args: ['--no-sandbox'], headless:false });
        const page = await browser.newPage();

        let prom_array = [], cnt=0;
        for(let i=0; i<products.length; i++) {
            prom_array.push(
                browser.newPage().then(page=>
                    scrapeData(products[i].url,page))
                .then(result=>{
                    if(!result || result.error_msg)
                        throw result? result.error_msg : 'Unknown error';
                    
                    if(!result.stock) result.stock='Out of stock';
                    if(result.price.startsWith('$'))
                    result.price = +result.price.substr(1).trim() * 75.14;
                    else if(result.price.startsWith('₹'))
                    result.price = +result.price.substr(1).trim();
                    else result.price=+result.price;
                    
                    let oldp = products[i].newprice, olds = products[i].newstock;
                    return Product.updateOne({'url' : products[i].url}, {$set: {
                        'oldprice' : oldp, 
                        'oldstock' : olds, 
                        'newprice' : result.price, 
                        'newstock' : result.stock, 
                        'updatestatus' : 'Updated'
                    }})
                }).catch(e=>
                    Product.updateOne({'url' : products[i].url}, {$set: {'updatestatus' : 'Not Updated'}})
                ).finally(()=>{
                    ++cnt;
                    console.log('   ' + cnt + ' pages settled');
                })
            )
        }

        // waiting for all pages.
        await Promise.allSettled(prom_array);

        browser.close();
        console.log('Updated! Closing browser');
        req.flash('success_msg', 'Products are updated successfully.');
        res.redirect('/dashboard');
        
    } catch (error) {
        req.flash('error_msg', 'ERROR: '+error);
        res.redirect('/dashboard');
    }
});

//DELETE routes starts here
router.delete('/delete/product/:id', (req, res)=> {
    let searchQuery = {_id : req.params.id};

    Product.deleteOne(searchQuery)
        .then(product => {
            req.flash('success_msg', 'Product deleted successfully.');
            res.redirect('/dashboard');
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/dashboard');
        });
});

router.get('*', (req, res)=> {
    res.render('./admin/notfound');
});

module.exports = router;