/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

/**
 * resource type
 * @constant
 * @type Object
 */
cc.RESOURCE_TYPE = {
    "IMAGE": ["png", "jpg", "bmp", "jpeg", "gif"],
    "SOUND": ["mp3", "ogg", "wav", "mp4", "m4a"],
    "XML": ["plist", "xml", "fnt", "tmx", "tsx"],
    "BINARY": ["ccbi"],
    "FONT": "FONT",
    "TEXT": ["txt", "vsh", "fsh", "json", "ExportJson"],
    "UNKNOW": []
};

/**
 * resource structure
 * @param resList
 * @param selector
 * @param target
 * @constructor
 */
cc.ResData = function (resList, selector, target) {
    this.resList = resList || [];
    this.selector = selector;
    this.target = target;
    this.curNumber = 0;
    this.loadedNumber = 0;
    this.totalNumber = this.resList.length;
};

/**
 * A class to preload resources async
 * @class
 * @extends cc.Class
 */
cc.Loader = cc.Class.extend(/** @lends cc.Loader# */{
    _curData: null,
    _resQueue: null,
    _isAsync: false,
    _scheduler: null,
    _running: false,
    _regisiterLoader: false,

    /**
     * Constructor
     */
    ctor: function () {
        this._scheduler = cc.Director.getInstance().getScheduler();
        this._resQueue = [];
    },

    /**
     * init with resources
     * @param {Array} resources
     * @param {Function|String} selector
     * @param {Object} target
     */
    initWithResources: function (resources, selector, target) {
        if (!resources) {
            cc.log("cocos2d:resources should not null");
            return;
        }
        var res = resources.concat([]);
        var data = new cc.ResData(res, selector, target);
        this._resQueue.push(data);

        if (!this._running) {
            this._running = true;
            this._curData = this._resQueue.shift();
            this._scheduler.scheduleUpdateForTarget(this);
        }
    },

    setAsync: function (isAsync) {
        this._isAsync = isAsync;
    },

    /**
     * Callback when a resource file loaded.
     */
    onResLoaded: function (err) {
        if(err != null){
            cc.log("cocos2d:Failed loading resource: " + err);
        }

        this._curData.loadedNumber++;
    },

    /**
     * Get loading percentage
     * @return {Number}
     * @example
     * //example
     * cc.log(cc.Loader.getInstance().getPercentage() + "%");
     */
    getPercentage: function () {
        var percent = 0, curData = this._curData;
        if (curData.totalNumber == 0) {
            percent = 100;
        }
        else {
            percent = (0 | (curData.loadedNumber / curData.totalNumber * 100));
        }
        return percent;
    },

    /**
     * release resources from a list
     * @param resources
     */
    releaseResources: function (resources) {
        if (resources && resources.length > 0) {
            var sharedTextureCache = cc.TextureCache.getInstance(),
                sharedEngine = cc.AudioEngine ? cc.AudioEngine.getInstance() : null,
                sharedParser = cc.SAXParser.getInstance(),
                sharedFileUtils = cc.FileUtils.getInstance();

            var resInfo, path, type;
            for (var i = 0; i < resources.length; i++) {
                resInfo = resources[i];
                path = typeof resInfo == "string" ? resInfo : resInfo.src;
                type = this._getResType(resInfo, path);

                switch (type) {
                    case "IMAGE":
                        sharedTextureCache.removeTextureForKey(path);
                        break;
                    case "SOUND":
                        if (!sharedEngine) throw "Can not find AudioEngine! Install it, please.";
                        sharedEngine.unloadEffect(path);
                        break;
                    case "XML":
                        sharedParser.unloadPlist(path);
                        break;
                    case "BINARY":
                        sharedFileUtils.unloadBinaryFileData(path);
                        break;
                    case "TEXT":
                        sharedFileUtils.unloadTextFileData(path);
                        break;
                    case "FONT":
                        this._unregisterFaceFont(resInfo);
                        break;
                    default:
                        throw "cocos2d:unknown filename extension: " + type;
                        break;
                }
            }
        }
    },

    update: function () {
        if (this._isAsync) {
            var frameRate = cc.Director.getInstance()._frameRate;
            if (frameRate != null && frameRate < 20) {
                cc.log("cocos2d: frame rate less than 20 fps, skip frame.");
                return;
            }
        }

        var curData = this._curData;
        if (curData && curData.curNumber < curData.totalNumber) {
            this._loadRes();
            curData.curNumber++;
        }

        var percent = this.getPercentage();
        if(percent >= 100){
            this._complete();
            if (this._resQueue.length > 0) {
                this._running = true;
                this._curData = this._resQueue.shift();
            }
            else{
                this._running = false;
                this._scheduler.unscheduleUpdateForTarget(this);
            }
        }
    },

    _loadRes: function () {
        var sharedTextureCache = cc.TextureCache.getInstance(),
            sharedEngine = cc.AudioEngine ? cc.AudioEngine.getInstance() : null,
            sharedParser = cc.SAXParser.getInstance(),
            sharedFileUtils = cc.FileUtils.getInstance();

        var resInfo = this._curData.resList.shift(),
            path = this._getResPath(resInfo),
            type = this._getResType(resInfo, path);

        switch (type) {
            case "IMAGE":
                sharedTextureCache.addImageAsync(path, this.onResLoaded, this);
                break;
            case "SOUND":
                if (!sharedEngine) throw "Can not find AudioEngine! Install it, please.";
                sharedEngine.preloadSound(path, this.onResLoaded, this);
                break;
            case "XML":
                sharedParser.preloadPlist(path, this.onResLoaded, this);
                break;
            case "BINARY":
                sharedFileUtils.preloadBinaryFileData(path, this.onResLoaded, this);
                break;
            case "TEXT" :
                sharedFileUtils.preloadTextFileData(path, this.onResLoaded, this);
                break;
            case "FONT":
                this._registerFaceFont(resInfo, this.onResLoaded, this);
                break;
            default:
                throw "cocos2d:unknown filename extension: " + type;
                break;
        }
    },

    _getResPath: function (resInfo) {
        return typeof resInfo == "string" ? resInfo : resInfo.src;
    },

    _getResType: function (resInfo, path) {
        var isFont = resInfo.fontName;
        if (isFont != null) {
            return cc.RESOURCE_TYPE["FONT"];
        }
        else {
            var ext = path.substring(path.lastIndexOf(".") + 1, path.length);
            var index = ext.indexOf("?");
            if (index > 0) ext = ext.substring(0, index);

            for (var resType in cc.RESOURCE_TYPE) {
                if (cc.RESOURCE_TYPE[resType].indexOf(ext) != -1) {
                    return resType;
                }
            }
            return ext;
        }
    },

    _complete: function () {
        cc.doCallback(this._curData.selector,this._curData.target);
    },

    _registerFaceFont: function (fontRes,seletor,target) {
        var srcArr = fontRes.src;
        var fileUtils = cc.FileUtils.getInstance();
        if (srcArr && srcArr.length > 0) {
            var fontStyle = document.createElement("style");
            fontStyle.type = "text/css";
            document.body.appendChild(fontStyle);

            var fontStr = "@font-face { font-family:" + fontRes.fontName + "; src:";
            for (var i = 0; i < srcArr.length; i++) {
                fontStr += "url('" + fileUtils.fullPathForFilename(encodeURI(srcArr[i].src)) + "') format('" + srcArr[i].type + "')";
                fontStr += (i == (srcArr.length - 1)) ? ";" : ",";
            }
            fontStyle.textContent += fontStr + "};";

            //preload
            //<div style="font-family: PressStart;">.</div>
            var preloadDiv = document.createElement("div");
            preloadDiv.style.fontFamily = fontRes.fontName;
            preloadDiv.innerHTML = ".";
            preloadDiv.style.position = "absolute";
            preloadDiv.style.left = "-100px";
            preloadDiv.style.top = "-100px";
            document.body.appendChild(preloadDiv);
        }
        cc.doCallback(seletor,target);
    },

    _unregisterFaceFont: function (fontRes) {
        //todo remove style
    }
});

