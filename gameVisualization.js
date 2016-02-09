var xExtent;
var yExtent;
var timeExtent;
var causeExtent;
var itemTotalExtent;
var itemExtent;
var timeDeathExtent;

var xScale;
var yScale;
var timeScale;
var causeScale;
var itemTotalScale;
var itemScale;
var timeDeathScale;

var players; //Array of player objects
var games;

var brushTimeLine;
var timeBrush;

var currStartTime;
var currEndTime;

var selectedBar = "NONE";
var selectedBarType = "NONE";

var items;
var totalItems;
var deathCauses;
var times;

var timeType = "Deaths";
var selectedBarType = "NONE";

d3.csv("PosData.csv", function(csv) {
    players = [];
    games = [];
    times = [];
    var currGame = -1;
    playerId = 0;
    
    d3.select("#MainViewBack")
            .on("click", function() { d3.event.stopPropagation(); clearSelections(); });
            
    for (var i = 0; i < csv.length; i++) {
        csv[i].x = Number(csv[i].x);
        csv[i].y = Number(csv[i].y);
        csv[i].z = Number(csv[i].z);
        csv[i].Time = Number(csv[i].Time);
        csv[i].GameId = Number(csv[i].GameId);
        if( csv[i].GameId > currGame ){
            games.push(true);
            currGame = csv[i].GameId;
            d3.select("#gameSelect")
                .append("option")
                .attr("value", currGame)
                .text(currGame);
        }
        var found = false;
        //console.log(i);
        //console.log(csv[i].GameId);
        for( var j = 0; j < players.length; j++ ){
            if( players[j].name == csv[i].Player ){
                found = true;
            }
        }
        if( !found ){
            //console.log(csv[i].GameId);
            //console.log(csv[i].Player);
            players.push({name:csv[i].Player, ID:playerId, x:0.0, y:0.0, z:0.0, posStatus:"DPOS", currGame:csv[i].GameId});
            playerId++;
        }
        if( csv[i].Time > times.length - 1 ){
            times.push({time:csv[i].Time, deaths:0, items:0});
        }
    }

    xExtent = d3.extent(csv, function(row) { return row.x; });
    yExtent = d3.extent(csv, function(row) { return row.y; });
    timeExtent = d3.extent(csv, function(row) {return row.Time; });
    
    currStartTime = timeExtent[0];
    currEndTime = timeExtent[1];

    xScale = d3.scale.linear().domain(xExtent).range([30, 670]);
    yScale = d3.scale.linear().domain(yExtent).range([570, 30]);
    timeScale = d3.scale.linear().domain(timeExtent).range([30, 870]);
        
    timeBrush = d3.svg.brush()
        .x(timeScale)
        .on("brush", brushmoveTime)
        .on("brushend", brushendTime)
        .on("brushstart", brushstartTime);    
        
    brushTimeLine = d3.select("#TimeLine")
        .append("g")
        .attr("class", "brush")
        .call(timeBrush)
        .selectAll("rect")
        .attr("y", 0)
        .attr("height", 75);
        
    d3.select("#MainView")
        .selectAll(".movement")
        .data(csv)
        .enter()
        .append("path")
        .attr("class", function(d) {
            //console.log(d.Player);
            //console.log(d.GameId);
            if( isAlive(d) ){
                return "movement";
            }
            else{
                return "deadMovement";
            }
            
        })
        .attr( "d", function(d) {
            var playerIndex = getPlayerIndex(d.Player);
            
            var newPath = "M " + xScale(players[playerIndex].x) + " " + yScale(players[playerIndex].y) + " L " + xScale(d.x) + " " + yScale(d.y);
            players[playerIndex].x = d.x;
            players[playerIndex].y = d.y;
            players[playerIndex].z = d.z; 
            return newPath;
        })
        .attr( "stroke", function(d) { return playerColor(d.Player);} )
        .attr( "stroke-width", 2);
        
    d3.select("#MainView")
        .selectAll(".spawn")
        .data(csv)
        .enter()
        .append("circle")
        .filter( function(d) {
            return d.Type == "SPAWN";
        })
        .classed("spawn", true)
        .attr("fill", "yellow")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("cx", function(d) { return xScale(d.x); })
        .attr("cy", function(d) { return yScale(d.y); })
        .attr("r", 4)
        .style("opacity", function(d) {
            if( d.Type == "SPAWN" ){
                return 1;
            }
            else{
                return 0;
            }
        });
    
    resetPlayerArray();    
        
    d3.select("#MainViewBack")
        .selectAll(".movement")
        .data(csv)
        .enter()
        .append("path")
        .attr("class", function(d) {
            //console.log(d.Player);
            //console.log(d.GameId);
            if( isAlive(d) ){
                return "movement";
            }
            else{
                return "deadMovement";
            }
            
        })
        .attr( "d", function(d) {
            var playerIndex = getPlayerIndex(d.Player);
            
            var newPath = "M " + xScale(players[playerIndex].x) + " " + yScale(players[playerIndex].y) + " L " + xScale(d.x) + " " + yScale(d.y);
            players[playerIndex].x = d.x;
            players[playerIndex].y = d.y;
            players[playerIndex].z = d.z; 
            return newPath;
        })
        //.attr( "stroke", function(d) { return playerColor(d.Player);} )
        .attr("stroke", "gray")
        .attr( "stroke-width", 2);
        
    d3.select("#MainViewBack")
        .selectAll(".spawn")
        .data(csv)
        .enter()
        .append("circle")
        .filter( function(d) {
            return d.Type == "SPAWN";
        })
        .classed("spawn", true)
        //.attr("fill", "yellow")
        .attr("fill", "gray")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("cx", function(d) { return xScale(d.x); })
        .attr("cy", function(d) { return yScale(d.y); })
        .attr("r", 4)
        .style("opacity", function(d) {
            if( d.Type == "SPAWN" ){
                return 1;
            }
            else{
                return 0;
            }
        });
        
        //Set up timeline
        /* old version 
        d3.select("#TimeLine")
            .selectAll(".second")
            .data(csv)
            .enter()
            .append("path")
            .attr("class", "second")
            .attr( "d", function(d) {            
                var newPath = "M " + timeScale(d.Time) + " " + 20 + " L " + timeScale(d.Time) + " " + 30;
                return newPath;
            })
            .attr( "stroke", "black" )
            .attr( "stroke-width", 2);
        */
        
        initDeaths();
        initItems();
                
        
        
        d3.select("#deathSwitchV")
            .on("click", deathToggleV);
        d3.select("#deathSwitchT")
            .on("click", deathToggleT);
        d3.select("#killSwitchV")
            .on("click", killToggleV);
        d3.select("#killSwitchT")
            .on("click", killToggleT);    
        d3.select("#killLineSwitchV")
            .on("click", killLineToggleV);
        d3.select("#pathSwitchV")
            .on("click", pathToggleV);
        d3.select("#itemSwitchV")
            .on("click", itemToggleV);
        d3.select("#itemSwitchT")
            .on("click", itemToggleT);    
        d3.select("#selectGame")
            .on("click", selectGame); 
        d3.select("#addGame")
            .on("click", addGame);
        d3.select("#removeGame")
            .on("click", removeGame);
        d3.select("#addAllGame")
            .on("click", addAllGames);
        d3.select("#timeLineSwitchT")
            .on("click", timelineToggleT);
            
});

