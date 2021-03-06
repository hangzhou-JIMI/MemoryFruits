/**
 * Created by luzexi on 14-8-31.
 */



var Gameoverlayer = cc.Layer.extend({

    resetbtn:null,
    backbtn:null,
    resetMenu:null,
    backMenu:null,
    shareMenu:null,
    score_lab:null,
    txt_lab:null,
    share_layer:null,
    share_label:null,

    init:function()
    {
        var size = cc.Director.getInstance().getWinSize();

        if( 'touches' in sys.capabilities )
            this.setTouchEnabled(true);
        else if ('mouse' in sys.capabilities )
            this.setMouseEnabled(true);

        var bg = cc.LayerColor.create(cc.c4b(200,200,100,255));
        this.addChild(bg);

        var gameoverImg = cc.Sprite.create(s_over_gameover);
        gameoverImg.setPosition(size.width/2,size.height/2 + 300);
        this.addChild(gameoverImg);

        var scoreImg = cc.Sprite.create(s_over_score);
        scoreImg.setPosition(size.width/2, size.height/2 + 50);
        this.addChild(scoreImg);

        this.resetbtn = cc.MenuItemImage.create(s_over_reset , s_over_reset , this.on_reset , this);
        this.backbtn = cc.MenuItemImage.create(s_over_back , s_over_back , this.on_back , this);

        this.resetMenu = cc.Menu.create(this.resetbtn);
        this.resetMenu.setAnchorPoint(0,0);
        this.resetMenu.setPosition(size.width/2-150,size.height/2 - 150);
        this.backMenu = cc.Menu.create(this.backbtn);
        this.backMenu.setAnchorPoint(0,0);
        this.backMenu.setPosition(size.width/2+150,size.height/2 - 150);
        this.addChild(this.resetMenu);
        this.addChild(this.backMenu);

        var shareImg = cc.MenuItemImage.create(s_over_share,s_over_share,this.WeiXinShareBtn , this);
        this.shareMenu = cc.Menu.create(shareImg);
        this.shareMenu.setAnchorPoint(0,0);
        this.shareMenu.setPosition(size.width/2 , size.height/2 - 350 );
        this.addChild(this.shareMenu);

        this.score_lab = cc.LabelTTF.create("您的得分是:"+gscore,"Arial",25);
        this.score_lab.setPosition(size.width/2,size.height/2 + 100);
        this.addChild(this.score_lab);

        var score_per = parseInt(gscore/20>100?100:gscore/20);
        this.txt_lab = cc.LabelTTF.create("您敏捷的头脑击败了"+score_per+"%的人类","黑体",30);
        this.txt_lab.setPosition(size.width/2 , size.height/2-50);
        this.txt_lab.setColor(cc.c3(0,0,0));
        this.addChild(this.txt_lab);

        window.shareData.tTitle = "你敏捷的头脑获得"+gscore+"超越了"+score_per+"%人类的极限";
    },

    on_reset:function()
    {
        var scaleToA = cc.ScaleTo.create(0.1,0.9,0.9);
        var scaleToB = cc.ScaleTo.create(0.1, 1, 1);
        var func = cc.CallFunc.create(this.back_to_tittle,this);
        this.resetMenu.runAction(cc.Sequence.create(scaleToA,scaleToB,func));
    },

    on_back:function()
    {
        var scaleToA = cc.ScaleTo.create(0.1,0.9,0.9);
        var scaleToB = cc.ScaleTo.create(0.1, 1, 1);
        var func = cc.CallFunc.create(this.back_to_tittle,this);
        this.backMenu.runAction(cc.Sequence.create(scaleToA,scaleToB,func));
    },

    back_to_tittle:function()
    {
        var scene = cc.Scene.create();
        var tittle = new Tittle_layer();
        scene.addChild(tittle);
        tittle.init();
        cc.Director.getInstance().replaceScene(scene);
    },

    WeiXinShareBtn:function()
    {
        var size = cc.Director.getInstance().getWinSize();
        var scaleToA = cc.ScaleTo.create(0.1,0.9,0.9);
        var scaleToB = cc.ScaleTo.create(0.1, 1, 1);
        var func = cc.CallFunc.create(function(){
//            if (typeof WeixinJSBridge == "undefined")
//            {
//                alert("请通过微信分享文章");
//            }
//            else
            {
                this.share_layer = cc.LayerColor.create(cc.c4b(0,0,0,200));
                this.share_label = cc.LabelTTF.create("点击分享朋友圈↑↑↑","",30);
                this.share_label.setColor(cc.c3b(255,0,0));
                this.share_label.setPosition(size.width - 150 , size.height -30);
                this.addChild(this.share_layer);
                this.addChild(this.share_label);
            }
        },this);
        this.shareMenu.runAction(cc.Sequence.create(scaleToA,scaleToB,func));

    },

    remove_sharelayer:function()
    {
        if(this.share_layer != null )
        {
            this.share_layer.removeFromParent(true);
            this.share_layer = null;
        }
        if(this.share_label != null)
        {
            this.share_label.removeFromParent(true);
            this.share_label = null;
        }
    },

    onMouseUp:function (event) {

        this.remove_sharelayer();
    },

    onTouchesEnded:function (touches, event) {
        this.remove_sharelayer();
    }

});

