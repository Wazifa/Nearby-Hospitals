
var addressObject={};
var markers = [];
var map, directionsLayer, narrativeControl, restAreas, myIcon, customIcon, myCoordinates;
var searchCode, radius;
    

window.onload = function() 
{

    L.mapquest.key = 'YOUR_API_KEY';      
    
    radius = document.getElementById("radius").value;
    searchCode = document.getElementById("category").value;

    // an initial map display
    map = L.mapquest.map('map', 
    {
        center : [37.7749, -122.4194],       
        layers: L.mapquest.tileLayer('map'),
        zoom: 15  
    });
    
    if (navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(showLocation); 
    }
           
    function showLocation(myPosition)
    {
        myCoordinates = [myPosition.coords.latitude, myPosition.coords.longitude];

        map.panTo(myCoordinates); // recenter to my location
        
        myIcon = L.mapquest.icons.circle({
            primaryColor: '#006400'    
        });
        
        L.marker(myCoordinates, { icon: myIcon }).bindPopup("That's You!").addTo(map);
        
        L.mapquest.control().addTo(map);
        
        fillMap();
    }
}

function fillMap()
{
            
    /*        
    * The hospital names will be shown in a list
    * onclick of each hospital, the fastest route and narratives from your location to the hospital will be displayed
    */
    
    
    document.getElementById("insideList").innerHTML=""; // clear out the previous list
    
    /*
        * Remove all previous layers to display the new results only
    */
    if (markers.length != 0)   
    {
        markers.forEach(function(element){
            map.removeLayer(element);
        });
        markers = [];
    }

   if (directionsLayer)
        map.removeLayer(directionsLayer);

    if(narrativeControl)
        map.removeControl(narrativeControl);

    map.panTo(myCoordinates);
    
    radius = document.getElementById("radius").value;
    searchCode = document.getElementById("category").value;
    
    
    url = "https://www.mapquestapi.com/search/v2/radius?origin="+myCoordinates[0]+","+ myCoordinates[1]+"&radius="+radius+"&maxMatches=10&ambiguities=ignore&hostedData=mqap.ntpois|group_sic_code=?|"+searchCode+"&outFormat=json&key="+L.mapquest.key;
       
        
    targets = new XMLHttpRequest();
        
    targets.onreadystatechange = function() {
            
        if (this.readyState == 4 && this.status == 200) {
            getHospitals(this);   
        }        
    };
              
        
    targets.open("get", url, true);
    targets.send();
       
        
    function getHospitals(xml)
    {    
        var results = JSON.parse(xml.responseText);
        
        // case for when none is found within the radius
        if (results.resultsCount == 0)
        {
            var alert = document.getElementById("alert");
            alert.classList = "alert-warning";
            
            alert.innerHTML = "<strong>Looks like there is none within the radius.</strong> <br> Try increasing the radius."
            
            return;
        }
        
        for (i=0; i<results.searchResults.length; i++)
        {
        
            var full_fields = results.searchResults[i].fields; 
            
            var location = full_fields.name + " " + full_fields.address + " " + full_fields.city + " " + full_fields.state +" "+ full_fields.postal_code;
             
            var latLng = full_fields.mqap_geography.latLng;
                
            customIcon = L.mapquest.icons.circle({
                primaryColor: '#3b5998'    
            });
            
            var content = full_fields.name;
            
            // to display name of each hospital on map
            
            markers.push(L.popup({ closeButton: true })
            .setLatLng(latLng)
            .setContent('<strong>' + full_fields.name+ '</strong>')                           
            .addTo(map));

            
           markers.push( L.marker(latLng, { 
                icon: customIcon    
            }).bindPopup(full_fields.name)
                    .openPopup().addTo(map));
       
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
        const ulList = document.getElementById('insideList');
         
        const li = document.createElement('a');
        
        li.classList = "list-group-item";
        
        li.setAttribute("style", "background-color:cadetblue;");
        
        li.style.color = 'white';
        
        li.style.textAlign = 'left';
        
        li.innerHTML = "<strong>" + result.name + " </strong>";
       
        li.href = "#";
            
        ulList.appendChild(li);
                    
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
    }
}