function resetPlayerArray(){
    for( var i = 0; i < players.length; i++ ){
        players[i].posStatus = "DPOS";
        players[i].x = 0;
        players[i].y = 0;
        players[i].z = 0;
        players[i].currGame = 0;
    }
}

function printGames(){
    for( var i = 0; i < games.length; i++ ){
        console.log(games[i]);
    }
}

function clearGames(){
    for( var i = 0; i < games.length; i++ ){
        games[i] = false;
    }
    filterTime(currStartTime, currEndTime);
}

function addAllGames(){
    for( var i = 0; i < games.length; i++ ){
        games[i] = true;
    }
    filterTime(currStartTime, currEndTime);
    updateTimes();
}

function addGame(){
    var selector = document.getElementById('gameSelect');
    var selectedGame = selector.options[selector.selectedIndex].value;
    games[selectedGame] = true;
    filterTime(currStartTime, currEndTime);
    updateTimes();
}

function removeGame(){
    var selector = document.getElementById('gameSelect');
    var selectedGame = selector.options[selector.selectedIndex].value;
    games[selectedGame] = false;
    filterTime(currStartTime, currEndTime);
    updateTimes();
}

function selectGame(){
    var selector = document.getElementById('gameSelect');
    var selectedGame = selector.options[selector.selectedIndex].value;
    clearGames();
    games[selectedGame] = true;
    filterTime(currStartTime, currEndTime);
    updateTimes();
}

//Variables that define the current visibility states for stuff
var deathView = "Show";
var killView = "Show";
var killLineView = "Show";
var pathView = "Show";
var itemView = "Show";

//Variables that define the current type shown states for stuff
var deathType = "Player";
var killType = "Player";
//var killLineView = "Show";
//var pathView = "Show";
var itemType = "Location";

/* Called when death view button is clicked */
function deathToggleV(){
    if( deathView == "Show" ){
        deathView = "Fade";
    }
    /*else if( deathView == "Fade" ){
        deathView = "Hide";
    }*/
    else{
        deathView = "Show"
    }
    
    d3.select("#deathSwitchV").text(deathView);
    
    d3.select("#MainView")
        .selectAll(".death")
        .on("click", function(d) {
            if( deathView == "Hide" ){
                return;
            }
            else{
                selectClick(d);
            } 
        })
        .transition()
        .duration(1000)
        .style("opacity", getOpacity(deathView));
        
}


function deathToggleT(){
    if( deathType == "Player" ){
        deathType = "Cause";
    }
    else if( deathType == "Cause" ){
        deathType = "Player";
    }
    
    d3.select("#deathSwitchT").text(deathType);
    
    d3.select("#MainView")
        .selectAll(".death")
        .transition()
        .duration(1000)
        .attr("fill", function(d) { 
            if( deathType == "Player" ) {
                return playerColor(d.Dead); 
            }
            else{
                return deathCauseColor(d.Cause);
            }
        });    
}


/* Called when kill view button is clicked */
function killToggleV(){
    if( killView == "Show" ){
        killView = "Fade";
    }
    /*
    else if( killView == "Fade" ){
        killView = "Hide";
    }
    */
    else{
        killView = "Show"
    }
    
    d3.select("#killSwitchV").text(killView);
    
    d3.select("#MainView")
        .selectAll(".kill")
        .on("click", function(d) {
            if( killView == "Hide" ){
                return;
            }
            else{
                selectClick(d);
            } 
        })
        .transition()
        .duration(1000)
        .style("opacity", getOpacity(killView));
        
        
}

function killToggleT(){
    if( killType == "Player" ){
        killType = "Cause";
    }
    else if( killType == "Cause" ){
        killType = "Player";
    }
    
    d3.select("#killSwitchT").text(killType);
    
    d3.select("#MainView")
        .selectAll(".kill")
        .transition()
        .duration(1000)
        .attr("fill", function(d) { 
            if( killType == "Player" ) {
                return playerColor(d.Killer); 
            }
            else{
                return deathCauseColor(d.Cause);
            }
        });    
}

/* Called when kill line view button is clicked */
function killLineToggleV(){
    if( killLineView == "Show" ){
        killLineView = "Fade";
    }
    /*
    else if( killLineView == "Fade" ){
        killLineView = "Hide";
    }
    */
    else{
        killLineView = "Show"
    }
    
    d3.select("#killLineSwitchV").text(killLineView);
    
    d3.select("#MainView")
        .selectAll(".killLine")
        .on("click", function(d) {
            if( killLineView == "Hide" ){
                return;
            }
            else{
                selectClick(d);
            } 
        })
        .transition()
        .duration(1000)
        .style("opacity", getOpacity(killLineView));
}

