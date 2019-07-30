// Author: Pat
// Description: Get closest shuttle stop from geolocation and display time in min when next shuttle will arrive.
// Search TODO: items to fix a few things

let debug = 0; // 1 or 0 to display debug info in html
let counter = 0;
let closestLocation = document.getElementById("closestLocation");
let closestTime = document.getElementById("closestTime");
let closest;
let timer;
// Start and end times [Hour,Minute] format.
let startTime 	= [6,29];
let endTime 	= [17,29];
let endTimeFri 	= [13,29];
// Shuttle running flag
var flag = true;
// First off friday of the year.
let firstOffFridayStart = new Date("01/11/2019");

// delta			= compare current position to post position
// countdown	= the time until next shuttle arrives 15min or less
// events			= represent the minutes every hour that the shuttle stops at that post
var shuttle;
var posts = [
	{ post:'Command', lat:40.782786, lon:-111.951483, delta:0, countdown:0, events:[10,30,50]},
	{ post:'X - West', lat:40.780959, lon:-111.951195, delta:0, countdown:0, events:[12,32,52]},
	{ post:'Post 4', lat: 40.779283, lon: -111.951340, delta: 0, countdown: 0, events: [14,34,54]},
	{ post:'Overflow', lat: 40.777441, lon: -111.951261, delta: 0, countdown: 0, events: [16,36,56]},	
	{ post:'D - West', lat:40.776629, lon:-111.952800, delta:0, countdown:0, events:[18,38,58]},
	{ post:'C - West', lat:40.778516, lon:-111.953135, delta:0, countdown:0, events:[0,20,40]},
	{ post:'E - North', lat:40.784427, lon:-111.952199, delta:0, countdown:0, events:[3,23,43]},
	{ post: 'A - West', lat: 40.790127, lon: -111.952834, delta: 0, countdown: 0, events: [7, 27, 47] }
];

// second shuttle starts running at 8AM
var extraTimes = [
	{ post: 'Command', events: [0, 20, 40] },
	{ post: 'X - West', events: [2, 22, 42] },
	{ post: 'Post 4', events: [4, 24, 44] },
	{ post: 'Overflow', events: [6, 26, 46] },
	{ post: 'D - West', events: [8, 28, 48] },
	{ post: 'C - West', events: [10, 30, 50] },
	{ post: 'E - North', events: [13, 33, 53] },
	{ post: 'A - West', events: [17, 37, 57] }
];

// Short dates format "MM/DD/YYYY"
var holidays = [
	"5/27//2019",
	"7/4/2019",
	"9/2/2019",
	"11/28/2109",	 
	"12/23/2019",
	"12/24/2019",
	"12/25/2019",
	"12/26/2019"
];

/*****************MESSAGESTUFF*******************/

// If there is an error getting geo location alert user
function geolocationError(err) {
	//alert(err.message)
	UIkit.notification({
		message: err.message,
		status: 'danger',
		pos: 'bottom-center',
		timeout: 5000
	});
};

// Nights and weekends error / no shuttle runs
function dayError(mess) {
	UIkit.notification({
		message: mess,
		status: 'danger',
		pos: 'bottom-center',
		timeout: 10000
	});
};

/*****************GEOSTUFF*******************/

function mapSetup() {
	// Add Post markers to map
	var infowindow = new google.maps.InfoWindow();
	var marker, l;

	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: 40.782547, lng: -111.9531173 },
		zoom: 15
	});
	for (l = 0; l < posts.length; l++) {
		marker = new google.maps.Marker({
			position: new google.maps.LatLng(posts[l].lat, posts[l].lon),
			map: map
		});

		google.maps.event.addListener(marker, 'click', (function (marker, l) {
			return function () {
				infowindow.setContent(posts[l].post);
				infowindow.open(map, marker);
			}
		})(marker, l));
	}
}

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

