
//	tittle_ui.js
//	author: luzexi
//	2014-08-30




var Tittle_layer = cc.Layer.extend({
 	background_layer:null,
	start_button:null,
	tittle_lable:null,

	init:function()
	{
        this._super();
        var size = cc.Director.getInstance().getWinSize();

        var bg = cc.LayerColor.create(cc.c4b(200,255,255,255),size.width,size.height);
        this.addChild(bg);

        this.color = cc.Color4B.red;

        var img = cc.Sprite.create(s_tittle_logo);
        this.addChild(img);
        img.setPosition(size.width/2 , size.height/2 + 150 );

        var scaleToA = cc.ScaleTo.create(0.1,0.9,0.9);
        var scaleToB = cc.ScaleTo.create(0.1, 1, 1);
        var actionTobt = cc.CallFunc.create(this.hiden);
        this.start_button = cc.MenuItemImage.create(
            s_tittle_button,s_tittle_button,
            function(){
                this.start_button.runAction(cc.Sequence.create(scaleToA,scaleToB,actionTobt));
                cc.log("on_");
            },
            this);
        var menu = cc.Menu.create(this.start_button);
        menu.setPosition(0,0);
        this.addChild(menu);
        this.start_button.setPosition(size.width/2,size.height/2 - 250 );
        //

//        this.tittle_label = cc.LabelTTF.create("tittle string");
//        this.tittle_label.setPosition(size.width/2 , size.height/2);
//        this.addChild(this.tittle_label);
	},

    hiden:function()
    {
        cc.log("log go");
        var scene = cc.Scene.create();
        var gamelayer = new Gamelayer();
        scene.addChild(gamelayer);
        gamelayer.init();
        cc.Director.getInstance().replaceScene(scene);
        cc.log("end");
    }
 }
);
