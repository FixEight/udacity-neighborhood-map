// --------------------------------------------------------
// Global variables
// --------------------------------------------------------


// Create a map variable
var map;

// Create a new blank array for all the listing markers.
var markers = [];


// --------------------------------------------------------
// Initialize the Google MAP callback function
// --------------------------------------------------------


function initMap() {
    var largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.712775, lng: -74.005973 },
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    });


    // --------------------------------------------------------
    // Initialize the markers for Google MAP
    // --------------------------------------------------------


    function initMarkers() {
        //The following group uses the initLocations array to create an array of markers on initialize.
        for (var i = 0; i < initLocations.length; i++) {
            // Get the position from the initLocations array.
            var position = initLocations[i].location;
            var title = initLocations[i].title;
            // Create a marker per initLocations, and put into markers array.
            var marker = new google.maps.Marker({
                position: position,
                title: title,
                animation: google.maps.Animation.DROP,
            });

            // Push the marker to our array of markers.
            this.markers.push(marker);
            showListings(this.markers);
            // Create an onclick event to open an infowindow at each marker.
            marker.addListener('click', this.toggleBounce);
        }
    }


    // --------------------------------------------------------
    // Set the marker Animation
    // --------------------------------------------------------


    this.toggleBounce = function () {
        if (this.getAnimation() !== null) {
            this.setAnimation(null);
        } else {
            this.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                this.setAnimation(null);
            }.bind(this), 1000);
        }
        populateInfoWindow(this, largeInfowindow);
    }


    // --------------------------------------------------------
    // Show all markers on the Google MAP
    // --------------------------------------------------------


    function showListings(markers) {
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
            bounds.extend(markers[i].position);
        }
        map.fitBounds(bounds);
    }


    // --------------------------------------------------------
    // Show all markers on the Google MAP
    // --------------------------------------------------------


    // This function will loop through the listings and hide them all.
    function hideMarkers(markers) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    }


    // --------------------------------------------------------
    // Show single marker on the Google MAP
    // --------------------------------------------------------


    function showSingleMarker(markers) {
        markers.setMap(map);
        bounds.extend(markers.position);
        map.fitBounds(bounds);
    }


    // --------------------------------------------------------
    // Initialize the Infowindow and populate them with data
    // --------------------------------------------------------


    // This function populates the infowindow when the marker is clicked. We'll only allow
    // one infowindow which will open at the marker that is clicked, and populate based
    // on that markers position.
    function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            // Clear the infowindow content to give the streetview time to load.
            infowindow.setContent('<div>' + marker.title + '</div>');
            infowindow.marker = marker;
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function () {
                infowindow.marker = null;
            });


            // --------------------------------------------------------
            // WIKIPEDIA AJAX request goes here
            // --------------------------------------------------------


            var wikiurl = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" +
                marker.title + "&format=json&callback=wikicallback";

            // Setting error handling
            var wikiRequestError = setTimeout(function () {
                infowindow.setContent('<h6>' + marker.title + '</h6><div>"Failed to get Wikipedia resources."</div>');
            }, 8000);

            // AJAX request and handling
            $.ajax({
                // Setting it as a property
                url: wikiurl,
                dataType: "jsonp",
                success: function (data) {
                    let self = this;
                    // View the response of server
                    var articlelist = data[1];
                    self.innerHTML = '<h6>' + marker.title +
                        '</h6><div><strong>Relevant Wikipedia Links</strong></div><ul id="error">';
                    infowindow.setContent(self.innerHTML);
                    for (i = 0; i < articlelist.length; i++) {
                        var onearticle = articlelist[i];
                        var url = "https://en.wikipedia.org/wiki/" + onearticle;
                        self.innerHTML += '<li>' + '<a href="' + url + '">' + onearticle + '</a></li>';
                        infowindow.setContent(self.innerHTML + '</ul>');
                    };
                    clearTimeout(wikiRequestError);
                }
            });
            // Open the infowindow on the correct marker.
            infowindow.open(map, marker);
        }
    }


    // --------------------------------------------------------
    // Intialize data in ViewModel from Model
    // --------------------------------------------------------


    var Data = function (data) {
        this.title = data.title;
        this.location = data.location;
    }


    // --------------------------------------------------------
    // ViewModel (VM)
    // --------------------------------------------------------


    var ViewModel = function () {
        initMarkers();
        let self = this;
        this.searchInput = ko.observable("");
        this.sidebarList = ko.observableArray([]);

        initLocations.forEach(function (item) {
            self.sidebarList.push(new Data(item));
        });


        // --------------------------------------------------------
        // Higlight the selected item from the sidebarList
        // --------------------------------------------------------


        this.setMarker = function (selectedListItem) {
            for (let i = 0; i < markers.length; i++) {
                if (selectedListItem.title == markers[i].title) {
                    hideMarkers(markers);
                    showSingleMarker(markers[i]);
                    new google.maps.event.trigger(markers[i], "click");
                }
            }
        };


        // --------------------------------------------------------
        // Update the list and marker from User Input data
        // --------------------------------------------------------


        //filter the items using the textbox form html
        this.filterLocations = ko.computed(function () {
            var filteredMarker = [];
            let searchWord = this.searchInput().toLowerCase();
            for (var i = 0; i < markers.length; i++) {
                if (markers[i].title.toLowerCase().includes(searchWord)) {
                    filteredMarker.push(markers[i]);
                    if (self.sidebarList()[i].title === markers[i].title) {
                        markers[i].setVisible(true);
                        if (markers[i].getAnimation() == null) {
                            markers[i].setAnimation(google.maps.Animation.BOUNCE);
                        }
                    }
                } else {
                    markers[i].setAnimation(null);
                    markers[i].setVisible(false);
                }
            }
            return filteredMarker;
        }, this);

    };
    // Start the ViewModel
    ko.applyBindings(new ViewModel());
}


// --------------------------------------------------------
// Google MAP error handling
// --------------------------------------------------------


mapError = function mapError() {
    document.getElementById('menu-toggle').style.display = 'none';
    document.getElementById('heading').style.display = 'none';
    document.getElementById('error').append(
        "This page didn't load Google Maps correctly. See the JavaScript console for technical details.");
    this.apierror
};