window.onload = function() 
{
    L.mapquest.key = 'YOUR_API_KEY';      
    
    var addressObject={};
    var map, directionsLayer, narrativeControl, restAreas, myIcon, customIcon;
    
    // an initial map display
    map = L.mapquest.map('map', 
    {
        center : [37.7749, -122.4194],       
        layers: L.mapquest.tileLayer('map'),
        zoom: 12    
    });
    
    if (navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(showLocation); 
    }
           
    function showLocation(myPosition)
    {
        var myCoordinates = [myPosition.coords.latitude, myPosition.coords.longitude];

        map.panTo(myCoordinates); // recenter to my location
        
        myIcon = L.mapquest.icons.circle({
            primaryColor: '#006400'    
        });
        
        L.marker(myCoordinates, { icon: myIcon }).bindPopup("That's You!").addTo(map);
        
        L.mapquest.control().addTo(map);
        
        /*
            * The hospital names will be shown in a list
            * onclick of each hospital, the fastest route and narratives from your location to the hospital will be displayed
        */
        
        $("#wrapper").toggleClass("toggled");
        
        // Url to find the Hospitals , code = 806202
        url = "https://www.mapquestapi.com/search/v2/radius?origin="+myPosition.coords.latitude+","+ myPosition.coords.longitude+"&radius=5&maxMatches=10&ambiguities=ignore&hostedData=mqap.ntpois|group_sic_code=?|806202&outFormat=json&key="+L.mapquest.key;
       
        restAreas = new XMLHttpRequest();
        
        restAreas.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                getHospitals(this);   
            }    
        };
              
        restAreas.open("get", url, true);
        
        restAreas.send();
       
        
        function getHospitals(xml)
        {    
            var results = JSON.parse(xml.responseText);
            
            for (i=0; i<results.searchResults.length; i++)
            
            {
               var full_fields = results.searchResults[i].fields; 
                      
                var location = full_fields.name + " " + full_fields.address + " " + full_fields.city + " " + full_fields.state +" "+ full_fields.postal_code;
             
                var latLng = full_fields.mqap_geography.latLng;
                
                customIcon = L.mapquest.icons.circle({
                    primaryColor: '#3b5998'
                });
                      
                var content = full_fields.name;
              
                
                // to display name of each hospital
                var customPopup = L.popup({ closeButton: true })
                .setLatLng(latLng)
                .setContent('<strong>' + full_fields.name+ '</strong> Hospital')               
                .addTo(map);

                L.marker(latLng, { 
                    icon: customIcon
                }).bindPopup(full_fields.name).addTo(map);  // popup onclick of icon
                
                addressObject[full_fields.name] = {"coords" : latLng};
                
                createPlaceInfo(results.searchResults[i]);
            }
           
        } 
        
        /*
            * The function will fill out the list with the hospitals
            * On click function added to each hospital to display route and narrative
        */
        
        function createPlaceInfo(result)
        {
            const ulList = document.getElementById('sideList');
            const li = document.createElement('a');
            li.classList = "list-group-item";
            li.setAttribute("style", "background-color:cadetblue;");
            li.style.color = 'white';
            li.style.textAlign = 'left';
            li.innerHTML = "<strong>" + result.name + " </strong>";
       
                    
            li.onclick = function()
            {          
                L.mapquest.directions().route({
                    start: myCoordinates,            
                    end: addressObject[result.name].coords,
                    options: {
                        enhancedNarrative: true   
                    }    
                },narratives);

                function narratives(error, response)
                {
                    // remove the previous routes and narratives if any
                    if (directionsLayer)
                        map.removeLayer(directionsLayer);
                    
                    if(narrativeControl)
                        map.removeControl(narrativeControl);
                    
                    directionsLayer = L.mapquest.directionsLayer({
                        directionsResponse: response
                    }).addTo(map);
                    
                    narrativeControl = L.mapquest.narrativeControl({
                    directionsResponse: response,
                    compactResults: false,
                    interactive: true
                    });

 
                    narrativeControl.setDirectionsLayer(directionsLayer);
                    narrativeControl.addTo(map);
                    
                }
            }

            ulList.appendChild(li);
        }
     
    }
}