/* Called when path view button is clicked */
function pathToggleV(){
    if( pathView == "Show" ){
        pathView = "Fade";
    }
    /*
    else if( pathView == "Fade" ){
        pathView = "Hide";
    }
    */
    else{
        pathView = "Show"
    }
    
    d3.select("#pathSwitchV").text(pathView);
    
    d3.select("#MainView")
        .selectAll(".movement")
        .transition()
        .duration(1000)
        .style("opacity", getOpacity(pathView));
    
    d3.select("#MainView")
        .selectAll(".spawn")
        .transition()
        .duration(1000)
        .style("opacity", getOpacity(pathView));
}

/* Called when item view button is clicked */
function itemToggleV(){
    if( itemView == "Show" ){
        itemView = "Fade";
    }
    /*
    else if( itemView == "Fade" ){
        itemView = "Hide";
    }
    */
    else{
        itemView = "Show"
    }
    
    d3.select("#itemSwitchV").text(itemView);
    
    d3.select("#MainView")
        .selectAll(".item")
        .on("click", function(d) {
            if( itemView == "Hide" ){
                return;
            }
            else{
                selectClick(d);
            } 
        })
        .transition()
        .duration(1000)
        .style("opacity", function(d) {
            if( itemView == "Show" ){
                return 1;
            }
            else{
                return 0;
            }    
        });
    /*    
    d3.select("#MainViewBack")
        .selectAll(".item")
        .on("click", function(d) {
            if( itemView == "Hide" ){
                return;
            }
            else{
                selectClick(d);
            } 
        })
        .transition()
        .duration(1000)
        .style("opacity", getOpacity(itemView));    
    */
}

function itemToggleT(){
    if( itemType == "Location" ){
        itemType = "Count";
    }
    else if( itemType == "Count" ){
        itemType = "Location";
    }
    
    d3.select("#itemSwitchT").text(itemType);
    
    d3.select("#MainView")
        .selectAll(".item")
        .transition()
        .duration(1000)
        .attr("fill", function(d) { 
            if( itemType == "Location" ) {
                return "green"; 
            }
            else{
                var iCount = items[getItemIndex(d.Item, d.x, d.y, d.z)].count;
                return itemScale(iCount);
            }
        });    
}

function timelineToggleT(){
    if( timeType == "Deaths" ){
        timeType = "Items";
    }
    else if( timeType == "Items" ){
        timeType = "Deaths";
    }
    
    d3.select("#timeLineSwitchT").text(timeType);
    
    var timeWidth = 900 / times.length;    
        
    timeDeathExtent = d3.extent(times, function(row) { 
        if( timeType == "Items" ){
            return row.items; 
        }
        return row.deaths;
    });
    timeDeathExtent[0] = 0;
    timeDeathScale = d3.scale.linear().domain(timeDeathExtent).range([35, 5]);
    
    d3.select("#TimeLine")
        .selectAll(".second")
        .transition()
        .duration(1000)
        .attr("y", function(d) { 
            if( timeType == "Items" ){
                return timeDeathScale(d.items);
            }
            return timeDeathScale(d.deaths);
        })
        .attr("x", function(d, i) { return timeScale(d.time); })
        .attr("height", function(d) { 
            if( timeType == "Items" ){
                return 35 - timeDeathScale(d.items);
            }
            return 35 - timeDeathScale(d.deaths);    
        })
        .attr("width", timeWidth);
    
    var timeAxis = d3.svg.axis().scale(timeScale);    
    
    d3.select("#timelineXAxis") 
        .call(timeAxis);    
}

//Assigns color based on player. Needs to be made scalable.
function playerColor(name) {
    var playerIndex = getPlayerIndex(name);
    switch( playerIndex ){
        case 0:
            return "blue";
            break;
        case 1:
            return "red";
            break;
        default:
            return "black";
            break;
    }
   
}

function deathCauseColor(cause) {
    var causeIndex = getCauseIndex(cause);
    var causeColor = causeIndex % 5;
    switch( causeColor ){
        case 0:
            return "blue";
            break;
        case 1:
            return "red";
            break;
        case 2:
            return "purple";
            break;
        case 3:
            return "orange";
            break;
        case 4:
            return "magenta";
            break;
        default:
            return "black";
            break;
    }
   
}

function itemBarColor(item) {
    var itemIndex = getItemTotalIndex(item);
    var itemColor = itemIndex % 5;
    switch( itemColor ){
        case 0:
            return "blue";
            break;
        case 1:
            return "red";
            break;
        case 2:
            return "purple";
            break;
        case 3:
            return "green";
            break;
        case 4:
            return "orange";
            break;
        default:
            return "black";
            break;
    }
   
}

function getPlayerIndex(name) {
    for( var i = 0; i < players.length; i++ ){
        if( players[i].name == name ){
            return i;
        }
    }
}

function getItemIndex(itemName, x, y, z) {
    for( var i = 0; i < items.length; i++ ){
        if( items[i].name == itemName && items[i].x == x && items[i].y == y && items[i].z == z){
            return i;
        }
    }
    
    return -1;
}

function getItemTotalIndex(itemName) {
    for( var i = 0; i < totalItems.length; i++ ){
        if( totalItems[i].name == itemName ){
            return i;
        }
    }
    
    return -1;
}

function getCauseIndex(causeOfDeath) {
    for( var i = 0; i < deathCauses.length; i++ ){
        if( deathCauses[i].name == causeOfDeath ){
            return i;
        }
    }
    
    return -1;
}

function getOpacity(type){
    if( type == "Show" ){
        return 1;
    }
    
    if( type == "Fade" ){
        return 0;
    }
    
    if( type == "Hide" ){
        return 0;
    }
}

