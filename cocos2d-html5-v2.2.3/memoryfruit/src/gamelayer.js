/**
 * Created by luzexi on 14-8-30.
 */


var gscore;

var Gamelayer = cc.Layer.extend({

    yesbtn:null,
    nobtn:null,
    fruit:null,
    score:0,
    scoreNum:0,
    score_label:null,
    cd_bg_layer:null,
    cd_layer:null,

    outfruit:null,
    lastfruit:0,
    indexfruit:0,
    res_fruits:null,

    cost_time:3,
    start_time:0,

    init:function()
    {
        this._super();

        gscore = 0;
        this.score = 0;
        this.scoreNum = 0;
        this.cost_time = 5;
        this.start_time = new Date().getTime();

        var size = cc.Director.getInstance().getWinSize();

        var bg = cc.LayerColor.create(cc.c4b(100,255,200,250),size.width,size.height);
        this.addChild(bg);

        var img = cc.Sprite.create(s_game_cat);
        this.addChild(img);
        img.setPosition(size.width - 100 ,size.height - 100 );

        this.yesbtn = cc.MenuItemImage.create(s_game_yes,s_game_yes,this.on_yes_btn,this);
        this.nobtn = cc.MenuItemImage.create(s_game_no,s_game_no,this.on_no_btn,this);

        var yesMenu = cc.Menu.create(this.yesbtn);
        var noMenu = cc.Menu.create(this.nobtn);
        this.addChild(yesMenu);
        this.addChild(noMenu);
        yesMenu.setPosition(size.width/2+150,size.height/2-250);
        noMenu.setPosition(size.width/2-150,size.height/2-250);

        var tittle_lab = cc.LabelTTF.create("限定时间内判断水果是否与上个相同","Arial",25);
        tittle_lab.setAnchorPoint(0.5,0.5);
        this.addChild(tittle_lab);
        tittle_lab.setPosition(size.width/2,size.height-150);
        tittle_lab.setColor(cc.c4b(200,0,0,255));

        this.score_label = cc.LabelTTF.create("您当前的分数为:0","Arial",40);
        this.score_label.setAnchorPoint(0,1);
        this.addChild(this.score_label);
        this.score_label.setPosition(50,size.height-50);
        this.score_label.setColor(cc.c4b(0,0,0,255));

        this.cd_bg_layer = cc.LayerColor.create(cc.c4b(50,200,50,255),100 , 40);
        this.cd_bg_layer.setAnchorPoint(1,0);
        this.cd_bg_layer.setPosition(5,size.height - 170 );
        this.cd_layer = cc.LayerColor.create(cc.c4b(200,0,0,255),100,40);
        this.cd_layer.setAnchorPoint(1,0);
        this.cd_layer.setPosition(5,size.height - 170);
        this.addChild(this.cd_bg_layer);
        this.addChild(this.cd_layer);

        this.scheduleUpdate();

        this.res_fruits = [s_fruit_shumei,s_fruit_boluo,s_fruit_caomei,s_fruit_putao,s_fruit_xigua];

        this.lastfruit = parseInt(Math.random()*10)%5;
        this.indexfruit = this.lastfruit;
        this.fruit = cc.Sprite.create(this.res_fruits[this.lastfruit]);
        this.fruit.setPosition(size.width/2,size.height/2+100);
        this.addChild(this.fruit);


        this.out_fruit(0.5);

        this.in_fruit(0.5);

    },

    update:function()
    {
        if(this.cost_time>0)
        {
            var dis = new Date().getTime() - this.start_time;
            var per = dis / (this.cost_time*1000);
            if(per>1) per = 1;
            this.cd_layer.setScaleX(1.0-per);

            if(per>=1)
            {
                this.on_fail();
            }
        }
//        cc.log("int");
    },

    in_fruit:function(drtime)
    {
        if(!arguments[0]) drtime = 0.2;

        this.start_time = new Date().getTime();

        var size = cc.Director.getInstance().getWinSize();

        var topos = cc.Place.create(cc.p(size.width,size.height/2+100));
        var tomove = cc.MoveTo.create(drtime,cc.p(size.width/2,size.height/2+100));

        var win = (Math.random()>0.3);
        var index = win ? this.lastfruit :parseInt(Math.random()*10)%5;

        this.indexfruit = index;
        this.fruit = cc.Sprite.create(this.res_fruits[index]);
        this.addChild(this.fruit);
        this.fruit.runAction(cc.Sequence.create(topos,tomove));
    },

    out_fruit:function( drtime )
    {
        if(!arguments[0]) drtime = 0.2;

        if(this.outfruit!=null)
            this.outfruit.removeFromParent(true);
        this.outfruit=null;

        var size = cc.Director.getInstance().getWinSize();

        this.lastfruit = this.indexfruit;
        this.outfruit = this.fruit;
        var tomove = cc.MoveTo.create(drtime,cc.p(-200,size.height/2+100));
        var destoryImg = cc.CallFunc.create(function(){if(this.outfruit!=null)this.outfruit.removeFromParent(true);this.outfruit=null;},this);
        if(this.outfruit!=null)
            this.outfruit.runAction(cc.Sequence.create(tomove,destoryImg));
    },

    on_yes_btn:function()
    {
        var scaleToA = cc.ScaleTo.create(0.1,0.9,0.9);
        var scaleToB = cc.ScaleTo.create(0.1, 1, 1);
        this.yesbtn.runAction(cc.Sequence.create(scaleToA,scaleToB));

        if(this.lastfruit == this.indexfruit) {
            this.on_win();
            this.out_fruit();
            this.in_fruit();
        }
        else
        {
            this.on_fail();
        }
    },

    on_no_btn:function()
    {
        var scaleToA = cc.ScaleTo.create(0.1,0.9,0.9);
        var scaleToB = cc.ScaleTo.create(0.1, 1, 1);
        this.nobtn.runAction(cc.Sequence.create(scaleToA,scaleToB));

        if(this.lastfruit != this.indexfruit) {
            this.on_win();
            this.out_fruit();
            this.in_fruit();
        }
        else
        {
            this.on_fail();
        }

    },

    //win
    on_win:function() {
        this.scoreNum++;
        if (this.scoreNum <= 5)
        {
            this.score += 10;
            this.cost_time = 3;
        }
        else if(this.scoreNum >5 && this.scoreNum <= 10 ) {
            this.score += 20;
            this.cost_time = 2;
        }
        else if(this.scoreNum > 10 && this.scoreNum <= 20 ) {
            this.score += 40;
            this.cost_time = 1.5;
        }
        else if(this.scoreNum > 20 && this.scoreNum <= 40) {
            this.score += 80;
            this.cost_time = 1.3;
        }
        else if(this.scoreNum >40 && this.scoreNum <= 100 ) {
            this.score += 160;
            this.cost_time = 1.1;
        }
        else {
            this.score += 100;
            this.cost_time = 1;
        }

        gscore = this.score;
        this.score_label.setString("您当前的分数为:"+this.score);
    },

    //fail
    on_fail:function()
    {
        var scene = cc.Scene.create();
        var gameover = new Gameoverlayer();
        scene.addChild(gameover);
        gameover.init();
        cc.Director.getInstance().replaceScene(scene);
    }
 }
);

