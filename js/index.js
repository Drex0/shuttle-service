// Author: Pat
// Description: Get closest shuttle stop from geolocation and display time in min when next shuttle will arrive.
// Search TODO: items to fix a few things

let debug = 1; // 1 or 0 to display debug info in html
let counter = 0;
let x = document.getElementById("closestLocation");
let ct = document.getElementById("closestTime");
let hT = document.getElementById("headerTime");
let closest;
let timer;
// start and end times [Hour,Minute] format.
let startTime 	= [6,29];
let endTime 	= [17,29];
let endTimeFri 	= [13,29];

// delta			= compare current position to post position
// countdown	= the time until next shuttle arrives 15min or less
// events			= represent the minutes every hour that the shuttle stops at that post
var posts = [
	{ post:'A - West', lat:40.790127, lon:-111.952834, delta:0, countdown:0, events:[11,26,41,56]},
	{ post:'F - East', lat:40.782786, lon:-111.951483, delta:0, countdown:0, events:[0,15,30,45]},
	{ post:'X - West', lat:40.780959, lon:-111.951195, delta:0, countdown:0, events:[1,16,31,46]},
	{ post:'Post 4', lat:40.779283, lon:-111.951340, delta:0, countdown:0, events:[2,17,32,47]},
	{ post:'D - West', lat:40.775975, lon:-111.951003, delta:0, countdown:0, events:[4,19,34,49]},
	{ post:'C - West', lat:40.778516, lon:-111.953135, delta:0, countdown:0, events:[6,21,36,51]},
	{ post:'F - West', lat:40.783623, lon:-111.953091, delta:0, countdown:0, events:[8,23,38,53]}
];

//Short dates format "MM/DD/YYYY"
var holidays = [
	"11/22/2018",
	"12/24/2018",
	"12/25/2018",
	"12/26/2018",	
	"12/27/2018",
];

var firstOffFridayStart = "01/12/2018";

// Tracking users position
let watchId = navigator.geolocation.watchPosition(
  processGeolocation,
  // Optional settings below
  geolocationError, {
    timeout: 60000,
    enableHighAccuracy: true,
    maximumAge: 0
  }
);

// If there is an error getting geo location alert user
function geolocationError(err){
  //alert(err.message)
	UIkit.notification({
    message: err.message,
    status: 'danger',
    pos: 'bottom-center',
    timeout: 5000
	});
};

// Nights and weekends error / no shuttle runs
function dayError(mess){
	UIkit.notification({
		message: mess,
		status: 'danger',
		pos: 'bottom-center',
		timeout: 0
	});
}

function processGeolocation(position) {
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
  var accuracy = position.coords.accuracy;
	var i;
	var distanceArray = [];
	
	if(debug) {
		let div = document.getElementById("debug");
  	div.innerHTML = `<h5 class="uk-margin-remove-bottom">GPS Debug Info:</h5>` + "<br>Counter: " + counter++ +
    "<br>Latitude: " + latitude +
    "<br>Longitude: " + longitude +
    "<br>Accuracy: " + accuracy;
	} 
	for (i = 0; i < posts.length; i++) { 
		posts[i].delta = distance(latitude, longitude, posts[i].lat,posts[i].lon);
	}
	
	// Find smallest delta value and write post name to div
	closest = Object.keys(posts).reduce((a, b) => posts[a].delta < posts[b].delta ? a : b);
	x.innerHTML = posts[closest].post;
}

// Get the distance as the crow flies between long/lat coordinates, but also include the radius of the earth becuase that is just cool.
function distance(lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

/*****************TIMESTUFF*******************/

// Check if shuttle runs on that day/time
function checkDay() {
	// If mon-th or on fri	
	var today = new Date();
	var tDay = today.getDay();
	switch(tDay) {
		case 6:
		case 0:
			dayError("Shuttle is not currently running.");
			break;
		/*
		case 5:
			if(checkFriday()){
				setInterval(doTheTime,1000);
			}
			else dayError("Shuttle is not currently running.");
			break;
		*/
		default:
			timer = setInterval(doTheTime, 1000);
			break;
	}
}

// Check if it is a working friday
function checkFriday() {
	
}

// Check if h:m is in the range of a:b-c:d
// Does not support over-night checking like 23:00-1:00am
function checkTime (h,m,a,b,c,d){
	if (a > c || ((a == c) && (b > d))) {
	  // not a valid input
	} 
	else {
	   if (h > a && h < c) {
	        return true;
	   } else if (h == a && m >= b) {
	       return true;  
	   } else if (h == c && m <= d) {
	       return true;
	   } else {
	        return false;
	   }
	}
}

// Used to get first value that is > minute in posts[].events array otherwise return undefined
function getByValue(arr, value) {	
	var test;
  for (var i=0, len=arr.length; i < len; i++) {		
    test = arr.find(function(element) {
			return element > value;
		});
  }
	return test;
}

// Get next shuttle stop time and compare to current time to get countdown
function doTheTime() {
	var h;
	var m;	
	var today = new Date();
	var tDay = today.getDay();
	var tHours = today.getHours();
	var tMinutes = today.getMinutes();
	isTime = checkTime(tHours,tMinutes,startTime[0],startTime[1],endTime[0],endTime[1]);
	isFriTime = checkTime(tHours,tMinutes,startTime[0],startTime[1],endTimeFri[0],endTimeFri[1]);

	if(isTime){
		for(var i=0; i < posts.length; i++) {
			// Get first item in posts[i].events array that is > minute
			var t = new Date();
			var d = new Date();
			var count;
			var currentTime = d.getTime();
			var found;
			h = d.getHours();
			m = d.getMinutes();
			found = getByValue(posts[i].events, m);
			
			// Check if found getByValue returned anything in the array. If it didn't then the time is in the next hour
			if(found){
				t.setMinutes(found, 0);
			}else{
				t.setHours(h+1, posts[i].events[0], 0);
			}	
			count = t.getTime();	
			var deltaTime = Math.abs(count - currentTime);
			posts[i].countdown = deltaTime;		
		}
		// Display in HTML
		displayTime();
	}
	else {		
		clearDivs();
		dayError("Shuttle is not currenlty running.");
		clearInterval(timer);
	}	
}

// Convert milliseconds to mm:ss
function msToTime(duration) {
	var seconds = parseInt((duration / 1000) % 60),
		minutes = parseInt((duration / (1000 * 60)) % 60)

 	seconds = (seconds < 10) ? "0" + seconds : seconds;

  return minutes + ":" + seconds;
}

function displayTime() {
	// Display all times relative to their array position
	// TODO: This needs an update to set the name of the stop from the object as well as the time instead of fixed array position.
	for(var i=0;i<posts.length;i++) {
		var p = posts[i].post;
		document.getElementById(p).innerHTML = msToTime(posts[i].countdown)+" min";
	}	
	// Display closest time in card body
	ct.innerHTML = msToTime(posts[closest].countdown)+" min";
	
	// If time is <3min display red background
	if(posts[closest].countdown<180000){
		document.getElementById("card").className = "uk-card-body dangerbg";
	}
	else{
		document.getElementById("card").className = "uk-card-body uk-background-primary";
	}
}

function clearDivs() {
	for(var i=0;i<posts.length;i++) {
		var p = posts[i].post;
		document.getElementById(p).innerHTML = "-- min";
	}	
	// Clear closest time in card body
	ct.innerHTML = "-- min";
}

// Check if weekend on body load
document.body.onload =  function() {checkDay()};