function isFilteredOut(d){
    if ( !inTimeRange(d, currStartTime, currEndTime) || !games[d.GameId] ){
        return true;
    }
    if( selectedBar != "NONE" ){
        if( d.Type == "ITEM" ){ 
            if( d.Item != selectedBar ){
                return true;
            }
        }
        else if( d.Type == "DEATH" ){
            if( d.Cause != selectedBar ){
                return true;
            }
        }
        else{
            return true;
        }
    }
    
    return false;
}

function filterTime(start, end){
    
    d3.select("#MainView")
        .selectAll(".movement")
        .style("visibility", "visible")
        .filter(function(d) { return isFilteredOut(d); }) 
        .style("visibility", "hidden");
    
    /* backup filter
    !inTimeRange(d, start, end) || !games[d.GameId];
    */
    
    d3.select("#MainView")
        .selectAll(".death")
        .style("visibility", "visible")
        .filter(function(d) { return isFilteredOut(d); }) 
        .style("visibility", "hidden");    
        
    d3.select("#MainView")
        .selectAll(".kill")
        .style("visibility", "visible")
        .filter(function(d) { return isFilteredOut(d); }) 
        .style("visibility", "hidden");  

    d3.select("#MainView")
        .selectAll(".spawn")
        .style("visibility", "visible")
        .filter(function(d) { return isFilteredOut(d); }) 
        .style("visibility", "hidden");  

    d3.select("#MainView")
        .selectAll(".killLine")
        .style("visibility", "visible")
        .filter(function(d) { return isFilteredOut(d); }) 
        .style("visibility", "hidden");

    d3.select("#MainView")
        .selectAll(".item")
        .style("visibility", "visible")
        .filter(function(d) { return isFilteredOut(d); }) 
        .style("visibility", "hidden");

    d3.select("#MainViewBack")
        .selectAll(".movement")
        .style("visibility", "visible")
        .filter(function(d) { return !inTimeRange(d, start, end) || !games[d.GameId]; }) 
        .style("visibility", "hidden");
        
    d3.select("#MainViewBack")
        .selectAll(".death")
        .style("visibility", "visible")
        .filter(function(d) { return !inTimeRange(d, start, end) || !games[d.GameId]; }) 
        .style("visibility", "hidden");    
        
    d3.select("#MainViewBack")
        .selectAll(".kill")
        .style("visibility", "visible")
        .filter(function(d) { return !inTimeRange(d, start, end) || !games[d.GameId]; }) 
        .style("visibility", "hidden");  

    d3.select("#MainViewBack")
        .selectAll(".spawn")
        .style("visibility", "visible")
        .filter(function(d) { return !inTimeRange(d, start, end) || !games[d.GameId]; }) 
        .style("visibility", "hidden");  

    d3.select("#MainViewBack")
        .selectAll(".killLine")
        .style("visibility", "visible")
        .filter(function(d) { return !inTimeRange(d, start, end) || !games[d.GameId]; }) 
        .style("visibility", "hidden");

    d3.select("#MainViewBack")
        .selectAll(".itemBack")
        .style("visibility", "visible")
        .filter(function(d) { return !inTimeRange(d, start, end) || !games[d.GameId]; }) 
        .style("visibility", "hidden"); 

    updateDeathCauses();   
    updateItems();    
}

var brushCell;

function brushstartTime(p) {
    if (brushCell !== this) {
        d3.select(brushCell).call(timeBrush.clear());
        brushCell = this;
    }
}

function brushmoveTime(p) {
    var e = d3.event.target.extent();
    currStartTime = timeExtent[0];
    currEndTime = timeExtent[1];
    filterTime(timeExtent[0], timeExtent[1]);
    if( e[1] - e[0] >= 1 ){
        currStartTime = e[0];
        currEndTime = e[1];
        filterTime(e[0], e[1]);
    }
}


function brushendTime() {
    
    if( brushTimeLine.empty()){
        currStartTime = timeExtent[0];
        currEndTime = timeExtent[1];
        filterTime(timeExtent[0], timeExtent[1]);
    }
}

var selectedNode;

function selectClick(d){
    /*
    if( selectedNode ){
        var selectedClass = selectedNode.getAttribute("class");
        d3.select(selectedNode)
            .attr( "stroke-width", 2)
            .attr("stroke", function(d) {
                if( selectedClass == "killLine" ){
                    return "cyan";
                }
                else{
                    return "black";
                }    
            });
    }
    */
    d3.event.stopPropagation();
    clearSelections();
    clearTop();
    var selectedId;
    if( d.Type == "DEATH" ){
        selectedId = "#" + d.Type + d.Dead + d.GameId + d.Time;
    }   
    else{
        selectedId = "#" + d.Type + Math.round(d.x) + Math.round(d.y) + Math.round(d.z) + d.GameId + d.Time;
    }
    d3.selectAll(selectedId)
        .attr("stroke-width", 3)
        .attr("stroke", "yellow")
        .style("visibility", "visible");
    //selectedNode = d3.event.target;
    
    d3.select("#typeDetail").text(d.Type);
    d3.select("#timeDetail").text(d.Time);
    
    if( d.Type == "ITEM" ){
        d3.select("#posDetail").text("(" + Math.round(d.x) + "," + Math.round(d.y) + "," + Math.round(d.z) + ")");
        d3.select("#detail2").text("Item: ")
        d3.select("#itemDetail").text(d.Item);
        d3.select("#detail3").text("Count: ")
        d3.select("#deadDetail").text("" + items[getItemIndex(d.Item, d.x, d.y, d.z)].count);
        d3.select("#detail4").text("Type Count: ")
        d3.select("#killerDetail").text("" + totalItems[getItemTotalIndex(d.Item)].count);
    }
    else if( d.Type == "DEATH" ){
        d3.select("#posDetail").text("(" + Math.round(d.dx) + "," + Math.round(d.dy) + "," + Math.round(d.dz) + ")");
        d3.select("#detail2").text("Cause: ")
        d3.select("#itemDetail").text(d.Cause);
        d3.select("#detail3").text("Dead: ")
        d3.select("#deadDetail").text(d.Dead);
        d3.select("#detail4").text("Killer: ")
        d3.select("#killerDetail").text(d.Killer);
    }
    
}

