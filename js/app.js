var map; // Our map
var markers = []; // The list of our markers
var currentMarker; // The selected marker
var infoWindow; // The info window of the selected marker
var bounds; // The bounds of the map

// Getting wikipedia data
function wikiData(marker) {
	var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.getTitle() + '&format=json&callback=wikiCallback';
	var articleUrl = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=';
	infoWindow.setContent('<h2>' + marker.getTitle() + 
						'</h2><div class="wiki error">Trying to get wikipedia data!</div>');

	// Get relevant articles
	$.ajax({
		url: wikiUrl,
		dataType: "jsonp",
		success: function(response) {
			var articleList = response[1];
			var articleStr = articleList[0];
			// Get data from the first article
			$.ajax({
				url: articleUrl + articleStr,
				dataType: "jsonp",
				success: function(response) {
					var pages = response.query.pages;
					$.map(pages, function(page) {
						infoWindow.setContent('<h2>' + marker.getTitle() + '</h2><div class="wiki">' + page.extract + '</div>');
					});
				},
				error: function() {
					infoWindow.setContent('<h2>' + marker.getTitle() + 
						'</h2><div class="wiki error">Something went wrong when trying to get wikipedia data!</div>');
				}
			});
		}
	});


}

// Some locations on the map
var locations = [
	{title: 'Westminster Abbey', location: {lat: 51.4992921, lng: -0.1294984}},
	{title: 'Big Ben', location: {lat: 51.5007325, lng: -0.1268141}},
	{title: 'Tower Bridge', location: {lat: 51.5054597, lng: -0.0775398}},
	{title: 'British Museum', location: {lat: 51.5194133, lng: -0.1291453}},
	{title: 'London Eye', location: {lat: 51.503324, lng: -0.1217317}}
];

// Calback
function initMap() {


	// Initialize the map
  	var mapCanvas = document.getElementById("map");
  	var mapOptions = {
    	disableDefaultUI: true
  	}
  	map = new google.maps.Map(mapCanvas, mapOptions);

  	currentMarker = new google.maps.Marker();

	infoWindow = new google.maps.InfoWindow();
	infoWindow.addListener('closeclick', function() {
		currentMarker.setIcon('images/simplemarker.png');
		map.panToBounds(bounds);
		this.close();
	});

	bounds = new google.maps.LatLngBounds();

	// Create markers based on the locations above
	for (var i = 0; i < locations.length; i++) {
		// Get the properties
		var position = locations[i].location;
		var title = locations[i].title;
		
		//Create the marker
		var marker = new google.maps.Marker({
			map: map,
			position: position,
			title: title,
			icon: 'images/simplemarker.png'
		});
		
		// Add it to the list
		markers.push(marker);

		// Add click listener -> Create a info window
		marker.addListener('click', function(){

			currentMarker.setIcon('images/simplemarker.png');
			currentMarker = this;
			currentMarker.setIcon('images/mainmarker.png');

			map.panTo(currentMarker.getPosition());

			// Populate the info window
			wikiData(this);

			// Open the info window
			infoWindow.open(map, this);
		});

		bounds.extend(position);
	}

	map.fitBounds(bounds);

	// Activate the bindings
	ko.applyBindings(new viewModel());

}

var viewModel =  function() {
	self = this;

	self.searchInput = ko.observable("");

	// Return the markers that were found after the search
	self.markers = ko.computed(function() {
		var search = self.searchInput().toLowerCase();
		var result = [];
		for (var i = 0; i < markers.length; i++) {
			if (markers[i].getTitle().toLowerCase().indexOf(search) >= 0) {
				markers[i].setVisible(true);
				result.push(markers[i]);
			} else {
				markers[i].setVisible(false);
				if (markers[i] == currentMarker) {
					new google.maps.event.trigger(infoWindow, 'closeclick')
				}
			}
		}
		return result;
	});

	self.markerClick = function(marker) {
		new google.maps.event.trigger(marker, 'click');
	}

	self.navVisible = ko.observable(false);

	// Open and close the navigation bar
	self.changeNav = function() {
		if (self.navVisible()) {
			self.navVisible(false);
		} else {
			self.navVisible(true);
		}
	};
}


