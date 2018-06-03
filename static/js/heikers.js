
var myHNIdKey = "myHNId";

function setTimeString() {
    var  current_time_milliseconds = new Date().getTime();

    // update the "last update" timestamp
    var lastUpdateElement = document.getElementById("pageUpdateTimestamp");
    var lastUpdateElementTimestamp = parseInt(lastUpdateElement.dataset.timestamp) * 1000;
    lastUpdateElement.innerText = "Last Updated: " + millisecondsToStr(current_time_milliseconds - lastUpdateElementTimestamp) + " ago";

    // update the time string for each article
    var articleTimes = document.getElementsByClassName("submissionTimestamp");
    for(i = 0; i < articleTimes.length; i++) {
        var at = articleTimes[i];
        var t = parseInt(at.dataset.timestamp)*1000;
        at.innerText = millisecondsToStr(current_time_milliseconds - t) + " ago";
    }
}

function setHnIdButtonText() {
    var myHNID = localStorage.getItem(myHNIdKey);
    var setHnIdButton = document.getElementById("setHNIdButton");

    if (myHNID) {
        setHNIdButton.text = myHNID;
    }
}

function setMyHNID() {
    var currentHNId = localStorage.getItem(myHNIdKey);
    var setHnIdButton = document.getElementById("setHNIdButton");

    if (currentHNId) {
        var myId = prompt("My Hacker News ID (Empty string to clear HN ID):", currentHNId);    
    } else {
        var myId = prompt("My Hacker News ID (Empty string to clear HN ID):", "");
    }
    
    if (myId == null) {
        console.log("null input");
    } else if(myId == "") {
        console.log("empty string input");
        setHNIdButton.text = "Set Hacker News ID";
        localStorage.removeItem(myHNIdKey);
        localStorage.removeItem("maxId");
        localStorage.removeItem("mySubmissionsHTML");
    } else if(myId != currentHNId) {
        setHNIdButton.text = myId;
        localStorage.setItem(myHNIdKey, myId);
        updateMySubmissionsSection(true);
        console.log("Hello " + myId + "! How are you today?");
    }
}

function refreshSubmissionListHTML(submissionList, nsofar) {
    // try five ids at a time until I get five submissions
    if(nsofar == 0) {
        localStorage.setItem("mySubmissionsHTML", "");
    }

    if (submissionList.length > 0 && nsofar < 5) {
        var sid = submissionList.shift();
        getSub(sid).then(
            // construct inner HTML if this is a submission
            json => {
                if (json.hasOwnProperty("type") && json.type != "comment") {
                    console.log("construct item " + nsofar);
                    appendedHTML = appendHTML(json, nsofar);
                    localStorage.setItem("mySubmissionsHTML", localStorage.getItem("mySubmissionsHTML") + appendedHTML);
                    refreshSubmissionListHTML(submissionList, nsofar + 1);
                } else {
                    console.log("skipped a comment");
                    refreshSubmissionListHTML(submissionList, nsofar);
                }
            }
            );
    }
}

function appendHTML(json, nsofar) {
    var mySubmissionsSection = document.getElementById("mySubmissionsSection");
    var html = `<div class="cell">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td width="auto" valign="middle">
                                <span class="item_hot_topic_title">
                                    <a href="https://news.ycombinator.com/item?id=${json.id}" class="node"><i class="fas fa-comment"></i></a>&nbsp;
                                    <a href="${json.url}">${json.title}</a>
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>`
    if(nsofar == 0) {
        mySubmissionsSection.innerHTML = html;
    } else {
        mySubmissionsSection.innerHTML += html;    
    }
    return html;
}

async function getSub(sid) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${sid}.json`);
    const json = await response.json();
    return json
}



function formatMySubmissionsHTML(responseJson, forceRefresh) {
    var maxId = responseJson["submitted"][0];

    if(forceRefresh) {
        localStorage.setItem("maxId", maxId);
        refreshSubmissionListHTML(responseJson["submitted"], 0);
    } else {
        var mySubmissionsSection = document.getElementById("mySubmissionsSection");
        var myId = localStorage.getItem(myHNIdKey);
        var savedMaxId = localStorage.getItem("maxId");
        if(savedMaxId && savedMaxId == maxId) {
            var mySubmissionsHTML = localStorage.getItem("mySubmissionsHTML");
            if(mySubmissionsHTML) {
                mySubmissionsSection.innerHTML = mySubmissionsHTML;
            } else {
                refreshSubmissionListHTML(responseJson["submitted"], 0);
            }
        } else {
            localStorage.setItem("maxId", maxId);
            refreshSubmissionListHTML(responseJson["submitted"], 0);
        }
    }
}

function updateMySubmissionsSection(forceRefresh) {
    var currentHNId = localStorage.getItem(myHNIdKey);
    var mySubmissionsSection = document.getElementById("mySubmissionsSection");
    var errorHTML = `<span class='fade'>Error when pulling submissions for ${currentHNId}.</span>`;
    var loadingHTML = "<span class='fade'>Loading <img src = '/static/img/loading.svg'></span>"
    var noActivityHTML = `<span class='fade'>ID ${currentHNId} not found. <br><br>Or you do not have any submissions. Go <a href='https://news.ycombinator.com/submit'><strong>Submit some!</strong></a></span>`

    if (currentHNId) {
        mySubmissionsSection.innerHTML = loadingHTML;
        
        var apiURL = `https://hacker-news.firebaseio.com/v0/user/${currentHNId}.json`;

        var xhttp = new XMLHttpRequest();
        xhttp.onload = function(e) {
            if(xhttp.readyState == 4 && xhttp.status == 200) {
                var responseText = xhttp.responseText;
                if(responseText == "null") {
                    mySubmissionsSection.innerHTML = noActivityHTML;
                } else {
                    responseJson = JSON.parse(responseText);

                    if(responseJson.hasOwnProperty("submitted")) {
                        formatMySubmissionsHTML(responseJson, forceRefresh);
                    } else {
                        mySubmissionsSection.innerHTML = noActivityHTML;
                    }
                }
            } else {
                mySubmissionsSection.innerHTML = errorHTML;
                console.log("error " + xhttp.statusText);
            }
        };

    xhttp.open("GET", apiURL, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
    }

}