function clearSelections(){

    selectedBar = "NONE";

    d3.select("#MainView")
        .selectAll(".death")
        .attr("stroke", "black")
        .attr( "stroke-width", 2)
        .style("visibility", function(d){
            if( isFilteredOut(d) ){
                return "hidden";
            }
            else{
                return "visible";
            }   
        });
        
    d3.select("#MainView")
        .selectAll(".kill")
        .attr("stroke", "black")
        .attr( "stroke-width", 2)
        .style("visibility", function(d){
            if( isFilteredOut(d) ){
                return "hidden";
            }
            else{
                return "visible";
            }   
        });

    d3.select("#MainView")
        .selectAll(".spawn")
        .attr("stroke", "black")
        .attr( "stroke-width", 2)
        .style("visibility", function(d){
            if( isFilteredOut(d) ){
                return "hidden";
            }
            else{
                return "visible";
            }   
        });

    d3.select("#MainView")
        .selectAll(".killLine")
        .attr("stroke", "cyan")
        .style("visibility", function(d){
            if( isFilteredOut(d) ){
                return "hidden";
            }
            else{
                return "visible";
            }   
        });    

    d3.select("#MainView")
        .selectAll(".item")
        .attr("stroke", "black")
        .attr( "stroke-width", 2)
        .style("visibility", function(d){
            if( isFilteredOut(d) ){
                return "hidden";
            }
            else{
                return "visible";
            }   
        }); 
        
    d3.select("#MainView")
        .selectAll(".movement")
        .style("visibility", function(d){
            if( isFilteredOut(d) ){
                return "hidden";
            }
            else{
                return "visible";
            }   
        });    

    d3.select("#BarChart")
        .selectAll("rect")
        .attr("fill", function(d) { return deathCauseColor(d.name); });
    
    d3.select("#ItemBarChart")
        .selectAll("rect")
        .attr("fill", function(d) { return itemBarColor(d.name); });  

    updateTimes();        

}

function clearTop(){
    d3.select("#MainView")
        .selectAll(".death")
        .style("visibility", "hidden");
        
    d3.select("#MainView")
        .selectAll(".kill")
        .style("visibility", "hidden");

    d3.select("#MainView")
        .selectAll(".spawn")
        .style("visibility", "hidden");

    d3.select("#MainView")
        .selectAll(".killLine")
        .style("visibility", "hidden");    

    d3.select("#MainView")
        .selectAll(".item")
        .style("visibility", "hidden"); 
        
    d3.select("#MainView")
        .selectAll(".movement")
        .style("visibility", "hidden");
        
}

function grayBars(){
    d3.select("#BarChart")
        .selectAll("rect")
        .attr("fill", "gray");
    
    d3.select("#ItemBarChart")
        .selectAll("rect")
        .attr("fill", "gray");
}

function clickCause(d){
    clearSelections();
    clearTop();
    grayBars();
    
    d3.select("#MainView")
        .selectAll(".death")
        .filter(function(d1) { return !isFilteredOut(d1) && d1.Cause == d.name; } )
        .attr("stroke", "yellow")
        .attr("stroke-width", 3)
        .style("visibility", "visible");
        
    d3.select("#MainView")
        .selectAll(".kill")
        .filter(function(d1) { return !isFilteredOut(d1) && d1.Cause == d.name; } )
        .attr("stroke", "yellow")
        .attr("stroke-width", 3)
        .style("visibility", "visible");

    d3.select("#MainView")
        .selectAll(".killLine")
        .filter(function(d1) { return !isFilteredOut(d1) && d1.Cause == d.name; } )
        .attr("stroke", "yellow")
        .attr("stroke-width", 3)
        .style("visibility", "visible");
        
    selectedBar = d.name;  
    selectedBarType = "Cause";
    
    d3.select(d3.event.target)
        .attr("fill", function(d) { return deathCauseColor(d.name); }); 

    updateTimes();        
}


function clickItemBar(d) {
    clearSelections();
    clearTop();
    grayBars();
    
    d3.select("#MainView")
        .selectAll(".item")
        .filter(function(d1) { return !isFilteredOut(d1) && d1.Item == d.name; } )
        .attr("stroke", "yellow")
        .attr("stroke-width", 3)
        .style("visibility", "visible");
        
    selectedBar = d.name;
    selectedBarType = "Item";
        
    d3.select(d3.event.target)
        .attr("fill", function(d) { return itemBarColor(d.name); });
        
    updateTimes();    
}

/* I think this can only be called once as data is being processed for first time. */
function isAlive(d){
    var playerIndex = getPlayerIndex(d.Player);
    if( players[playerIndex].posStatus == "EPOS" && players[playerIndex].currGame == d.GameId ){
        return false;
    }
    if( players[playerIndex].posStatus != "DPOS" && players[playerIndex].posStatus != "EPOS" ){ //If true then alive
        
        if( d.Type == "DPOS" || d.Type == "EPOS" ){
            players[playerIndex].posStatus = d.Type;
        }
        
        return true;
    }
    else{ //Is dead and needs to respawn
        
        if( d.Type == "SPAWN" ){
            if (players[playerIndex].posStatus == "DPOS" || players[playerIndex].currGame < d.GameId ){
                players[playerIndex].currGame = d.GameId;
                //console.log(d.GameId);
                players[playerIndex].posStatus = d.Type;
            }    
        }
        if( d.Type == "EPOS" ){
            players[playerIndex].posStatus = d.Type;
        }
        
        return false;
    }
}

