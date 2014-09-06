
var StartScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new Tittle_layer();
        this.addChild(layer);
        layer.init();
    }
});
