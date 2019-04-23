
document.getElementById("get-polled-button").addEventListener("click",(event)=>{
    var req = new XMLHttpRequest();
    req.open("get","/get_polled",false);
    req.send();
    data=JSON.parse(req.responseText);
    window.location.href = data.link;
});