function inTimeRange(d, start, end){
    return d.Time >= start && d.Time <= end;
}

function updateDeathCauses(){
    for( var i = 0; i < deathCauses.length; i++ ){
        deathCauses[i].count = 0;
    }
        
    d3.select("#MainView")
        .selectAll(".death")
        .filter(function(d) { return inTimeRange(d, currStartTime, currEndTime) && games[d.GameId]; } )
        .attr("r", function(d) {
            var causeIndex = getCauseIndex(d.Cause);
            deathCauses[causeIndex].count++;
            return 4;
        });
                
    causeExtent = d3.extent(deathCauses, function(row) {return row.count; });
    causeExtent[0] = 0;
    causeScale = d3.scale.linear().domain(causeExtent).range([250, 30]);
    
    var barWidth = 320 / deathCauses.length;
    
    d3.select("#BarChart")
        .selectAll("rect")
        .transition()
        .duration(1000)
        .attr("y", function(d) { return causeScale(d.count); })
        .attr("x", function(d, i) {return i * barWidth + 40;})
        .attr("height", function(d) { return 250 - causeScale(d.count); })
        .attr("width", barWidth);
        
    var barAxisY = d3.svg.axis().scale(causeScale);   
    barAxisY.orient("left");
        
    d3.select(".barchartYAxis") 
        .call(barAxisY);      
        
}

function updateItems(){
    for( var i = 0; i < totalItems.length; i++ ){
        totalItems[i].count = 0;
    }
        
    d3.select("#MainView")
        .selectAll(".item")
        .filter(function(d) { return inTimeRange(d, currStartTime, currEndTime) && games[d.GameId]; } )
        .attr("width", function(d) {
            if( d.Player != "World" ){
                var itemTotalIndex = getItemTotalIndex(d.Item);
                totalItems[itemTotalIndex].count++;
            }    
            return 8;
        });
                
    itemTotalExtent = d3.extent(totalItems, function(row) {return row.count; });
    itemTotalExtent[0] = 0;
    itemTotalScale = d3.scale.linear().domain(itemTotalExtent).range([250, 30]);
    
    var barWidth = 320 / totalItems.length;
    
    d3.select("#ItemBarChart")
        .selectAll("rect")
        .transition()
        .duration(1000)
        .attr("y", function(d) { return itemTotalScale(d.count); })
        .attr("x", function(d, i) {return i * barWidth + 40;})
        .attr("height", function(d) { return 250 - itemTotalScale(d.count); })
        .attr("width", barWidth);
        
    var barAxisY = d3.svg.axis().scale(itemTotalScale);   
    barAxisY.orient("left");
        
    d3.select(".itemYAxis") 
        .call(barAxisY);      
        
}

function drawTimeLine(){
    var timeWidth = 900 / times.length;    
        
    timeDeathExtent = d3.extent(times, function(row) { 
        if( timeType == "Items" ){
            return row.items; 
        }
        return row.deaths;
    });
    timeDeathExtent[0] = 0;
    timeDeathScale = d3.scale.linear().domain(timeDeathExtent).range([35, 5]);
    
    d3.select("#TimeLine")
        .selectAll(".second")
        .transition()
        .duration(1000)
        .attr("y", function(d) { 
            if( timeType == "Items" ){
                return timeDeathScale(d.items);
            }
            return timeDeathScale(d.deaths);
        })
        .attr("x", function(d, i) { return timeScale(d.time); })
        .attr("height", function(d) { 
            if( timeType == "Items" ){
                return 35 - timeDeathScale(d.items);
            }
            return 35 - timeDeathScale(d.deaths);    
        })
        .attr("width", timeWidth);
    
    var timeAxis = d3.svg.axis().scale(timeScale);    
    
    d3.select("#timelineXAxis") 
        .call(timeAxis);
}

function updateTimes(){
    for( var i = 0; i < times.length; i++ ){
        times[i].deaths = 0;
        times[i].items = 0;
    }
        
    d3.select("#MainView")
        .selectAll(".item")
        .filter(function(d) {
            if( d.Player == "World" ){
                return false;
            }
            if( selectedBarType == "Cause" ){
                return true;
            }
            if( selectedBar != "NONE" && d.Item != selectedBar){
                return false;
            }
            return games[d.GameId]; 
        })
        .attr("width", function(d) {
            times[d.Time].items++;    
            return 8;
        });
        
    d3.select("#MainView")
        .selectAll(".death")
        .filter(function(d) {
            if( selectedBarType == "Item" ){
                return true;
            }
            if( selectedBar != "NONE" && d.Cause != selectedBar){
                return false;
            }
            return games[d.GameId]; 
        })
        .attr("r", function(d) {
            times[d.Time].deaths++;
            return 4;
        });    
    /*    
    var timeWidth = 900 / times.length;    
        
    timeDeathExtent = d3.extent(times, function(row) {return row.deaths; });
    timeDeathExtent[0] = 0;
    timeDeathScale = d3.scale.linear().domain(timeDeathExtent).range([35, 5]);
    
    d3.select("#TimeLine")
        .selectAll(".second")
        .transition()
        .duration(1000)
        .attr("y", function(d) { return timeDeathScale(d.deaths); })
        .attr("x", function(d, i) { return timeScale(d.time); })
        .attr("height", function(d) { return 35 - timeDeathScale(d.deaths); })
        .attr("width", timeWidth);
    
    var timeAxis = d3.svg.axis().scale(timeScale);    
    
    d3.select("#timelineXAxis") 
        .call(timeAxis);  
    */ 
    drawTimeLine();    
}