/**
 * Preload resources in the background
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.Loader}
 * @example
 * //example
 * var g_mainmenu = [
 *    {src:"res/hello.png"},
 *    {src:"res/hello.plist"},
 *
 *    {src:"res/logo.png"},
 *    {src:"res/btn.png"},
 *
 *    {src:"res/boom.mp3"},
 * ]
 *
 * var g_level = [
 *    {src:"res/level01.png"},
 *    {src:"res/level02.png"},
 *    {src:"res/level03.png"}
 * ]
 *
 * //load a list of resources
 * cc.Loader.preload(g_mainmenu, this.startGame, this);
 *
 * //load multi lists of resources
 * cc.Loader.preload([g_mainmenu,g_level], this.startGame, this);
 */
cc.Loader.preload = function (resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    this._instance.initWithResources(resources, selector, target);
    return this._instance;
};

/**
 * Preload resources async
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.Loader}
 */
cc.Loader.preloadAsync = function (resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    this._instance.setAsync(true);
    this._instance.initWithResources(resources, selector, target);
    return this._instance;
};

/**
 * Release the resources from a list
 * @param {Array} resources
 */
cc.Loader.purgeCachedData = function (resources) {
    if (this._instance) {
        this._instance.releaseResources(resources);
    }
};

/**
 * Returns a shared instance of the loader
 * @function
 * @return {cc.Loader}
 */
