async function initMap() {
  // Import necessary Google Maps libraries
  const { Map } = await google.maps.importLibrary("maps"); // Imports the Map class from Google Maps API
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker"); // Imports AdvancedMarkerElement for custom markers
  const { AutocompleteSessionToken, AutocompleteSuggestion } =
    await google.maps.importLibrary("places"); // Imports Autocomplete classes for address suggestions

  // Initialize the map with center coordinates, zoom level, and other options
  const map = new Map(document.getElementById("map"), {
    center: { lat: -0.022894, lng: 109.345062 }, // Sets the initial center of the map
    zoom: 15, // Sets the initial zoom level of the map
    mapId: "YOUR_MAP_ID", // A unique identifier for the custom styling of the map
    disableDefaultUI: true, // Disables default UI controls for a cleaner appearance
  });

  // State variable to track if the search is active
  let searchActiveGmaps = false; // Boolean flag to indicate whether the search is active or not

  // DOM elements
  const searchAddressGmaps = document.querySelector("#search-address-gmaps"); // The search address input element
  const elementSearchHideGmaps = document.querySelectorAll(
    ".element-search-hide-gmaps"
  ); // Elements to hide/show based on search state
  const inputAddressGmaps = document.querySelector("#input-address-gmaps"); // The input field for address search
  const buttonActionIconGmaps = document.querySelector(
    "#action-address-gmaps i"
  ); // Icon within the action button for toggling search state
  const buttonActionGmaps = document.querySelector("#action-address-gmaps"); // The button element to reset or toggle search
  const resultsElementGmaps = document.querySelector("#result-search-gmaps"); // Element to display search results
  const navigationControlGmaps = document.querySelector(
    "#navigation-control-gmaps"
  ); // Navigation control button
  const fullscreenControlGmaps = document.querySelector(
    "#fullscreen-control-gmaps"
  ); // Fullscreen control button
  const zoomInControlGmaps = document.querySelector("#zoom-in-control-gmaps"); // Zoom in control button
  const zoomOutControlGmaps = document.querySelector("#zoom-out-control-gmaps"); // Zoom out control button
  const geocodingControlGmaps = document.querySelector(
    "#geocoding-control-gmaps"
  ); // Geocoding control button for centering map on user location
  const infoControlGmaps = document.querySelector("#info-control-gmaps"); // Info controll elememt

  // Add the search control to the map at the LEFT_TOP position
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(searchAddressGmaps);

  // Add the navigation control to the map at the RIGHT_TOP position
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(
    navigationControlGmaps
  );

  // Add the info control to the map at the BOTTOM_CENTER position
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(
    infoControlGmaps
  );

  // Function to update the search state based on whether the input field is empty or not
  const toggleSearchState = () => {
    const isEmpty = inputAddressGmaps.value === ""; // Check if the search input is empty
    searchActiveGmaps = !isEmpty; // Update the search active state based on whether input is empty
    searchAddressGmaps.classList.toggle("border-full-gmaps", isEmpty); // Apply full border if input is empty
    searchAddressGmaps.classList.toggle("border-half-gmaps", !isEmpty); // Apply half border if input is not empty
    elementSearchHideGmaps.forEach((e) =>
      e.classList.toggle("hide-element-gmaps", isEmpty)
    ); // Show or hide additional elements based on input
    buttonActionIconGmaps.classList.toggle("fa-magnifying-glass", isEmpty); // Toggle search icon when input is empty
    buttonActionIconGmaps.classList.toggle("fa-xmark", !isEmpty); // Toggle close icon when input is not empty
    if (isEmpty) resultsElementGmaps.innerHTML = ""; // Clear search results if input is empty
  };

  // Event handler for changes in the search input field
  const handleInputChange = async () => {
    toggleSearchState(); // Update UI based on current input value
    if (inputAddressGmaps.value === "") return; // Exit if input field is empty

    // Create a new Autocomplete session token for this search request
    const token = new AutocompleteSessionToken();
    const request = {
      input: inputAddressGmaps.value, // The current value of the search input
      language: "id-ID", // Language for the suggestions
      region: "id", // Region for the suggestions
      sessionToken: token, // Session token to keep track of this search session
    };

    // Fetch autocomplete suggestions from the API
    const { suggestions } =
      await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

    // Update the search results element with suggestions or a not found message
    resultsElementGmaps.innerHTML = suggestions.length
      ? suggestions
          .map(
            ({ placePrediction }) => `
        <span class="select-suggest-address-gmaps" data-placeid="${placePrediction.placeId}">
          ${placePrediction.text}
        </span>
      `
          )
          .join("") + '<div><img src="images.png" alt="By Google"></div>'
      : '<div style="width: calc(100% - 40px); padding: 10px 20px !important;">Not Found Address!</div><div><img src="images.png" alt="By Google"></div>';

    // Add click event listeners to each suggestion for further actions
    document
      .querySelectorAll(".select-suggest-address-gmaps")
      .forEach((element) => {
        element.addEventListener("click", async (event) => {
          const placeId = event.target.getAttribute("data-placeid"); // Get the Place ID from the clicked element
          const suggestion = suggestions.find(
            (s) => s.placePrediction.placeId.toString() === placeId
          );
          const place = suggestion.placePrediction.toPlace(); // Convert suggestion to a Place object
          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location"], // Fetch detailed fields for the place
          });
          inputAddressGmaps.value = place.displayName; // Change the value inputAddressGmaps
          map.panTo(place.location); // Center the map on the selected place
          map.setZoom(15); // Zoom in on the selected place
          if (window.currentMarker) window.currentMarker.setMap(null); // Remove any existing marker
          window.currentMarker = new AdvancedMarkerElement({
            map,
            position: place.location,
            title: "Your location",
          }); // Add a new marker at the selected place
          console.log(JSON.stringify(place.location)); // Log the location of the selected place
        });
      });
  };

  // Function to clear the search input and reset the search state
  const resetSearch = () => {
    inputAddressGmaps.value = ""; // Clear the input field
    toggleSearchState(); // Update the UI to reflect the cleared input
  };

  // Add event listeners to handle focus, input changes, and button clicks
  inputAddressGmaps.addEventListener("focus", toggleSearchState); // Update UI when the input field gains focus
  inputAddressGmaps.addEventListener("input", handleInputChange); // Handle input changes to fetch suggestions
  buttonActionGmaps.addEventListener("click", resetSearch); // Clear the search input when button is clicked

  // Add an event listener to handle map clicks
  map.addListener("click", (event) => {
    if (searchActiveGmaps) {
      // If search is active, hide the search UI
      searchAddressGmaps.classList.add("border-full-gmaps");
      searchAddressGmaps.classList.remove("border-half-gmaps");
      elementSearchHideGmaps.forEach((e) =>
        e.classList.add("hide-element-gmaps")
      );
      searchActiveGmaps = !searchActiveGmaps; // Deactivate search
    } else {
      // If search is not active, add a marker to the map at the clicked location
      if (window.currentMarker) window.currentMarker.setMap(null); // Remove any existing marker
      window.currentMarker = new AdvancedMarkerElement({
        map,
        position: event.latLng,
        title: "Your location",
      }); // Add a new marker at the clicked location
      console.log(JSON.stringify(event.latLng)); // Log the location of the selected place
    }
  });

  // Set up the fullscreen control on the map
  fullscreenControlGmaps.addEventListener("click", () => {
    const element = map.getDiv().firstChild; // Get the first child element of the map
    isFullscreen(element) ? exitFullscreen() : requestFullscreen(element); // Toggle fullscreen mode

    // Update the fullscreen icon when the fullscreen status changes
    document.onfullscreenchange = () => {
      const icon = document.querySelector("#fullscreen-control-gmaps i"); // Get the icon element
      icon.classList.toggle("fa-maximize", !isFullscreen(element)); // Toggle maximize icon
      icon.classList.toggle("fa-minimize", isFullscreen(element)); // Toggle minimize icon
    };
  });

  // Set up the zoom-in control on the map
  zoomInControlGmaps.addEventListener("click", () =>
    map.setZoom(map.getZoom() + 1)
  ); // Increase the map zoom level

  // Set up the zoom-out control on the map
  zoomOutControlGmaps.addEventListener("click", () =>
    map.setZoom(map.getZoom() - 1)
  ); // Decrease the map zoom level

  // Set up the geocoding control on the map
  geocodingControlGmaps.addEventListener("click", () => {
    if (navigator.geolocation) {
      // Check if geolocation is supported
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // If successful in getting the location
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }; // Get coordinates
          map.panTo(pos); // Pan the map to the user's location
          map.setZoom(15); // Set the map zoom level to 15

          // Remove existing marker if present
          if (window.currentMarker) window.currentMarker.setMap(null);

          // Add a new marker with animation
          window.currentMarker = new AdvancedMarkerElement({
            map,
            position: pos,
            title: "Your location", // Title of the marker
          });
        },
        () => console.log("Error: The Geolocation service failed.") // Error message if geolocation fails
      );
    } else {
      console.log("Error: Your browser doesn't support geolocation."); // Error message if geolocation is not supported
    }
  });
}