function processGeolocation(position) {
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
  var accuracy = position.coords.accuracy;
	var i;
	// Display geo debug info on web page
	if(debug) {
		let div = document.getElementById("debug");
  	div.innerHTML = `<h5 class="uk-margin-remove-bottom">GPS Debug Info:</h5>` + "Counter: " + counter++ +
    "<br>Latitude: " + latitude +
    "<br>Longitude: " + longitude +
    "<br>Accuracy: " + accuracy + "m";
	} 
	for (i = 0; i < posts.length; i++) { 
		posts[i].delta = distance(latitude, longitude, posts[i].lat,posts[i].lon);
	}
	
	// Find smallest delta value and write post name to div
	closest = Object.keys(posts).reduce((a, b) => posts[a].delta < posts[b].delta ? a : b);
	closestLocation.innerHTML = posts[closest].post;
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

function startInverval() {
	timer = setInterval(checkDay, 1000);

	//For testing you can run timer without checking day, time, holiday, etc.
	//timer = setInterval(doTheTime, 1000);
}

// Check if shuttle runs on that day/time/not a holiday
function checkDay() {
	// If mon-th or on fri	
	var isNotHoliday = true;
	var isDay = false;
	var isTime = false;
	var today = new Date();
	var tDay = today.getDay();
	var tHours = today.getHours();
	var tMinutes = today.getMinutes();
	var todayString = (today.getMonth()+1) + "/" + today.getDate() + "/" + today.getFullYear();

	for(i=0;i < holidays.length; i++) {
		if(todayString == holidays[i]){
			isNotHoliday = false;
		}
	}
	switch (tDay) {
		// Mon-Thur
		case 1:
		case 2:
		case 3:
		case 4:
			isDay = true;
			isTime = checkTime(tHours, tMinutes, startTime[0], startTime[1], endTime[0], endTime[1]);
			break;
			// Fri
		case 5:
			if (checkFriday(today)) {
				isDay = true;
			}			
			isTime = checkTime(tHours, tMinutes, startTime[0], startTime[1], endTimeFri[0], endTimeFri[1]);
			break;	
		default:
			// Weekend so we don't care
			break;
	}

	if(isTime && isDay && isNotHoliday) {
		doTheTime();
	}
	else {
		if (flag) {
			dayError("Shuttle is not currently running.");
			clearDivs();
			flag = false;
		}
	}
}

// Check if it is a working friday
function checkFriday(aDay) {
	// Get week number and see if its odd or even
	var offFriday = (firstOffFridayStart.getWeek()) & 1;
	var tWeek = !(aDay.getWeek() & 1);
	if(offFriday == tWeek) {
		return true;
	} else { return false;}
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
	var today = new Date();
	var tHours = today.getHours();
	var tMinutes = today.getMinutes();

	flag = true;
	for(var i=0; i < posts.length; i++) {
		var count, deltaTime;
		var t = new Date();
		var currentTime = today.getTime();
		var found = getByValue(posts[i].events, tMinutes);
		// Check if found getByValue returned anything in the array. If it didn't than the time is in the next hour
		if(found){
			t.setMinutes(found, 0);
		}else{
			t.setHours(tHours + 1, posts[i].events[0], 0);
		}	
		count = t.getTime();	
		deltaTime = Math.abs(count - currentTime);
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

/*****************DISPLAY STUFF*******************/

// Parse json file of posts
var xmlhttp = new XMLHttpRequest();
var list = "";
xmlhttp.onreadystatechange = function () {
	if (this.readyState == 4 && this.status == 200) {
		shuttle = JSON.parse(this.responseText);
		list += "<ul class='uk-list uk-list-divider'>"
		for (var i = 0; i < shuttle.posts.length; i++) {
			list += "<li><p class='uk-text-bold'>" + shuttle.posts[i].name + "</p><p id=" + shuttle.posts[i].name + ">----</p></li>";
		}
		list += "</ul>"
		document.getElementById("posts").innerHTML = list;
	}
};

function displayTime() {
	// Display all times relative to their array position
	// TODO: This needs an update to set the name of the stop from the object as well as the time instead of fixed array position.
	for(var i=0;i<posts.length;i++) {
		var p = posts[i].post;
		if(p == undefined){
			document.getElementById(p).innerHTML = "----";
		} else {
			document.getElementById(p).innerHTML = msToTime(posts[i].countdown);
		}
	}	
	// Display closest time in card body
	if(closest == undefined){
		closestTime.innerHTML = "----";
	} else {
		closestTime.innerHTML = msToTime(posts[closest].countdown);
	}	
	// If time is <3min display red background
	if(closest == undefined){
		//console.log("Info ----> Closest was Undefined.")
	}
	else if(posts[closest].countdown<180000){
		document.getElementById("card").className = "uk-card-body dangerbg";
	}
	else{
		document.getElementById("card").className = "uk-card-body uk-background-primary";
	}
}

function clearDivs() {
	for(var i=0;i<posts.length;i++) {
		var p = posts[i].post;
		document.getElementById(p).innerHTML = "----";
	}	
	// Clear closest time in card body
	closestTime.innerHTML = "----";
}

// Returns the ISO week of the date.
Date.prototype.getWeek = function () {
	var date = new Date(this.getTime());
	date.setHours(0, 0, 0, 0);
	// Thursday in current week decides the year.
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
	// January 4 is always in week 1.
	var week1 = new Date(date.getFullYear(), 0, 4);
	// Adjust to Thursday in week 1 and count number of weeks from date to week1.
	return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
		- 3 + (week1.getDay() + 6) % 7) / 7);
}

// Returns the four-digit year corresponding to the ISO week of the date.
Date.prototype.getWeekYear = function () {
	var date = new Date(this.getTime());
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
	return date.getFullYear();
}

// Build HTML Post List
function buildPostList() {
	posts.forEach(element => {
		var li = document.createElement('li');
		var p1 = document.createElement('p');
		var p2 = document.createElement('p');

		p1.classList.add("uk-text-bold");
		p1.textContent = element.post;

		p2.id = element.post;
		p2.textContent = "----";

		li.appendChild(p1);
		li.appendChild(p2);
		document.getElementById("PostList").appendChild(li);
	});
}

// Check if weekend on body load
document.body.onload =  function() {
	//xmlhttp.open("GET", "https://api.myjson.com/bins/et50y", true);
	//xmlhttp.send();

	var today = new Date();
	var tHours = today.getHours();

	buildPostList();

	// Second shuttle starts running at 8AM
	if (tHours > 7) {
		posts.forEach(element => {
			extraTimes.forEach(element2 => {
				if (element.post === element2.post) {
					element.events = element.events.concat(element2.events);
				}
			});
			element.events.sort(function(a,b){return a-b});
			console.log(element.events);
		});
	}

	startInverval();
	//mapSetup();
};