cc.Loader.getInstance = function () {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    return this._instance;
};

cc.Loader._instance = null;


/**
 * Used to display the loading screen
 * @class
 * @extends cc.Scene
 */
cc.LoaderScene = cc.Scene.extend(/** @lends cc.LoaderScene# */{
    _logo: null,
    _logoTexture: null,
    _texture2d: null,
    _bgLayer: null,
    _label: null,
    _winSize: null,

    /**
     * Constructor
     */
    ctor: function () {
        cc.Scene.prototype.ctor.call(this);
        this._winSize = cc.Director.getInstance().getWinSize();
    },
    init: function () {
        cc.Scene.prototype.init.call(this);

        //logo
        var logoWidth = 160;
        var logoHeight = 200;
        var centerPos = cc.p(this._winSize.width / 2, this._winSize.height / 2 + 150);

        this._logoTexture = new Image();
        var _this = this, handler;
        this._logoTexture.addEventListener("load", handler = function () {
            _this._initStage(centerPos);
            this.removeEventListener('load', handler, false);
        });
        //this._logoTexture.src = "data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAlAAD/4QMpaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MCA2MS4xMzQ3NzcsIDIwMTAvMDIvMTItMTc6MzI6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjM4MDBEMDY2QTU1MjExRTFBQTAzQjEzMUNFNzMxRkQwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjM4MDBEMDY1QTU1MjExRTFBQTAzQjEzMUNFNzMxRkQwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgV2luZG93cyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkU2RTk0OEM4OERCNDExRTE5NEUyRkE3M0M3QkE1NTlEIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkU2RTk0OEM5OERCNDExRTE5NEUyRkE3M0M3QkE1NTlEIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/+4ADkFkb2JlAGTAAAAAAf/bAIQADQkJCQoJDQoKDRMMCwwTFhENDREWGhUVFhUVGhkUFhUVFhQZGR0fIB8dGScnKionJzk4ODg5QEBAQEBAQEBAQAEODAwOEA4RDw8RFA4RDhQVERISERUfFRUXFRUfKB0ZGRkZHSgjJiAgICYjLCwoKCwsNzc1NzdAQEBAQEBAQEBA/8AAEQgAyACgAwEiAAIRAQMRAf/EALAAAAEFAQEAAAAAAAAAAAAAAAQAAgMFBgcBAQEAAwEBAAAAAAAAAAAAAAAAAQMEAgUQAAIBAgIEBwoLBgQGAwAAAAECAwAEEQUhMRIGQVFxsTITFGGBwdEiQlKSMzWRoeFicqKyI1NzFYJjJDQWB9KjVCbxwkNkJWXik3QRAAIBAgMFBQcDBQEAAAAAAAABAhEDIRIEMUFRcTJhwVIUBZGhsSJyEzOB0ULhYpIjUxX/2gAMAwEAAhEDEQA/AMJSpUqAVKlXuFAeUq9wpUB5XuFe4V6ooDzZHDox0CnGMinzwl7Z8NajaHeoO3vmTBZBtp9YUIqTEV5ROxHKnWRnaU8VRMhFBUjpV7hSoSeUq9pUB5Sr2lhQHlKvcK8oBV7hSFSRrtaKAZs07YNPM1pG2xJIAw1jSeandry/8X4m8VCKkWwaWwam7Xl/4v1W8VLtmX/i/VbxUoKkWwakSM407tmX/i/VbxUmzGwjQsjdY41IARie/U0IbZO0kNtCXnOCkEBeFu4KI3Bs7DNb27ya+jDx3kJeEnpJJEcQVbWDsk17u5urd591ucZkWhym2Vnd9RkCDEpFxDRpbw0bunu5mlp2De2FMLYXOD2wB2xbOeraUcYGJ72mlSUiqzzdzMd3Z3mixltA2yzcK/NlHM1DQyRXce1HocdNOEfJXZ88y9ZojOqhiBszIRiHQ8Y4cK5TvHuzLljHNMqxNoDjLFraHHnjPxcNCGVbxEUzYNTx5jZSxhpW6qTzlwJ+DCvO2Zf+L9VvFSgqyHYNLYNTdssPxfibxUu15f8Ai/VPiqCakOwa82DU/a8v/F+JvFTDdWPBL8R8VKCvYRYV5UzoMAy6QdIIqI0B4KJtxiRQwou16QoGUkntH5Tz0RbZbmF2hktraSVBo2lUkY8tDye0flPPXTslVUyiyVRsjqUOA4yMT8dW2ram2m6UVTNq9S7EIyUVJydMTn/6DnP+im9Wl+g5z/opvVrpteEhQWY4AaSTwAVf5WPiZh/9S5/zj7zltzlmYWkfWXNvJDGTgGcYDHirR7i7mSbwXParsFMrgb7w6jKw/wCmnc9I14kF3vpvCljbMyWMOJL4aEiB8qU/ObUK7HYWVrl1pFZWiCOCBQqKOLjPGTrNZZqKbUXVHq2nNwTuJRk1VpbgXN8s7Rk5ym0UQQzhIG2NAjhxHWbI+gCBVjBBFbwxwQqEiiUJGg1BVGAFe7dV28WYLYZFmF2Th1UD7JGjymGyn1iK5OyzIBGB1HgrLZhamzumQAGJwSqnSCh1q3GOCodxt4cxurdcpzuN4cyhiWaF5Bg09udUmnWw1H/jV9nFuJ7Quo+8h8peThFA+047vduyMtk7fYqTl07YFdfUufMPzT5p71UdtlmYXaGS2t3mQHAsgxANdadYJopLe4QS2867EsZ4QfCNYrCFbjdDPmgkYyWFxgVf04ifJf6ScNdRUW1XBb6FU5TjF5EpSSrGu/s5lN+g5z/opvVpfoOc/wCim9WtdHnatvObJXDW7xLGhB8nrPaY9/HCr+tEdPCVaSeDoYLnqF63lzW4/PFSW3ecxbI84VSzWUwUaSdg0DXXK5nvAipnd6qgKvWnQO7pri9ZUEmm3Vl2j1kr8pRlFRyquBNZjGxQ/S56Y1S2fu9OVueon11Szahoou06QoQUXadIVCD2FJJ7R+U89dMydv8Axdn+TH9muZye0flPPXQstlK5Tbka1gUjlC1q0vVLkeb6r+O3Tx9xcY1nt8c0NrZCyiOE1108NYjGv1joo7Js1jzKyScYLIvkzL6LDwHXVJksH9Sb49dKNq0tj1jA6uriOCL+02FWX7iVtZX1/AzaHTyeoauKn2MX9W79zebiZCuR5MjSrhfXuEtwTrUeZH+yNfdrRNcxI6IzhXlJEak6WIGJ2Rw4ChWnChndtlVBLMdQA0k1gbXNMzzDfDLs6mjaPKppJbWwJ1bOwwxw43OnHh71YT3DpfWUJmFlb5jHHDdeXBHIsrRea5TSqvxqG04cNN62vetoCS4tre5mgnkGE9q+3DKOkuI2WX6LDQRRHWDh1UCtwj7QRg2wdl8Djgw1qe7XvW0BQ3kfZ7mSLgU+T9E6RVbnuVrnWVSWqj+Lt8ZbRuHEdKPkYVcZ2MJY5fSGyeVar45+rkWQHAqccalPE5km1htWK5nK4Wnt5FuUBUwOMG4nGkA/BXUrW4S6torlOjMgcd/xVn7rLo7zKs0uEjCNeSvdwoBhgsZxX1l2j36k3Lu+uyprdj5Vs5A+i/lD48a0aaVJOPi7jB6lbzWozpjB48pf1NDXNN4vfl7+Z4BXS65pvF78vfzPAK71XTHmZ/S/yT+jvJ7L3fHytz1E+upbL+Qj5W56jfXWRnsIYKLtekKEFGWvSFQgyjk9o/Keet3YthlMP/5x9msJJ7R+U89biyb/AMXEv7gD6tadL1T+kwepRrC39ZkLDMbiwMvUHRPG0bjlGg8ore/23sxBldxfMPLupNhT8yL/AORNZbdzJ484scytxgLqJY5LZj6Q2sV5G1Vud1mjjyG0ij0NEGSZToKyhjtqw4waztuiXA3qKTbSxltfGhbZlE95ZtZqxVbgiOZhrER9ph3Svk9+pJILZ4Y4DGBFCUMKjRsGPobPFhUfW0NJmljE2xJcIrcI2vFUEln1lRXd6lrazXT9GCNpD+yNqoI7mOVduNw6nzlOIoPOUa6yye1XXcbMR5GdQ3xY0BSbj31/FcTQZirJ+q431q7anbHCTZ72Bw7lbPrKBMcBWNNgbMBBh+bsjBdni0VJ1lARZs6yWiupxCuMDy6KpS2IwOo6DTr3Mre3e5tZZVUM4ZBjqOOJoWO4jkXajcOOMHGgDISvWIrdAkKR80+TzVl908bPPL3LzxOuHdifxVfiTAg92qI/w+/8gGgSyN/mR7XPVlp0lF/3L3mbVKtu5Hjbk/8AHE2Fc03i9+Xv5ngFdKNc13i9+Xv5ngFaNV0x5nn+l/kn9HeEWXu+PlbnqJ9dS2Xu9OVueon11kZ7CGCjLXpCgxRlr0hUIPYUcntH5Tz1s8vb+Bt1/dqPirGSe0flPPWusG/g4Py15q06XqlyMWvVYQ+ruI9xJOqzO9hOto/sP8tbGOFIrmWeM7IuMDMnAXXQJOUjQeOsJk0nY96ip0CYunrjaHx1t+srPJUbXBm2LrFPikwTOb+T+VhbZxGMrDXp83x1QSy2tucJpUjPETp+Cn5/ftaRvKvtp3Kx48HG3erHMzOxZiWZtLMdJNQSbbL71Vk6yynViOkqnEEfOWtPbXi3EQkGg6mXiNckjeSJxJGxR10qw0GtxuxmvbImD4CZMFlA4fRfv0BqesqqzTMZNMEDbIHtHH2QeCiZJSqMQdOGiue53mz3czQwsRbIcNHnkec3c4qAMuriz68gTIToxwOOnlp0MjxMJYW741Gs3RVldtbygE/dMcHX/moDaxTiWNZB53B3arb8/wC+4SOF4sf/AKxU9kcBsfOGHfoUHtG/RbzY5Die5HHhXdvavqiZ9Q8Jdlq4/gbKua7xe/L38zwCuhpf2Uk/Zo50kmwJKIdogDjw1VzzeL35e/meAVp1LTgqY4nn+mRauzqmqwrjzCLL3fHytz1E+upLL+Qj5W56jfXWRnroYKLtekKEFF2vSFQg9hSSe0flPPWosm/hIfoLzVl5PaPynnrRWb/w0X0F5q06XqlyM2sVYx5gmbFre/t71NY2T+0h8VbSO5SWNJUOKSAMp7jDGspmMPaLRlXS6eWve1/FRO7WYdbZm1Y/eW/R7qHxHRXGojlm3ulid6aVbaW+OALvgCLq2Hm9WxHKWqjhj6xsK1e8dm15l4niG1LZkswGsxtrPeOmsvayBJA1VItlWjptLuTdPMo7LtjRDq9naK4+WF9IrUW7BaHOljGqVHB7w2hzVoZt87d8vaNYSLl02CcRsDEbJbj71Uu7UBkvJ7/D7q2QoDxySaAO8MTXdxRVMpRp5XZOWdF/ms7R5XdyKfKWJsO/5PhrG5XlNxmEywW6bTnTxAAcJNbGSMXkM1pjgbiNo1PziPJ+Os7u7m/6ReM00ZOgxSpqYYHT3wRXMKN4ll9zUG4bQfNshu8sZVuEA2hirA4qe/VOwwrVbzbww5mI44UKRRYkbWG0S3JWctbd7u5WFfOOLHiUdJqmaipfLsIsObhWe001lMkMVvJNjhghIALMcBxCs7fxXQmkupx1bXDswGPlaTidVaEyKNXkoo4eBV+Sq7L7Vs9zcBgeyQ4GQ/MB1crmoim2orezqcowTuSeEY48jQ7oZX2PLzdyLhNd6RjrEY6I7+uspvH78vfzPAK6UAAAFGAGgAcArmu8Xvy9/M8ArTfio24RW5nnaG67uou3H/KPuqT2X8hHytz1G+upLL3enK3PUb66ys9RDBRdr0hQgou06QqEGUkntH5Tz1e238vF9BeaqKT2j8p56vbb+Xi+gvNWjTdUuRn1XTHmTh8KrJTJlt8t1CPIY44cGnpJVjTJYkmjaN9Ib4u7V923njTethRauZJV3PaW1rfLIiXEDYg6R4VYc9CXW7thfOZbKdbGZtLW8uPVY/u3GrkNUkM9zlcxUjbhfWOA90cRq4gv4LhdqN+VToNYWmnRm9NNVWNTyHc6VWBv8wt4YeHqm6xyPmroq1Z7WGFLSxTq7WLSuPSdjrkfumq5yHXDUeA92oO2SKpVumNAaoJLMXH3myp0rpJ4uKhc3tbDM5BMri1zAj79j7KTiY8TcdBpcsith0286o+sPCagEX9Pzg4zXUCp6QYse8oouCG3tk6m1BYv05W6T+IdyolxbHDAAa2OgDlNCz3ryN2WxBd5PJMg1t81eId2ukqnLlTBbfcuY+9uJLiRcvtPvHdsHK+cfRHcHDWsyawjyy0WBcDI3lTP6TeIcFV+S5OmXx9bJg1048o8Cj0V8Jq2DVu09nL80up7OxHi+oal3P8AXB/IsZS8T/YOV65zvCcc7vfzPAK3ivWCz445zeH954BXOr6I8yfSfyz+jvCLP3fHytz1G+upLP3fHytz1E+usbPaQ0UXadIUIKLtekKhB7Ckk9o/Keer22/l4/oLzVRSe0flPPV7b/y8X0F5q0abqlyM+q6Y8yQsBTDMor1o8aiaE1pbluMqS3sbLLHIhSRQyngqukhaJ9uBjo+H5aOa3ao2t34qouRlLajTalGP8v0IY8ylXQ+PKPFU/bYXOLPge6CKia0LaxTOxHu1Q7cuBd9yPEJ7TbjXKO8CajbMIF6CNIeNvJHjqIWJ7tSpYkalqVblwIdyG+RGXur0hXYJFxal+Dhq5y3slkv3Y2pD0pTr+QUClpJRUdo9XW4OLrTHtM16cZLLWkeC7y4jvlNEpcRtw1Ux27Ci448NZrTFy3nn3IQWxlgGrDZ3pza7/M8ArZo+ArF5171uvp+CqdV0R5l/psUrs2vB3hdl7vTlbnqJ9dS2Xu+PlbnqJ9dY2eshooq16QoQUXa9IVCD2FLJ7RuU89WNtmUSQqkgYMgw0accKrpPaPynnrZWG4Vi+VWmY5tnMWXG+XrIYnA0rhj0mdcTgdNdwnKDqjmduM1SRR/qlr8/4KX6pa8T/BVzDuLZXudRZblmbxXcPUNPc3KqCIwrbOzgrHEnHjoyD+3eSXkht7DeKG4umDGOJVUklfouThXfmbnZ7Cvy1vt9pmv1W1+d8FL9VteJvgq5yrcOGfLmzHN80iyyETPbptAEFo2ZG8pmUa1OFNn3Ky6W/sbDKM5hv5bx2WTZA+7RF2y52WOPJTzE+z2Dy1vt9pT/AKpacTerS/U7Tib1a04/t7kDXPY03jhN0W6sQ7K7W3q2dnrMccaDy/8At80kuZfqWYxWNtlcvUPPhiGYhWDeUy7IwYU8xPs9g8tb7faUn6pacTerTxm9oOBvVq3v9z927aynuId44LiWKNnjhAXF2UYhRg516qpsryjLr21665zFLSTaK9U2GOA87SwqY37knRU+BzOzags0s1Oyr+BKM6sxwP6tSDPLMen6vy0rvdm3Sxlu7K/S7WDDrFUDUTxgnTU826eXW7KlxmqQuwDBXUKcD+1Xee/wXuKX5XDGWLapSVcOyhEM/seJ/V+WnjeGx4pPV+Wkm6kKZlFay3Jlt7iFpYZY8ASVK6DjtDDA0f8A0Tl340/1f8Ndx8xJVWXB0KbktFFpNzdVXAC/qOwA0CQni2flrO3Vwbm5lnI2TKxbDirX/wBE5d+NcfV/wVR7xZPa5U9utvI8nWhmbbw0YEAYYAVxfhfy5rlKR4Fulu6X7mW1mzT8S4Yis/5CPlbnqJ9dSWfu9OVueon11mZvQ2i7XpChKKtekKhBlNJ7R+U89bDfGTb3a3ZX0Lcj6kdY+T2j8p560288m1kWQr6MJ+ylSAr+2cnV5renjs3H1loX+3j9XvbbtxLN9lqW4UnV5jdnjtXHxihtyZNjeSBu5J9k1BJe7xy7W5CJ/wCzuD/mTVTf2+fq97LJuLrPsNRueS7W6aJ/38x+vLVXuY+xvHaNxbf2GoCezf8A36j/APsSf8w1sLnqczTefJluYoLm5uo5F61sBshItP1cNFYe1f8A3ir/APfE/wCZUe9bB94r5jwuPsrQFhmG4l/Z2M17HdW90tuu3IkTHaCjWdIw0VVZdks9/C06yJFEp2dp+E1bbqybGTZ8vpQD7L1XRv8A7blT96Oda7tpNuuNE37Cq9KSisjyuUoxrStKllHbLlWTXsMs8chuSuwEPDqwoLe5y+YRE/gLzmqRekvKKtd4327yM/ulHxmrHJStySWVRyrjxKI2XC/CTlnlPPKTpTdFbP0L1bgrf5Lp0G3dPhQHwV0S1lzBsns3sESR8Crh9WAJGjSOKuU3E+zdZQ3oJh8IArdZXFDmOTpHa3i2+YrI2KtKy4ricBsBuHHgFXSo440+Wa2qqxjvM9uMoy+WvzWpLCWWWE28HxL6e43ojgkeSCBY1Ri5BGIUDT51cl3vm276BBqSEH4WbxV0tlkyXJcxTMb+OW6uY9mGHrCzDQwwAbTp2uKuTZ9N1uYsfRRR8WPhrm419mSSjRyiqxVK7y23B/ftuTm2oSdJyzNVw3BFn7vTlbnqF9dS2fu9OVueon11lZuQ2iLdsGFD05H2dNQGV0ntG5Tz1dWm9N1b2kVq8EVwsI2UaQaQOKhmitZGLOmk68DhSFvY+gfWNSAg7z3Qvo7yKCKIohiaNR5LKxx8qpxvjcqS0VpbxvwOAcRQPZ7D0G9Y0uz2HoH1jUCpLY7zXlpbm3eKO5QuzjrBqZji3x17PvNcyT288VvDBJbMWUovS2hslW7mFQ9nsPQPrGl2ew9A+saCod/WNxtbYsrfb17WBxx5ddD2281xC88klvDcSXEnWuzrqOGGC9zRUPZ7D0G9Y0uzWHoH1jQVCLreq6ntZbaO3it1mGy7RjTs1X2mYy20ZiCq8ZOODcdEdmsPQb1jS7PYegfWNdJuLqnQiSUlRqpFLmryxtH1Ma7Qw2gNNPOdSt0oI27p007s9h6B9Y0uz2HoH1jXX3Z+I4+1b8IJdX89xLHKQFMXQUahpxoiPN5P+onfU+A0/s9h6DesaXZ7D0D6xpG7OLbUtu0StW5JJx2bBsmbtiSiEk+cxoCWWSaVpZOk2vDVo0VYdnsPQb1jSNvZcCH1jSd2c+p1XAmFqEOmOPEfaH+BQd1ueo211IzrgFUYKNAAqI1WztCpUqVCRUqVKgFSpUqAVKlSoBUqVKgFSpUqAVKlSoBUqVKgFSpUqAVKlSoD/9k=";
        this._logoTexture.src = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAaUAAADeCAMAAACqnu8qAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEI5NjBBMTAzMEFFMTFFNDkyQjRGNzg3RjZDODhDMzEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEI5NjBBMTEzMEFFMTFFNDkyQjRGNzg3RjZDODhDMzEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0Qjk2MEEwRTMwQUUxMUU0OTJCNEY3ODdGNkM4OEMzMSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0Qjk2MEEwRjMwQUUxMUU0OTJCNEY3ODdGNkM4OEMzMSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PtvbrSAAAAMAUExURb29vcnJydXV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PRyQ8dJ38Ov+dtYzwCWtgT5pzZrPkPyG/vEbH3nyN2vmzZo367dz5jz+7A+IQHy3/YlX/wmgNPehDx+bM417xv90kG48/Br4tPMOvv3ec78HDvBlCM9Dc9965DezHv9oNXj5RqDm8X7KWLH15dnP3gKaNfflf1rz2i+m+8t+eHYOsGuU6rz8MoDnZQDP7997+7HPZs1Z9V2g5x7+btsz57FPXp4LMfrNL4HROx9B5fnslVefewvqDpKHNn343KuPfTZv1pxnH/7A55kJouQjz856ZO7LkA3+05M/C0arQWy27OEf3v9o1eNPzHsGcIK333trE1QeyrT98blHnj64Ztac1z7afuPGTMrj/R3ywxMH33roITCImx6Z9+w0XODq7atee5yWOV/99oknwP+0fD8Lhmq/OfgKiM1efQ8Qkrf+OJcCB+rO3E1vffr0k8/M+u1rP7wzI+Kln0sefu37J98DOgSI3adPPu5B4rsPgHz3wertKDPx/rOrHv9q1rx5a37zJAydH3nurd9DAax/E4rH5sKgDf32slv+TAkEZ+6HQHdeAdTt8VXv31sCMogS/s6qeY+99wnKNHzyyYe/f++xJw8ePPgklIOP0fLK2zA78SlAZRPC4M9//sd/REPvFk/wjMKtTwByAL+3Pn3vvVfffuzgk589M2/WE3No3blxzyvQz2yUPlj11bzHHnnrITTIdFj7EPX4/yPCgS3IXAEI3vr0kbeffvqVxw5+toZm+8/M+v63QGiD99s5jz/+GpBVqz56/4dlq2d8hujvkvfXvPfhQ1ArUMZi7ib09D/3HgxtP3317VcoeRr9B/F4BujD90989fjjqz56+J0P7kjmg3m8n09m/fkfX5771tNr5n0PHT+lAKs++uGH998HGnBf7Ysxk1F69plnvnrtfbci3Lh/NywJsocHQYIoBVEKShClIEpBCaIUlCBKQZSCEkQpKP7l/xdgADh4K64mrntGAAAAAElFTkSuQmCC";
        //this._logoTexture.width = logoWidth;
        //this._logoTexture.height = logoHeight;

        // bg
        //this._bgLayer = cc.LayerColor.create(cc.c4(32, 32, 32, 255));
        this._bgLayer = cc.LayerColor.create(cc.c4(255, 255, 255, 255));
        this._bgLayer.setPosition(0, 0);
        this.addChild(this._bgLayer, 0);

        //loading percent
        this._label = cc.LabelTTF.create("Loading... 0%", "Arial", 25);
        this._label.setColor(cc.c3(0, 0, 0));
        this._label.setPosition(cc.pAdd(centerPos, cc.p(0, - 350)));
        this._bgLayer.addChild(this._label, 10);
    },

    _initStage: function (centerPos) {
        this._texture2d = new cc.Texture2D();
        this._texture2d.initWithElement(this._logoTexture);
        this._texture2d.handleLoadedTexture();
        this._logo = cc.Sprite.createWithTexture(this._texture2d);
        this._logo.setScale(cc.CONTENT_SCALE_FACTOR());
        this._logo.setPosition(centerPos);
        this._bgLayer.addChild(this._logo, 9);
    },

    onEnter: function () {
        cc.Node.prototype.onEnter.call(this);
        this.schedule(this._startLoading, 0.3);
    },

    onExit: function () {
        cc.Node.prototype.onExit.call(this);
        var tmpStr = "Loading... 0%";
        this._label.setString(tmpStr);
    },

    /**
     * init with resources
     * @param {Array} resources
     * @param {Function|String} selector
     * @param {Object} target
     */
    initWithResources: function (resources, selector, target) {
        this.resources = resources;
        this.selector = selector;
        this.target = target;
    },

    _startLoading: function () {
        this.unschedule(this._startLoading);
        cc.Loader.preload(this.resources, this.selector, this.target);
        this.schedule(this._updatePercent);
    },

    _updatePercent: function () {
        var percent = cc.Loader.getInstance().getPercentage();
        var tmpStr = "Loading... " + percent + "%";
        this._label.setString(tmpStr);

        if (percent >= 100)
            this.unschedule(this._updatePercent);
    }
});

/**
 * Preload multi scene resources.
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.LoaderScene}
 * @example
 * //example
 * var g_mainmenu = [
 *    {src:"res/hello.png"},
 *    {src:"res/hello.plist"},
 *
 *    {src:"res/logo.png"},
 *    {src:"res/btn.png"},
 *
 *    {src:"res/boom.mp3"},
 * ]
 *
 * var g_level = [
 *    {src:"res/level01.png"},
 *    {src:"res/level02.png"},
 *    {src:"res/level03.png"}
 * ]
 *
 * //load a list of resources
 * cc.LoaderScene.preload(g_mainmenu, this.startGame, this);
 *
 * //load multi lists of resources
 * cc.LoaderScene.preload([g_mainmenu,g_level], this.startGame, this);
 */
cc.LoaderScene.preload = function (resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.LoaderScene();
        this._instance.init();
    }

    this._instance.initWithResources(resources, selector, target);

    var director = cc.Director.getInstance();
    if (director.getRunningScene()) {
        director.replaceScene(this._instance);
    } else {
        director.runWithScene(this._instance);
    }

    return this._instance;
};