// Add an event listener for 'keydown' events on the entire document
document.addEventListener("keydown", function (event) {
  // Select the address input field and convert suggestion elements into an array
  const inputAddressGmaps = document.querySelector("#input-address-gmaps");
  const suggestions = Array.from(
    document.querySelectorAll(".select-suggest-address-gmaps")
  );

  // Find the index of the currently selected suggestion, if any
  let currentIndex = suggestions.findIndex((suggestion) =>
    suggestion.classList.contains("selected")
  );

  // Handle 'ArrowDown' key press
  if (event.key === "ArrowDown") {
    // Remove 'selected' class from the current suggestion, if there is one
    if (currentIndex !== -1) suggestions[currentIndex].classList.remove("selected");

    // Move to the next suggestion or reset to the start if at the end
    currentIndex = (currentIndex + 1) % (suggestions.length + 1);
    if (currentIndex < suggestions.length) {
      // Add 'selected' class to the new suggestion
      suggestions[currentIndex].classList.add("selected");
      // Blur the input field to prevent it from receiving focus
      inputAddressGmaps.blur();
    } else {
      // Reset selection if beyond the last suggestion and refocus the input field
      inputAddressGmaps.focus();
    }
  }
  // Handle 'ArrowUp' key press
  else if (event.key === "ArrowUp") {
    // Remove 'selected' class from the current suggestion, if there is one
    if (currentIndex !== -1) suggestions[currentIndex].classList.remove("selected");
    // Move to the previous suggestion or reset to the end if at the start
    currentIndex = (currentIndex - 1 + suggestions.length + 1) % (suggestions.length + 1);
    if (currentIndex < suggestions.length) {
      // Add 'selected' class to the new suggestion
      suggestions[currentIndex].classList.add("selected");
      // Blur the input field to prevent it from receiving focus
      inputAddressGmaps.blur();
    } else {
      // Reset selection if beyond the first suggestion and refocus the input field
      inputAddressGmaps.focus();
      // Set the cursor to the end of the input field's value to maintain user typing position
      setTimeout(
        () =>
          inputAddressGmaps.setSelectionRange(
            inputAddressGmaps.value.length,
            inputAddressGmaps.value.length
          ),
        0
      );
    }
  }
  // Handle 'Enter' key press
  else if (event.key === "Enter") {
    // Find and click the currently selected suggestion
    const selectedSuggestion = document.querySelector(
      ".select-suggest-address-gmaps.selected"
    );
    if (selectedSuggestion) selectedSuggestion.click();
  }
});


// Check if the given element is currently in fullscreen mode
const isFullscreen = (element) =>
  (document.fullscreenElement || // Standard
    document.webkitFullscreenElement || // Safari
    document.mozFullScreenElement || // Firefox
    document.msFullscreenElement) === element; // IE/Edge

// Request fullscreen mode for the given element
const requestFullscreen = (element) => {
  if (element.requestFullscreen) {
    element.requestFullscreen(); // Standard
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(); // Safari
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen(); // Firefox
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen(); // IE/Edge
  }
};

// Exit fullscreen mode
const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen(); // Standard
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen(); // Safari
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen(); // Firefox
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen(); // IE/Edge
  }
};

initMap();
