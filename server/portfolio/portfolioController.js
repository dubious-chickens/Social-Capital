// handles functions for dashboard display, stock purchases, and stock sales from the portfolio db
// MVP will have option to buy a stock once, but can sell on multiple dates

var Portfolio = require('./PortfolioModel.js');
var Q = require('q');
var twitter = require("../external/twitter.js")

module.exports = {
  displayAllStocks: function(req, res, next){
    console.log("display all stocks being called!");
    console.log("req.session.passport LOOKS LIKE: ", req.session.passport)

    // req.session.passport = {}; //REMOVE THIS LATER
    // req.session.passport.user = {};
    // req.session.passport.user._id = 3;
    // req.session.passport.user.screen_name = 'obscyuriy3';
    // req.session.passport.user.displayname = 'yuriy 3 bash';

    if(!req.session.passport){
      console.log("You are not signed in!");
    } else {

    var userObj = req.session.passport.user; // to be changed
    var create, newPortfolio;

    var findPortfolio = Q.nbind(Portfolio.findOne, Portfolio);
    findPortfolio({user_id: userObj._id})
      .then(function(portfolio){
        if(!portfolio){
          create = Q.nbind(Portfolio.create, Portfolio);
          newPortfolio = {
            user_id     : req.session.passport.user._id, // check passport authentication
            cash_balance: 10000,
            stocks: []
          }
          create(newPortfolio);

          newPortfolio['user_twitter_handle'] = req.session.passport.user.screen_name;
          newPortfolio['name'] = req.session.passport.user.displayname;

          res.json(newPortfolio);

        } else {
          portfolio['user_twitter_handle'] = req.session.passport.user.screen_name;
          portfolio['name'] = req.session.passport.user.displayname;

          if(portfolio.stocks.length > 0){
            var twitterHandleArray = [];

            for(var i = 0; i < portfolio.stocks.length; i++){
              var twitterRequest = portfolio.stocks[i].screen_name.slice(1);
              twitterHandleArray.push(twitterRequest);
            }

            console.log("twitterHandleArray", twitterHandleArray);

            var twitterHandleString = twitterHandleArray.join(",")

            twitter.getUserInfoHelper(twitterHandleString, function(followersCount){
              //followersCount = [51255152, 2141241]

              console.log("followersCount", followersCount)
              for(var i = 0; i < followersCount.length; i++){

                  for(var j = 0; j < portfolio.stocks.length; j++){


                    console.log("portfolio.stocks[j]:", portfolio.stocks[j]);
                    console.log("followersCount[i]", followersCount[i])

                      console.log("portfolio.stocks[j][current_follower_count] before", portfolio.stocks[j]["current_follower_count"])
                      portfolio.stocks[j]["current_follower_count"] = followersCount[i];
                      console.log("portfolio.stocks[j][current_follower_count] after", portfolio.stocks[j]["current_follower_count"])

                  }

              }
              console.log("portfolio right before it sends:" + portfolio)
              res.json(portfolio);

            })


          }



            // console.log("twitterRequest", twitterRequest);
            // var currentNumFollowers = twitter.getUserInfoHelper(twitterRequest, function(twitterUserData["follower_count_at_query_time"]){
            //   // console.log("currentNumFollowers", currentNumFollowers)
            //   var previousFollowers = portfolio.stocks[i].follower_count_at_purchase;
            //   var numDays = Math.abs(new Date() - portfolio.stocks[i].date_of_purchase)/(1000*60*60*24);
            //   var growthRate = Math.pow((currentNumFollowers-previousFollowers)/previousFollowers, 1/numDays) - 1;
            //   var growthRateVsExpected = (growthRate - .0007)/.0007;
            //   portfolio.stocks[i]["newPrice"] = (1+growthRateVsExpected) * portfolio.stocks[i].price_at_purchase;




          }

          // res.json(portfolio);

      })
      .fail(function(error){
        console.log('error', error);
      });
    }
  },

  buy: function(req, res, next){
    // req.session.passport = {}; //REMOVE THIS LATER
    // req.session.passport.user = {};
    // req.session.passport.user._id = 3;
    // req.session.passport.user.screen_name = 'obscyuriy3';
    // req.session.passport.user.displayname = 'yuriy 3 bash';

    var userObj = req.session.passport.user;
    console.log("inside buy function");
    // req.body should have:
    // {
    //     "screen_name": "@LadyGaga",
    //     "name": "Lady Gaga ga",
    //     "follower_count_at_purchase": 12000000,
    //     "price_at_purchase": 12,
    //     "date_of_purchase": "Tue May 05 2015 14:11:43 GMT-0700 (PDT)",
    //     "shares": 100
    // }

    var findPortfolio = Q.nbind(Portfolio.findOne, Portfolio);

    findPortfolio({user_id: userObj._id})
      .then(function(portfolio){
        portfolio.cash_balance = portfolio.cash_balance - (req.body.shares * req.body.price_at_purchase);
        portfolio.stocks.push(req.body);

        portfolio.save(function(err){
          if(err){
            console.log('Error!');
          }
        });

        portfolio['user_twitter_handle'] = req.session.passport.user.screen_name;
        portfolio['name'] = req.session.passport.user.displayname;

        res.json(portfolio);
      })
      .fail(function(error){
        console.log(error);
      });
  },
  sell: function(req, res, next){
    // req.session.passport = {}; //REMOVE THIS LATER
    // req.session.passport.user = {};
    // req.session.passport.user._id = 3;
    // req.session.passport.user.screen_name = 'obscyuriy3';
    // req.session.passport.user.displayname = 'yuriy 3 bash';

    var userObj = req.session.passport.user;

    console.log('req.body: ', req.body);
    // at purchase:
    // {
    //     "screen_name": "@LadyGaga",
    //     "name": "Lady Gaga ga",
    //     "follower_count_at_purchase": 12000000,
    //     "price_at_purchase": 12,
    //     "date_of_purchase": "Tue May 05 2015 14:11:43 GMT-0700 (PDT)",
    //     "shares": 100
    // }
    //
    //     at sale:
    // {
    //     "screen_name": "@LadyGaga",
    //     "name": "Lady Gaga ga",
    //     "current_follower_count": 15000000, // front end user input
    //     "current_date": "Tue May 05 2015 14:11:43 GMT-0700 (PDT)",
    //     "current_price": 15,
    //     "shares": 100 // front user input
    // }

    var findPortfolio = Q.nbind(Portfolio.findOne, Portfolio);

    findPortfolio({user_id: userObj._id})
      .then(function(portfolio){
        portfolio.cash_balance = portfolio.cash_balance + (req.body.shares * req.body.current_price);

        for(var i = portfolio.stocks.length - 1; i >= 0; i--){
          if(portfolio.stocks[i].screen_name === req.body.screen_name){
            if(portfolio.stocks[i].shares > req.body.shares){
              console.log("i:", i)
                portfolio.stocks[i].shares = portfolio.stocks[i].shares - req.body.shares;
            }
             else {
              portfolio.stocks.splice(i, 1);
            }
          }
        }

        console.log("portfolio.stocks[1].shares outside for loop: ", portfolio.stocks[1])
        console.log("new portfolio right before sale: ", portfolio);

        portfolio['user_twitter_handle'] = req.session.passport.user.screen_name;
        portfolio['name'] = req.session.passport.user.displayname;

        portfolio.save(function(err){
          if(err){
            console.log('Error!');
          }
        res.json(portfolio);
        });

        console.log("new portfolio right after sale: ", portfolio);


      })
      .fail(function(error){
        console.log(error);
      });
  }
}