function initDeaths(){
    d3.csv("DeathData.csv", function(csv) {
        var causeLabels = [];
        deathCauses = [];
    
        for (var i = 0; i < csv.length; i++) {
            csv[i].dx = Number(csv[i].dx);
            csv[i].dy = Number(csv[i].dy);
            csv[i].dz = Number(csv[i].dz);
            csv[i].kx = Number(csv[i].kx);
            csv[i].ky = Number(csv[i].ky);
            csv[i].kz = Number(csv[i].kz);
            var causeIndex = getCauseIndex(csv[i].Cause);
            if( causeIndex == -1 ){
                deathCauses.push({name:csv[i].Cause, count:1});
                causeLabels.push(csv[i].Cause);
            }
            else{
                deathCauses[causeIndex].count++;
            }
            times[csv[i].Time].deaths++;
        }
                
        d3.select("#MainView")
            .selectAll(".killLine")
            .data(csv)
            .enter()
            .append("path")
            .classed("killLine", true)
            .attr("id", function(d) { return "" + d.Type + d.Dead + d.GameId + d.Time;  })
            .attr( "d", function(d) {
                return "M " + xScale(d.kx) + " " + yScale(d.ky) + " L " + xScale(d.dx) + " " + yScale(d.dy);
            })
            .attr( "stroke", "cyan")
            .attr( "stroke-width", 2)
            .on("click", function(d) { selectClick(d); } );
        
        d3.select("#MainView")
            .selectAll(".death")
            .data(csv)
            .enter()
            .append("circle")
            .classed("death", true)
            .attr("id", function(d) { return "" + d.Type + d.Dead + d.GameId + d.Time;  })
            .attr("fill", function(d) { return playerColor(d.Dead); })
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("cx", function(d) { return xScale(d.dx); })
            .attr("cy", function(d) { return yScale(d.dy); })
            .attr("r", 4)
            .on("click", function(d) { selectClick(d); } );
            
        d3.select("#MainView")
            .selectAll(".kill")
            .data(csv)
            .enter()
            .append("rect")
            .classed("kill", true)
            .attr("id", function(d) { return "" + d.Type + d.Dead + d.GameId + d.Time;  })
            .attr("fill", function(d) { return playerColor(d.Killer);})
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("x", function(d) { return xScale(d.kx) - 4; })
            .attr("y", function(d) { return yScale(d.ky) - 4; })
            .attr("width", 8)
            .attr("height", 8)
            .on("click", function(d) { selectClick(d); } );

        d3.select("#MainViewBack")
            .selectAll(".killLine")
            .data(csv)
            .enter()
            .append("path")
            .classed("killLine", true)
            .attr( "d", function(d) {
                return "M " + xScale(d.kx) + " " + yScale(d.ky) + " L " + xScale(d.dx) + " " + yScale(d.dy);
            })
            .attr( "stroke", "gray")
            .attr( "stroke-width", 2)
            .on("click", function(d) { selectClick(d); } );
        
        d3.select("#MainViewBack")
            .selectAll(".death")
            .data(csv)
            .enter()
            .append("circle")
            .classed("death", true)
            //.attr("fill", function(d) { return playerColor(d.Dead); })
            .attr("fill", "gray")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("cx", function(d) { return xScale(d.dx); })
            .attr("cy", function(d) { return yScale(d.dy); })
            .attr("r", 4)
            .on("click", function(d) { selectClick(d); } );
            
        d3.select("#MainViewBack")
            .selectAll(".kill")
            .data(csv)
            .enter()
            .append("rect")
            .classed("kill", true)
            //.attr("fill", function(d) { return playerColor(d.Killer);})
            .attr("fill", "gray")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("x", function(d) { return xScale(d.kx) - 4; })
            .attr("y", function(d) { return yScale(d.ky) - 4; })
            .attr("width", 8)
            .attr("height", 8)
            .on("click", function(d) { selectClick(d); } );        
        
        causeExtent = d3.extent(deathCauses, function(row) {return row.count; });
        causeExtent[0] = 0;
        var causeScaleX = d3.scale.ordinal().domain(deathCauses.map(function (d) { return d.name; })).rangeRoundBands([35, 360]);
        causeScale = d3.scale.linear().domain(causeExtent).range([250, 30]);
        
        var barWidth = 320 / deathCauses.length;
        
        d3.select("#BarChart")
            .selectAll("rect")
            .data(deathCauses)
            .enter()
            .append("rect")
            .attr("y", function(d) { return causeScale(d.count); })
            .attr("x", function(d, i) {return i * barWidth + 40;})
            .attr("height", function(d) { return 250 - causeScale(d.count); })
            .attr("width", barWidth)
            .attr("fill", function(d) { return deathCauseColor(d.name); })
            .on("click", function(d) {clickCause(d);});
            
        var barAxisY = d3.svg.axis().scale(causeScale);   
        barAxisY.orient("left");
        
        var barAxisX = d3.svg.axis().scale(causeScaleX).orient("bottom");
        
        d3.select("#BarChart") 
            .append("g") 
            .classed("barchartYAxis", true)
            .attr("transform", "translate(40, 0)")
            .call(barAxisY);      
            
        d3.select("#BarChart") 
            .append("text") 
            .attr("transform", "rotate(-90)")
            .attr("x", -150)
            .attr("y", 15)
            .style("text-anchor", "middle")
            .text("Count");    

        d3.select("#BarChart") 
            .append("g") 
            .classed("barChartXAxis", true )
            .attr("transform", "translate(0, 250)")
            .style("font-size", "10px")
            .call(barAxisX); 
            
        d3.select("#BarChart")
            .append("text")
            .attr("x", 350)
            .attr("y", 290)
            .style("text-anchor", "middle")
            .text("Cause of Death");
            
        d3.select(".barChartXAxis")
            .selectAll(" .tick > text ")
            .attr("transform", "translate(-30, 15) rotate(-20)");  

        d3.select("#BarChart")
            .append("text")
            .attr("x", 200)
            .attr("y", 15)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "115%")
            .text("Causes of Death");        
            
        var timeWidth = 900 / times.length;
        
        timeDeathExtent = d3.extent(times, function(row) {return row.deaths; });
        timeDeathExtent[0] = 0;
        timeDeathScale = d3.scale.linear().domain(timeDeathExtent).range([35, 5]);
        
        d3.select("#TimeLine")
            .selectAll(".second")
            .data(times)
            .enter()
            .append("rect")
            .attr("class", "second")
            .attr("y", function(d) { return timeDeathScale(d.deaths); })
            .attr("x", function(d, i) { return timeScale(d.time); })
            .attr("height", function(d) { return 35 - timeDeathScale(d.deaths); })
            .attr("width", timeWidth)
            .attr("fill", "red")
            .attr( "stroke", "black" );
        
        var timeAxis = d3.svg.axis().scale(timeScale);    
        
        d3.select("#TimeLine") 
            .append("g") 
            .classed("timelineXAxis", true)
            .attr("transform", "translate(0, 30)")
            .call(timeAxis);

        d3.select("#TimeLine")
            .append("text")
            .attr("x", 450)
            .attr("y", 60)
            .style("text-anchor", "middle")
            .text("Time (seconds)");
        
    });
    
    
}    

