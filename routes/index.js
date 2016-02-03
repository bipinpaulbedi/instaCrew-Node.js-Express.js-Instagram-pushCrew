var express = require('express');
var ig = require('instagram-node').instagram();
var request = require('request');
var router = express.Router();
var pcUserId = '';
var instaUserToStkId = '';
var recentMedia = '';

ig.use({
  client_id: 'XXXX', // replace with your Instagram client id
  client_secret: 'XXXX' // replace with your Instagram client secret
});


var redirect_uri = 'http://localhost:3000/Subscribe';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Insta Crew' });
});

// This is where you would initially send users to authorize 
router.get('/authorize_user', function(req, res) {
  res.redirect(ig.get_authorization_url(redirect_uri, { scope: ['basic+public_content+follower_list']}));
});
// This is your redirect URI 
router.get('/Subscribe', function(req, res) {
  ig.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("Authorization Failed");
    } else {      
    	ig.use({ access_token: result.access_token});    
    	res.render('Subscribe' , { token : result.access_token });
    }
  });
});

router.post('/Subscribe',function(req, res){
	console.log(req.body.pcUserId);
	pcUserId = req.body.pcUserId;
	ig.user_search(req.body.username,function(err, users, remaining, limit) { 
		instaUserToStkId = users[0].id;
		ig.user_media_recent(instaUserToStkId,function(err, medias, pagination, remaining, limit) {
			recentMedia = medias[0].id;
		});
	});		
	setInterval(function(){
		ig.user_media_recent(instaUserToStkId,function(err, medias, pagination, remaining, limit) {
			if(recentMedia != medias[0].id){
				recentMedia = medias[0].id;

				var options = {
				  url: 'https://pushcrew.com/api/v1/send/individual',
				  form: {
				  	title:'InstaCrew Alert',
				  	message:'Check out instagram your suprise is waiting !!!',
				  	url:'https://www.instagram.com/',
				  	subscriber_id:pcUserId
					},
				  headers: {
				    'Authorization': 'XXXX' // Replace with you push crew api key
				  }
				};
				request.post(options, function (error, response, body) {				 
					console.log(response);						    
				});
			}
		});
	}, 30000);
	res.send('Subscription in command.')
});

module.exports = router;
