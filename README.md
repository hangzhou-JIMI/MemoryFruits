MemoryFruits
============

水果记忆游戏

使用cocos2d-html5-v2.2.3开发。
游戏地址为:http://memoryfruit.luzexi.com/memoryfruit/index.html

打包html5需要用到ant和build.xml。打包主要内容为将所有js文件打包成同一个文件，目的是减少加载文件数量，加快加载速度。
打包命令：cd到项目文件夹下。敲入:ant或者ant -buildfile build.xml
build.xml中囊括了要打包的js文件。其中指定了js打包编译工具complie.jar是google closure compiler专门压缩js文件大小工具

![github](https://github.com/hangzhou-JIMI/MemoryFruits/blob/master/ui/%E4%B8%BB%E7%95%8C%E9%9D%A2/%E4%B8%BB%E7%95%8C%E9%9D%A2.png "记忆水果")
