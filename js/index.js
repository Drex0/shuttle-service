// Author: Pat
// Description: Get closest shuttle stop from geolocation and display time in min when next shuttle will arrive.
// Search TODO: items to fix a few things

let debug = 1; // 1 or 0 to display debug info in html
let counter = 0;
let x = document.getElementById("closestLocation");
let ct = document.getElementById("closestTime");
let hT = document.getElementById("headerTime");
let closest;
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
		let div = document.getElementById("x");
  	div.innerHTML = "Counter: " + counter++ +
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
	// If mon-th or on fri and between 7-5, fri till 1:30
	// TODO: more conditions
	var today = new Date();
	if(today.getDay() == 6 || today.getDay() == 0) {
		dayError("Shuttle doesn't run on the weekend.");
	} else {
		setInterval(doTheTime, 1000);
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
	for(var i=0; i < posts.length; i++) {
		// Get first item in posts[i].events array that is > minute
		var t = new Date();
		var d = new Date();
		var countdown;
		var found;
		var currentTime = d.getTime();
		h = d.getHours();
		m = d.getMinutes();
		found = getByValue(posts[i].events, m);
		
		// Check if found getByValue returned anything in the array. If it didn't then the time is in the next hour
		if(found){
			t.setMinutes(found, 0);
		}else{
			t.setHours(h+1, posts[i].events[0], 0);
		}		
		countdown = t.getTime();
		var deltaTime = Math.abs(countdown - currentTime);
		posts[i].countdown = deltaTime;		
	}
	// Display in HTML
	displayTime();
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

// Check if weekend on body load
document.body.onload =  function() {checkDay()};