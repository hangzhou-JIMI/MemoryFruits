/**
 * Created by luzexi on 14-9-8.
 */
(function () {

    var d = document;
    var c = d["ccConfig"];

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
        loadJsTxt.style.top = canvasNode.offsetTop + (parseFloat(canvasStyle.height) + loadJsTxt.offsetHeight )/2 + "px";
        loadJsTxt.style.position = "absolute";
    }

    var updateLoading = function(p){
        if(p>=1) {
//            loadJsImg.parentNode.removeChild(loadJsImg);
            loadJsTxt.parentNode.removeChild(loadJsTxt);
        }
//        var node = loadJsTxt.lastChild;
//        node.nodeValue = "%"+p;
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