function initItems(){
    d3.csv("ItemData.csv", function(csv) {

        items = [];
        totalItems = [];
    
        for (var i=0; i<csv.length; ++i) {
            csv[i].x = Number(csv[i].x);
            csv[i].y = Number(csv[i].y);
            csv[i].z = Number(csv[i].z);
            var itemIndex = getItemIndex(csv[i].Item, csv[i].x, csv[i].y, csv[i].z);
            var itemTotalIndex = getItemTotalIndex(csv[i].Item);
            times[csv[i].Time].items++;
            if( itemTotalIndex == -1 ){
                if( csv[i].Player == "World" ){
                    totalItems.push({name:csv[i].Item, count:0});
                }
                else{
                    totalItems.push({name:csv[i].Item, count:1});
                }
            }
            else{
                if( csv[i].Player != "World" ){
                    totalItems[itemTotalIndex].count++;
                }
                
            }
            if( itemIndex == -1 ){
                if( csv[i].Player == "World" ){
                    items.push({name:csv[i].Item, x:csv[i].x, y:csv[i].y, z:csv[i].z, count:0});
                }
                else{
                    items.push({name:csv[i].Item, x:csv[i].x, y:csv[i].y, z:csv[i].z, count:1});
                }
            }
            else{
                if( csv[i].Player != "World" ){
                    items[itemIndex].count++;
                }    
            }
        }
                
        itemExtent = d3.extent(items, function(row) {return row.count; });
        itemScale = d3.scale.linear().domain(itemExtent).range(["white", "green"]);
        
        d3.select("#MainView")
            .selectAll(".item")
            .data(csv)
            .enter()
            .append("rect")
            .classed("item", true)
            .attr("id", function(d) { return "" + d.Type + Math.round(d.x) + Math.round(d.y) + Math.round(d.z) + d.GameId + d.Time;  })
            .attr("fill", "green")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("x", function(d) { return xScale(d.x); })
            .attr("y", function(d) { return yScale(d.y); })
            .attr("width", 8)
            .attr("height", 8)
            .on("click", function(d) { selectClick(d); } );
            
        d3.select("#MainViewBack")
            .selectAll(".itemBack")
            .data(csv)
            .enter()
            .append("rect")
            .classed("itemBack", true)
            //.attr("fill", "green")
            .attr("fill", "gray")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("x", function(d) { return xScale(d.x); })
            .attr("y", function(d) { return yScale(d.y); })
            .attr("width", 8)
            .attr("height", 8)
            .on("click", function(d) { selectClick(d); } );    
            
            
        itemTotalExtent = d3.extent(totalItems, function(row) {return row.count; });
        itemTotalExtent[0] = 0;
        var itemScaleX = d3.scale.ordinal().domain(totalItems.map(function (d) { return d.name; })).rangeRoundBands([35, 360]);
        itemTotalScale = d3.scale.linear().domain(itemTotalExtent).range([250, 30]);
        
        var barWidth = 320 / totalItems.length;
        
        d3.select("#ItemBarChart")
            .selectAll("rect")
            .data(totalItems)
            .enter()
            .append("rect")
            .attr("y", function(d) { return itemTotalScale(d.count); })
            .attr("x", function(d, i) {return i * barWidth + 40;})
            .attr("height", function(d) { return 250 - itemTotalScale(d.count); })
            .attr("width", barWidth)
            .attr("fill", function(d) { return itemBarColor(d.name); })
            .on("click", function(d) {clickItemBar(d);});
            
        var barAxisY = d3.svg.axis().scale(itemTotalScale);   
        barAxisY.orient("left");
        
        var barAxisX = d3.svg.axis().scale(itemScaleX).orient("bottom");
        
        d3.select("#ItemBarChart") 
            .append("g") 
            .classed("itemYAxis", true)
            .attr("transform", "translate(40, 0)")
            .call(barAxisY);      
            
        d3.select("#ItemBarChart") 
            .append("text") 
            .attr("transform", "rotate(-90)")
            .attr("x", -150)
            .attr("y", 15)
            .style("text-anchor", "middle")
            .text("Count");    

        d3.select("#ItemBarChart") 
            .append("g")
            .classed("itemXAxis", true)
            .attr("transform", "translate(0, 250)")
            .style("font-size", "10px")
            .call(barAxisX);

        d3.select(".itemXAxis")
            .selectAll(" .tick > text ")
            .attr("transform", "translate(-30, 15) rotate(-30)");
            
        d3.select("#ItemBarChart")
            .append("text")
            .attr("x", 360)
            .attr("y", 290)
            .style("text-anchor", "middle")
            .text("Item Type");   

        d3.select("#ItemBarChart")
            .append("text")
            .attr("x", 200)
            .attr("y", 15)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "115%")
            .text("Items Picked Up");

    });
    
    
}    


