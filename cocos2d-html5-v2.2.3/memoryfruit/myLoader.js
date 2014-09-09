/**
 * Created by luzexi on 14-9-8.
 */
(function () {

    var d = document;
    var c = d["ccConfig"];

    var loadJsImg = document.getElementById("cocos2d_loadJsImg");
    if(!loadJsImg){
        loadJsImg = document.createElement('img');
        loadJsImg.src = "data:image/gif;base64,R0lGODlhEAAQALMNAD8/P7+/vyoqKlVVVX9/fxUVFUBAQGBgYMDAwC8vL5CQkP///wAAAP///wAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFAAANACwAAAAAEAAQAAAEO5DJSau9OOvNex0IMnDIsiCkiW6g6BmKYlBFkhSUEgQKlQCARG6nEBwOgl+QApMdCIRD7YZ5RjlGpCUCACH5BAUAAA0ALAAAAgAOAA4AAAQ6kLGB0JA4M7QW0hrngRllkYyhKAYqKUGguAws0ypLS8JxCLQDgXAIDg+FRKIA6v0SAECCBpXSkstMBAAh+QQFAAANACwAAAAACgAQAAAEOJDJORAac6K1kDSKYmydpASBUl0mqmRfaGTCcQgwcxDEke+9XO2WkxQSiUIuAQAkls0n7JgsWq8RACH5BAUAAA0ALAAAAAAOAA4AAAQ6kMlplDIzTxWC0oxwHALnDQgySAdBHNWFLAvCukc215JIZihVIZEogDIJACBxnCSXTcmwGK1ar1hrBAAh+QQFAAANACwAAAAAEAAKAAAEN5DJKc4RM+tDyNFTkSQF5xmKYmQJACTVpQSBwrpJNteZSGYoFWjIGCAQA2IGsVgglBOmEyoxIiMAIfkEBQAADQAsAgAAAA4ADgAABDmQSVZSKjPPBEDSGucJxyGA1XUQxAFma/tOpDlnhqIYN6MEAUXvF+zldrMBAjHoIRYLhBMqvSmZkggAIfkEBQAADQAsBgAAAAoAEAAABDeQyUmrnSWlYhMASfeFVbZdjHAcgnUQxOHCcqWylKEohqUEAYVkgEAMfkEJYrFA6HhKJsJCNFoiACH5BAUAAA0ALAIAAgAOAA4AAAQ3kMlJq704611SKloCAEk4lln3DQgyUMJxCBKyLAh1EMRR3wiDQmHY9SQslyIQUMRmlmVTIyRaIgA7";

        var canvasNode = document.getElementById(c.tag);
        canvasNode.style.backgroundColor = "black";
        canvasNode.parentNode.appendChild(loadJsImg);

        var canvasStyle = getComputedStyle?getComputedStyle(canvasNode):canvasNode.currentStyle;
        loadJsImg.style.left = canvasNode.offsetLeft + (parseFloat(canvasStyle.width) - loadJsImg.width)/2 + "px";
        loadJsImg.style.top = canvasNode.offsetTop + (parseFloat(canvasStyle.height) - loadJsImg.height)/2 + "px";
        loadJsImg.style.position = "absolute";
    }

    var loadJsTxt = document.getElementById("cocos2d_loadtJsTxt");
    if(!loadJsTxt)
    {
        //
        loadJsTxt = document.createElement('text');
        var tmptxt = document.createTextNode("正在拼命加载程序...");
        tmptxt.id = "txt";
        loadJsTxt.appendChild(tmptxt);

        var canvasNode = document.getElementById(c.tag);
        canvasNode.style.backgroundColor = "black";
        canvasNode.parentNode.appendChild(loadJsTxt);

        var canvasStyle = getComputedStyle?getComputedStyle(canvasNode):canvasNode.currentStyle;
        loadJsTxt.style.color = "white";
        loadJsTxt.style.left = canvasNode.offsetLeft + (parseFloat(canvasStyle.width) - loadJsTxt.offsetWidth )/2 + "px";
        loadJsTxt.style.top = canvasNode.offsetTop + (parseFloat(canvasStyle.height) + loadJsTxt.offsetHeight*2 )/2 + "px";
        loadJsTxt.style.position = "absolute";
    }

    var updateLoading = function(p){
        if(p>=1) {
            loadJsImg.parentNode.removeChild(loadJsImg);
            loadJsTxt.parentNode.removeChild(loadJsTxt);
        }
    };

    var loaded = 0;
    var que = [c.SingleEngineFile];


    var loadHandlerIE = function (loaded){
        loadNext();
        updateLoading(loaded / que.length);
        this.removeEventListener('load', loadHandlerIE, false);
    };
    var loadNext = function () {
        i++;
        if (i < que.length) {
            var f = d.createElement('script');
            f.src = que[i];
            f.addEventListener('load', loadHandlerIE.bind(f, loaded), false);
            d.body.appendChild(f);
        }
        updateLoading(i / (que.length - 1));
    };
    var loadHandler = function (){
        loaded++;
        updateLoading(loaded / que.length);
        this.removeEventListener('load', loadHandler, false);
    };

    if (navigator.userAgent.indexOf("Trident/5") > -1) {
        //ie9
        var i = -1;

        loadNext();
    }
    else {
        que.forEach(function (f, i) {
            var s = d.createElement('script');
            s.async = false;
            s.src = f;
            s.addEventListener('load', loadHandler, false);
            d.body.appendChild(s);
        });
    }
})();
