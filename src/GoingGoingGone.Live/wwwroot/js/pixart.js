/* v2 pixel art for the 36 Going, Going, Gone! artworks (64x48).
   Rules (from studying pixelfx): one 5-step ramp per material [outline, shadow, base, light, highlight],
   one light from the top-left, objects shaded from their own shape, clean colour bands instead of
   checkerboard dithering, no random speckle inside shapes. */
var PIXART=(function(){
"use strict";
var W=64,H=48,S=8;
var FONT={A:"010101111101101",B:"110101110101110",C:"011100100100011",D:"110101101101110",E:"111100110100111",F:"111100110100100",G:"011100101101011",H:"101101111101101",I:"111010010010111",J:"001001001101010",K:"101101110101101",L:"100100100100111",M:"101111111101101",N:"110101101101101",O:"010101101101010",P:"110101110100100",Q:"010101101110011",R:"110101110101101",S:"011100010001110",T:"111010010010010",U:"101101101101111",V:"101101101101010",W:"101101111111101",X:"101101010101101",Y:"101101010010010",Z:"111001010100111",".":"000000000000010","!":"010010010000010","?":"110001010000010","'":"010010000000000","-":"000000111000000"};
/* ramps: outline, shadow, base, light, highlight (shadows lean cool, lights lean warm) */
var K={
 skin:["#4a2228","#a8604c","#d8956a","#f0bc8c","#fde2bc"],
 skinTan:["#3a1a14","#8a4e30","#c08a5a","#dcac78","#f2d0a0"],
 skinDark:["#28120e","#5e3020","#8e5232","#b47446","#d89a64"],
 skinPale:["#3a3040","#a896a4","#ddd0d0","#f2e8e4","#ffffff"],
 sick:["#1e2a18","#6e8052","#a4b67e","#c8d8a0","#eaf4c8"],
 angry:["#3a0a10","#a82a2a","#d8483a","#f07858","#ffb08c"],
 bone:["#3a3022","#a69870","#ddd0a4","#f2e8c4","#fffbe8"],
 hairDark:["#100a0c","#22161a","#36241e","#4e3628","#6a4c34"],
 auburn:["#240c06","#5a2410","#8a3c1a","#b45a2a","#d8844a"],
 blond:["#5a3a14","#c08a2a","#f0c84a","#ffe88a","#fffbe0"],
 marble:["#383848","#9894a2","#cdc8c8","#ebe6de","#ffffff"],
 white:["#4a4a5e","#a8a8bc","#d8d8e2","#f0f0f4","#ffffff"],
 black:["#040408","#121218","#20202a","#323242","#4e4e60"],
 grey:["#1a1a24","#4a4a5a","#787888","#a6a6b4","#d8d8e2"],
 red:["#360814","#861a26","#c4302c","#ea5a3c","#ff9c6c"],
 wine:["#1a0008","#46081a","#760e2a","#a4203e","#d0506a"],
 orange:["#481808","#a4461a","#e4762a","#f6a64a","#ffde8a"],
 yellow:["#5a3a0a","#b8841a","#f0c42a","#fae46a","#fffbd0"],
 gold:["#3a2408","#865610","#c48e1c","#eebe40","#fff0a0"],
 green:["#0c2618","#245428","#3e8236","#6eb048","#bce07a"],
 olive:["#1a2010","#3e4a26","#5e6e3a","#7e8e4e","#a4b06e"],
 blue:["#0c1838","#1c3a78","#2c66b4","#5aa0e0","#aadcff"],
 teal:["#082626","#185656","#288484","#48b4ac","#a0e8de"],
 purple:["#180828","#441858","#742888","#a456b4","#e0a0e8"],
 pink:["#481838","#ac4680","#ec76ac","#ffa8cc","#ffe0f0"],
 rose:["#360612","#760f26","#ac1f3a","#d64058","#f68a9a"],
 wood:["#1c0e06","#462812","#764822","#a46e38","#cc9c5c"],
 roast:["#2a1206","#6a3410","#9a5a26","#c8803a","#f0b060"],
 hay:["#3a2208","#865816","#bc8828","#deae48","#f6d67e"],
 lion:["#3a1e08","#8a5420","#c88c3a","#e8b05a","#f8d888"],
 mane:["#200e04","#4e260e","#6e4218","#8e5c26","#ae7836"],
 fur:["#2a1608","#6a4422","#a07448","#c89a68","#e8c494"],
 bronze:["#18120c","#423426","#64543f","#867458","#ac9a7c"],
 fabric:["#363c4c","#868ea0","#b2bacb","#d2d8e2","#f0f4f8"],
 sky:["#2a5a8a","#6aa8d8","#9ccaf0","#c4e2f8","#ffffff"],
 smoke:["#24222a","#46424e","#66626e","#88848e","#aaa6b0"],
 fire:["#6a1a0a","#cc401a","#f0801e","#f8c040","#fff4b0"],
 shell:["#64442a","#c4966a","#eac698","#f8e0b8","#fff4e0"],
 china:["#5a5262","#b4aab2","#e2dad6","#f4eeea","#ffffff"],
 moon:["#6a6a52","#bcbc96","#e4e4c0","#f6f6de","#ffffff"],
 pickle:["#0e2410","#2c5a1e","#4a8a2e","#74b048","#b8e07a"],
 felt:["#081c0e","#163e1e","#24602e","#36843e","#5aa858"]
};
function flat(c,o){return [o||"#121218",c,c,c,c]}
var LX=-.5,LY=-.62,LZ=.6,LL=Math.sqrt(LX*LX+LY*LY+LZ*LZ);LX/=LL;LY/=LL;LZ/=LL;
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){return function(){seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function mask(){var m=new Uint8Array(W*H),o={m:m};
  function set(x,y){x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)m[y*W+x]=1}
  o.p=set;
  o.r=function(x,y,w,h){for(var j=0;j<h;j++)for(var i=0;i<w;i++)set(x+i,y+j);return o};
  o.e=function(cx,cy,rx,ry){for(var j=Math.floor(cy-ry-1);j<=Math.ceil(cy+ry+1);j++)for(var i=Math.floor(cx-rx-1);i<=Math.ceil(cx+rx+1);i++){var dx=(i-cx)/(rx+.5),dy=(j-cy)/(ry+.5);if(dx*dx+dy*dy<=1)set(i,j)}return o};
  o.poly=function(pts){var y0=1e9,y1=-1e9;pts.forEach(function(q){y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])});
    for(var y=Math.floor(y0);y<=Math.ceil(y1);y++){var yc=y+.5,xs=[];for(var i=0;i<pts.length;i++){var a=pts[i],n=pts[(i+1)%pts.length];if((a[1]<=yc&&n[1]>yc)||(n[1]<=yc&&a[1]>yc))xs.push(a[0]+(yc-a[1])/(n[1]-a[1])*(n[0]-a[0]))}
      xs.sort(function(a,b){return a-b});for(var k=0;k+1<xs.length;k+=2)for(var x=Math.round(xs[k]);x<Math.round(xs[k+1]);x++)set(x,y)}return o};
  o.l=function(x0,y0,x1,y1,w){w=w||1;var n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*2+1;for(var k=0;k<=n;k++){var x=x0+(x1-x0)*k/n,y=y0+(y1-y0)*k/n;if(w>1)o.e(x,y,(w-1)/2,(w-1)/2);else set(x,y)}return o};
  return o}

function make(seed){
  var b=new Array(W*H).fill("#000000"),R=rng(seed),g={buf:b,R:R};
  g.p=function(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)b[y*W+x]=c};
  g.r=function(x,y,w,h,c){for(var j=0;j<h;j++)for(var i=0;i<w;i++)g.p(x+i,y+j,c)};
  g.l=function(x0,y0,x1,y1,c){var n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*2+1;for(var k=0;k<=n;k++)g.p(x0+(x1-x0)*k/n,y0+(y1-y0)*k/n,c)};
  /* clean horizontal colour bands, optionally wavy */
  g.bands=function(y0,y1,cs,amp,freq,ph){amp=amp||0;freq=freq||.3;ph=ph||0;for(var x=0;x<W;x++)for(var y=y0;y<y1;y++){var u=(y-y0+amp*Math.sin(x*freq+ph+y*.15))/(y1-y0);g.p(x,y,cs[Math.max(0,Math.min(cs.length-1,Math.floor(u*cs.length)))])}};
  g.t=function(x,y,s,c){s=s.toUpperCase();for(var k=0;k<s.length;k++){var f=FONT[s[k]];if(f)for(var j=0;j<5;j++)for(var i=0;i<3;i++)if(f[j*3+i]==="1")g.p(x+i,y+j,c);x+=4}};
  /* draw a shape into a mask, then paint it lit from the top-left with a ramp */
  g.o=function(fn,ramp,rad,opt){var mm=mask();fn(mm);shade(mm.m,ramp,rad==null?3:rad,opt||{});return mm.m};
  g.fig=function(x,y,h,skin,cloth,hair){g.o(function(m){m.r(x-1,y-h+2,4,h-5)},flat(cloth),0);g.r(x,y-h,2,2,skin);if(hair)g.r(x,y-h,2,1,hair);g.r(x-1,y-3,1,3,"#1a1a22");g.r(x+2,y-3,1,3,"#1a1a22")};
  function shade(m,ramp,rad,opt){var n=ramp.length,INF=1e9,d=new Float32Array(W*H),i,x,y;
    for(i=0;i<W*H;i++)d[i]=m[i]?INF:0;
    function D(x,y){return(x<0||y<0||x>=W||y>=H)?INF:d[y*W+x]}
    for(y=0;y<H;y++)for(x=0;x<W;x++)if(m[y*W+x])d[y*W+x]=Math.min(d[y*W+x],D(x-1,y)+1,D(x,y-1)+1,D(x-1,y-1)+1.414,D(x+1,y-1)+1.414);
    for(y=H-1;y>=0;y--)for(x=W-1;x>=0;x--)if(m[y*W+x])d[y*W+x]=Math.min(d[y*W+x],D(x+1,y)+1,D(x,y+1)+1,D(x+1,y+1)+1.414,D(x-1,y+1)+1.414);
    function inM(x,y){return x<0||y<0||x>=W||y>=H||m[y*W+x]===1}
    function hh(x,y){if(!inM(x,y))return 0;x=Math.max(0,Math.min(W-1,x));y=Math.max(0,Math.min(H-1,y));var u=Math.min(d[y*W+x],rad)/rad;return Math.sqrt(Math.max(0,1-(1-u)*(1-u)))*rad}
    for(y=0;y<H;y++)for(x=0;x<W;x++){if(!m[y*W+x])continue;var c;
      var edge=opt.outline!==false&&(!inM(x-1,y)||!inM(x+1,y)||!inM(x,y-1)||!inM(x,y+1));
      if(edge){c=(!inM(x-1,y)||!inM(x,y-1))?ramp[opt.litOutline==null?1:opt.litOutline]:ramp[0]}
      else if(rad<=0){c=ramp[opt.base==null?2:opt.base]}
      else{var nx=(hh(x-1,y)-hh(x+1,y))/2,ny=(hh(x,y-1)-hh(x,y+1))/2;if(opt.inv){nx=-nx;ny=-ny}var l=Math.sqrt(nx*nx+ny*ny+1),lam=(nx*LX+ny*LY+LZ)/l;
        var t=Math.max(0,Math.min(.999,(lam-.2)/.75)),k=1+Math.floor(t*(n-2));if(lam>.94&&opt.spec!==false)k=n-1;c=ramp[k]}
      b[y*W+x]=c}}
  return g}

var A={};
/* ---------- Renaissance ---------- */
A.b0=function(g){ // Mona Leonarda
  g.bands(0,27,["#cfcca0","#bcc096","#a8b48c","#94a682"]);
  g.o(function(m){m.e(8,28,13,5).e(56,26,13,6)},K.olive,2);
  g.bands(30,48,["#6a6a3c","#5a5a32","#4a4a28"]);g.l(3,34,12,29,"#b89a5a");g.l(61,31,52,27,"#b89a5a");
  g.o(function(m){m.poly([[12,48],[20,31],[44,31],[52,48]])},["#0a0806","#221a10","#32281a","#463a26","#5e5034"],3);
  g.o(function(m){m.poly([[19,31],[24,31],[18,48],[11,48]]).poly([[40,31],[45,31],[53,48],[46,48]])},K.wood,2);
  g.o(function(m){m.e(32,31,7,2.5)},K.skin,2);
  g.o(function(m){m.e(32,17,10,13)},K.hairDark,3);
  g.o(function(m){m.e(32,15,7,8)},K.skin,4);
  g.r(28,12,3,1,"#6a4228");g.r(34,12,3,1,"#6a4228");g.p(29,14,"#1e120a");g.p(35,14,"#1e120a");g.p(30,14,"#fff");g.p(36,14,"#fff");g.p(32,16,"#b06c48");
  g.o(function(m){m.poly([[25,18],[39,18],[37,28],[32,33],[27,28]])},["#4a4650","#9a948e","#c8c2b8","#e4ded4","#fbf8f0"],3);
  [27,30,34,37].forEach(function(x){g.l(x,21,x+(x<32?1:-1),28,"#aaa49c")});g.r(29,19,6,1,"#fbf8f0");g.r(30,20,4,1,"#8a4c3c");
  g.o(function(m){m.e(27,42,4,2).e(36,41,4,2)},K.skin,2);
};
A.b1=function(g){ // Nail-Filing Slave
  g.r(0,0,64,48,"#22262f");g.o(function(m){m.e(32,23,16,24)},["#16181e","#2a2e38","#383e4c","#424a5a","#4e5868"],8,{inv:true,outline:false});
  g.o(function(m){m.r(18,41,28,7)},K.marble,2);
  g.o(function(m){m.e(31,9,4,5).r(30,13,3,2).poly([[24,15],[38,15],[36,28],[26,28]]).poly([[26,28],[36,28],[38,32],[24,32]]).r(26,32,4,9).r(32,32,4,9)
    .l(25,16,20,11,3).l(20,11,25,7,3).l(37,16,34,22,3).l(34,22,28,11,3)},K.marble,3);
  g.p(30,5,"#9894a2");g.p(32,5,"#9894a2");g.p(31,6,"#9894a2");g.l(30,33,30,40,"#9894a2");g.r(26,31,10,1,"#9894a2");
  g.l(27,10,24,6,"#5a606c");g.p(23,5,"#5a606c");
};
A.b2=function(g){ // Tomato on Venus's shell
  g.bands(0,22,["#e6efe9","#d2e5e2","#bcd8da"]);g.bands(22,48,["#7cb2c2","#629cb2","#4c84a2","#3c6e8c"],1.5,.35);
  for(var k=0;k<8;k++){var x=(k*17)%58+3,y=25+(k*7)%20;g.l(x,y,x+2,y-1,"#e8f4f2");g.l(x+2,y-1,x+4,y,"#e8f4f2")}
  g.o(function(m){m.e(32,41,16,6)},K.shell,3);for(var i=-5;i<=5;i++)g.l(32,46,32+i*2.6,37,"#c4966a");
  g.o(function(m){m.e(32,27,10,9)},K.red,7);
  g.o(function(m){m.poly([[32,16],[35,19],[40,18],[36,21],[32,21],[28,21],[24,18],[29,19]])},K.green,1);g.r(31,14,2,3,"#245428");
  [[8,6],[14,12],[52,8],[46,14],[57,18],[6,16]].forEach(function(q){g.p(q[0],q[1],"#f2a3b5");g.p(q[0]+1,q[1],"#fbd0da")});
};
A.b3=function(g){ // The Poker Game
  g.bands(0,34,["#3a3832","#2e2b27","#24211e"]);
  g.o(function(m){m.r(0,34,64,14)},K.felt,0,{base:2});
  [[13,K.red],[32,K.black],[51,K.gold]].forEach(function(s,i){var x=s[0],y=12+(i===1?-2:0);
    g.o(function(m){m.poly([[x-8,36],[x-5,y+7],[x+5,y+7],[x+8,36]])},s[1],3);
    g.o(function(m){m.e(x,y+7,3,1)},K.white,1);
    g.o(function(m){m.e(x,y+1,5,6)},K.hairDark,2);g.o(function(m){m.e(x,y+2,3.5,4)},K.skin,3);
    g.p(x-2,y+2,"#2a1a10");g.p(x+1,y+2,"#2a1a10");g.r(x-1,y+5,2,1,"#b5605a")});
  function card(x,y,pip){g.r(x,y,3,4,"#f4f4f4");g.r(x+3,y+1,1,4,"#0e0e14");g.r(x+1,y+4,3,1,"#0e0e14");g.p(x+1,y+1,pip);g.p(x+1,y+2,pip)}
  card(9,26,"#c22");card(11,25,"#111");card(47,25,"#111");card(49,26,"#c22");card(29,24,"#c22");
  card(28,39,"#c22");card(31,40,"#111");card(34,39,"#c22");
  [[18,K.red],[40,K.blue]].forEach(function(s){g.o(function(m){m.r(s[0],37,5,5)},s[1],2)});
};
/* ---------- Baroque ---------- */
A.b4=function(g){ // Really Sick Bacchus
  g.bands(0,40,["#221e18","#1a1712","#14120e"]);g.o(function(m){m.r(0,40,64,8)},K.wood,1);
  g.o(function(m){m.poly([[14,40],[20,26],[42,26],[48,40]])},K.white,4);
  g.o(function(m){m.e(31,18,8,9)},K.hairDark,3);g.o(function(m){m.e(31,19,6.5,7.5)},K.sick,4);
  [[24,11],[28,9],[33,9],[37,11],[39,14],[23,14]].forEach(function(q){g.o(function(m){m.e(q[0],q[1],2.2,1.6)},K.green,1)});
  g.r(27,17,3,1,"#4a5638");g.r(33,17,3,1,"#4a5638");g.p(28,18,"#222");g.p(34,18,"#222");g.r(27,20,3,1,"#8a9a72");g.r(33,20,3,1,"#8a9a72");
  g.l(31,24,41,21,"#f4f4f4");g.p(42,21,"#d33");g.p(42,20,"#d33");
  [[41,31],[44,31],[47,31],[42,34],[45,34],[44,37]].forEach(function(q){g.o(function(m){m.e(q[0],q[1],1.5,1.5)},K.purple,2)});g.l(44,28,44,30,"#3e8236");
  g.o(function(m){m.e(12,42,3,2)},K.orange,2);g.o(function(m){m.e(18,43,3,2)},K.yellow,2);g.o(function(m){m.e(54,42,4,2)},K.green,2);
};
A.b5=function(g){ // Judith Shampooing Holofernes
  g.bands(0,30,["#1e1814","#1a1512","#161210"]);g.o(function(m){m.r(0,0,64,9)},K.red,0,{outline:false});for(var x=3;x<64;x+=7)g.l(x,0,x+2,8,"#861a26");g.r(0,9,64,1,"#360814");
  g.o(function(m){m.r(0,30,64,18)},K.white,0,{base:2});g.l(4,40,40,46,"#a8a8bc");
  g.o(function(m){m.e(18,30,6,5)},K.skin,3);g.o(function(m){m.e(18,34,5,3)},K.hairDark,2);g.l(15,29,17,29,"#5a3a2a");g.l(20,29,22,29,"#5a3a2a");
  g.o(function(m){m.e(12,24,4,3).e(18,22,4,3).e(24,24,3,2.5).e(15,19,3,2.5).e(21,18,3,2.5).e(10,28,2.5,2)},["#5a6a8a","#b8c8dc","#e0eaf4","#f4f8fc","#ffffff"],3);
  [[30,14],[8,12],[26,8]].forEach(function(q){g.o(function(m){m.e(q[0],q[1],1.5,1.5)},["#8aa0c0","#d8e6f4","#f4f8fc","#ffffff","#ffffff"],1)});
  g.o(function(m){m.poly([[34,46],[38,18],[52,18],[58,46]])},K.gold,4);
  g.o(function(m){m.e(45,9,5,4).r(41,9,2,9)},K.auburn,2);g.o(function(m){m.e(45,12,3.5,4.5)},K.skin,3);
  g.o(function(m){m.l(39,21,26,23,3).l(40,25,24,27,3)},K.skin,1);
  g.o(function(m){m.r(53,24,4,7)},K.blue,2);g.r(54,22,2,2,"#f4f4f4");
};
A.b6=function(g){ // The Apoplectic Cavalier
  g.bands(0,48,["#9c9c7e","#8e8e70","#808064","#727258"]);
  g.o(function(m){m.poly([[8,48],[14,30],[50,30],[56,48]])},K.black,3);for(var i=0;i<12;i++)g.p(16+i*3,36+(i%3)*4,"#c48e1c");
  g.o(function(m){m.poly([[44,34],[52,32],[56,48],[48,48]])},K.orange,2);for(var j=0;j<5;j++)g.l(47,36+j*2,52,34+j*2,"#a4461a");
  g.o(function(m){m.e(32,30,14,4)},K.white,2);for(var k=0;k<13;k++)g.p(20+k*2,30+(k%2),"#a8a8bc");
  g.o(function(m){m.e(32,19,7,8)},K.angry,4);
  g.l(27,15,30,16,"#3a2410");g.l(37,15,34,16,"#3a2410");g.r(28,17,2,1,"#fff");g.r(34,17,2,1,"#fff");g.p(29,17,"#111");g.p(34,17,"#111");
  g.l(25,21,31,23,"#4a2a12");g.l(39,21,33,23,"#4a2a12");g.p(25,20,"#4a2a12");g.p(39,20,"#4a2a12");g.r(31,25,2,3,"#4a2a12");
  g.o(function(m){m.e(32,9,17,3).r(24,1,16,8)},K.black,2);g.r(24,6,16,1,"#4e4e60");
  g.o(function(m){m.e(27,19,2,2).e(35,13,1.5,1.5).e(30,26,1.5,1.5).e(24,29,1.5,1.5).e(40,30,1.5,1.5)},K.wine,1);g.l(27,21,27,25,"#760e2a");g.l(38,25,38,29,"#760e2a");
  g.l(50,8,56,4,"#dfe6ea");g.l(56,4,58,8,"#dfe6ea");g.l(53,6,48,12,"#dfe6ea");g.p(52,9,"#760e2a");g.p(47,12,"#760e2a");g.p(45,14,"#760e2a");
};
A.b7=function(g){ // The Turkey Dinner of Dr Tulp
  g.bands(0,32,["#342c24","#2a241e","#221d18"]);
  [[8,12],[18,9],[28,11],[40,8],[48,12]].forEach(function(q){var x=q[0],y=q[1];g.o(function(m){m.r(x-5,y+5,10,20)},K.black,2);g.o(function(m){m.e(x,y+5,4,1.5)},K.white,1);g.o(function(m){m.e(x,y,3,3.5)},K.skin,2);g.r(x-2,y-4,5,1,"#22161a");g.r(x-1,y+2,2,1,"#5a3a22");g.p(x-1,y-1,"#2a1a10");g.p(x+1,y-1,"#2a1a10")});
  g.o(function(m){m.r(53,10,8,30)},K.black,2);g.o(function(m){m.e(57,12,3,3.5)},K.skin,2);g.o(function(m){m.e(57,17,4,1.5)},K.white,1);g.o(function(m){m.r(52,6,10,2).r(54,2,6,5)},K.black,1);
  g.l(52,20,40,30,"#c8c8d0");g.l(40,30,39,32,"#c8c8d0");g.l(41,31,40,33,"#c8c8d0");
  g.o(function(m){m.r(6,32,48,16)},K.white,0,{base:2});
  g.o(function(m){m.e(30,37,14,3)},K.grey,2);g.o(function(m){m.e(30,32,9,6).e(20,34,3,2).e(40,34,3,2)},K.roast,5);g.p(17,34,"#f4ecd8");g.p(43,34,"#f4ecd8");
  g.o(function(m){m.e(14,40,2,1)},K.green,1);g.o(function(m){m.e(46,40,2,1)},K.red,1);
};
/* ---------- Impressionism ---------- */
A.b8=function(g){ // Haystacks with a burning getaway car
  g.bands(0,20,["#f0a070","#f4b680","#f6ca92","#f8daa6"]);g.o(function(m){m.e(14,11,4,4)},["#fce6b0","#fdeec4","#fff4d6","#fffaea","#ffffff"],3,{outline:false});
  g.bands(20,48,["#d0b050","#bca448","#a49a40","#8a8c38","#727a30"]);
  for(var y=22;y<48;y+=3)for(var x=(y%2)*3;x<64;x+=6){g.r(x,y,3,1,y<34?"#e6c868":"#9aa448")}
  g.o(function(m){m.e(16,29,9,7).r(7,29,19,7)},K.hay,5);for(var s=0;s<6;s++)g.l(10+s*3,31,11+s*3,35,"#865816");
  g.o(function(m){m.e(31,28,5,4).r(26,28,11,4)},K.hay,3);
  g.o(function(m){m.e(49,21,5,4).e(53,14,5,4).e(57,7,5,4)},K.smoke,4,{outline:false});
  g.o(function(m){m.r(40,35,15,5).r(43,32,9,4)},K.red,1);g.r(44,33,3,2,"#2a2a36");g.r(48,33,3,2,"#2a2a36");
  g.o(function(m){m.e(43,41,1.5,1.5).e(52,41,1.5,1.5)},K.black,1);
  g.o(function(m){m.e(47,29,6,4).e(46,26,3,3)},K.fire,4,{outline:false});
};
A.b9=function(g){ // Mon déjeuner sur l'herbe
  g.bands(0,30,["#203a22","#2a4a2a","#365a32","#426a3a"]);g.o(function(m){m.e(32,18,10,4)},["#5a7a6a","#8aa898","#a6bea4","#c0d4bc","#dcecd8"],2);
  g.o(function(m){m.e(8,8,9,8)},K.green,5);g.o(function(m){m.e(56,6,10,8)},K.green,5);
  g.bands(28,48,["#6a9440","#5a8438","#4a7430","#3c6428"]);for(var y=30;y<48;y+=3)for(var x=(y%2)*4;x<64;x+=8)g.r(x,y,2,1,"#82ac52");
  g.o(function(m){m.poly([[10,36],[52,34],[56,42],[8,44]])},K.white,1);
  g.o(function(m){m.poly([[24,40],[28,26],[36,26],[42,40]])},K.blue,4);g.o(function(m){m.e(32,24,3,3.5)},K.skin,2);
  g.o(function(m){m.e(32,20,7,2).r(29,17,6,3)},K.yellow,2);
  function bather(x,dir){g.o(function(m){m.l(x+dir*3,27,x+dir*7,33,3).r(x-3,38,2,4).r(x+2,38,2,4)},K.skin,1);
    g.o(function(m){m.r(x-3,26,7,12)},K.white,2);for(var y=27;y<37;y+=2)g.r(x-2,y,5,1,"#2c4a8a");
    g.o(function(m){m.e(x,22,3,3.5)},K.skin,2);g.r(x-2,19,5,1,"#4e3628")}
  bather(16,-1);bather(48,1);
  g.o(function(m){m.r(10,41,7,5)},K.wood,1);g.o(function(m){m.e(12,40,1.5,1.5).e(15,40,1.5,1.5)},K.red,1);
};
A.b10=function(g){ // Ear, wrapped as a parcel
  g.r(0,0,64,48,"#22407e");
  for(var s=0;s<4;s++){var cx=[12,50,16,52][s],cy=[10,10,38,40][s];for(var a=0;a<720;a+=7){var rr=a/120;g.p(cx+rr*Math.cos(a*Math.PI/180),cy+rr*.7*Math.sin(a*Math.PI/180),s%2?"#4a6cb8":"#8aa4e0")}}
  [[6,4],[58,22],[4,26],[40,4],[60,44]].forEach(function(q){g.o(function(m){m.e(q[0],q[1],2,2)},K.yellow,2,{outline:false})});
  g.o(function(m){m.e(32,25,11,15).e(29,39,5,4)},K.skin,5);g.o(function(m){m.e(34,25,6,10)},K.skin,4,{inv:true});g.o(function(m){m.e(32,26,2.5,6)},K.skin,2);
  g.o(function(m){m.l(21,20,43,28,3)},K.white,1);
  g.l(32,9,32,44,"#a4202a");g.l(21,26,43,26,"#a4202a");g.o(function(m){m.e(29,8,3,2).e(35,8,3,2)},K.red,2);g.p(32,8,"#360814");
  g.o(function(m){m.r(39,33,7,6)},K.white,0,{base:3});g.r(41,35,3,2,"#c4302c");
};
A.b11=function(g){ // Pastorales Tahitiennes
  g.bands(0,16,["#f0a048","#f4b45a","#f8c86e"]);g.r(0,16,64,3,"#288484");g.r(0,16,64,1,"#48b4ac");g.bands(19,48,["#ec7ca2","#de6890","#cc5480","#bc4472"]);
  g.o(function(m){m.l(55,47,58,10,3)},K.wood,1);g.o(function(m){[[-1,-.4],[1,-.3],[-1,.4],[1,.5],[.2,-1]].forEach(function(d){m.l(58,10,58+d[0]*9,10+d[1]*7,2)})},K.green,1);
  g.o(function(m){m.e(30,12,6,6)},["#f9e04b","#fbe870","#fcf096","#fef8c4","#ffffff"],2,{outline:false});
  g.o(function(m){m.r(17,19,26,3).r(27,18,6,10).e(30,13,3,3.5).r(28,36,2,8).r(31,36,2,8)},K.skinDark,2);g.r(27,9,6,2,"#1a1410");
  g.o(function(m){m.r(26,26,8,10)},K.red,2);g.p(28,28,"#fff");g.p(31,31,"#fff");g.p(29,34,"#fff");
  g.o(function(m){m.e(10,41,6,6)},K.blue,4);g.o(function(m){m.e(10,33,3,3)},K.skinDark,2);g.r(7,30,6,2,"#1a1410");
  g.o(function(m){m.e(44,42,6,5)},K.yellow,4);g.o(function(m){m.e(44,34,3,3)},K.skinDark,2);g.r(41,31,6,2,"#1a1410");
};
/* ---------- Modernism ---------- */
A.b12=function(g){ // The Uncontrollable Giggle
  var sky=["#e2582b","#f08a3a","#f4c25a","#e86a30"];
  for(var y=0;y<22;y++)for(var x=0;x<64;x++)g.p(x,y,sky[Math.floor((y+2*Math.sin(x/5)+40)/3)%4]);
  for(y=14;y<36;y++)for(x=0;x<64;x++)if(y>14+x*.18)g.p(x,y,((y+Math.round(1.5*Math.sin(x/4)))>>1)%2?"#2f4a8a":"#4a6aa8");
  g.o(function(m){m.poly([[0,14],[22,18],[10,36],[0,40]])},K.olive,2);
  g.o(function(m){m.poly([[0,40],[64,22],[64,29],[0,48]])},K.wood,1);g.l(0,37,63,19,"#462812");for(var i=0;i<8;i++){var px=4+i*8;g.l(px,37-px*.28,px,41-px*.28,"#462812")}
  g.fig(50,27,7,"#cfcfcf","#1a1a1a");g.fig(55,26,7,"#cfcfcf","#1a1a1a");
  g.o(function(m){m.poly([[22,48],[26,34],[36,34],[40,48]])},["#0a0a14","#1c1a2a","#2a2838","#3a3850","#4e4c68"],3);
  g.o(function(m){m.e(31,25,5,7)},K.bone,4);g.o(function(m){m.e(25,26,2,3).e(37,26,2,3)},K.bone,1);
  g.l(28,23,30,22,"#3a2a1a");g.l(32,22,34,23,"#3a2a1a");g.o(function(m){m.e(31,29,3,2)},["#2a0808","#5a1a1a","#5a1a1a","#7a2a2a","#7a2a2a"],0);g.r(29,28,5,1,"#f4f4f4");
  g.p(26,23,"#7fc4ff");g.p(25,21,"#7fc4ff");g.p(36,23,"#7fc4ff");g.p(37,21,"#7fc4ff");
  g.t(4,3,"HA","#fff3c8");g.t(46,6,"HA","#fff3c8");
};
A.b13=function(g){ // A Rose Is a Rose Is a Rose Is a Rose
  g.bands(0,48,["#f4e6c8","#eedcb6","#e8d0a2","#e0c48e"]);
  g.o(function(m){m.poly([[0,48],[10,32],[20,48]])},K.green,2);g.o(function(m){m.poly([[44,48],[56,30],[64,40],[64,48]])},K.green,2);
  function rose(cx,cy,s){g.o(function(m){for(var a=0;a<5;a++){var t=a*1.2566+.3;m.e(cx+Math.cos(t)*5*s,cy+Math.sin(t)*4.4*s,6*s,5*s)}},K.rose,3*s);
    g.o(function(m){m.e(cx+.5*s,cy-.5*s,6*s,5*s)},K.rose,3*s);g.o(function(m){m.e(cx+s,cy-s,3.5*s,3*s)},K.rose,2*s,{inv:true});
    if(s>1){g.l(cx-2,cy-2,cx+3,cy-3,"#360612");g.l(cx+3,cy-3,cx+4,cy+1,"#360612");g.l(cx+4,cy+1,cx,cy+2,"#360612")}}
  rose(32,24,1.9);rose(6,6,.55);rose(58,6,.55);rose(58,42,.55);
};
A.b14=function(g){ // American Goths
  g.bands(0,24,["#94c2e6","#acd0ec","#c4def2","#d8eaf6"]);g.o(function(m){m.e(4,20,8,10)},K.green,5);g.o(function(m){m.e(60,18,8,12)},K.green,5);
  g.o(function(m){m.r(12,8,40,30)},K.white,0,{base:2});g.o(function(m){m.poly([[10,9],[32,0],[54,9]])},K.wood,1);for(var x=15;x<51;x+=3)g.l(x,10,x,37,"#c4c4d0");
  g.o(function(m){m.poly([[28,18],[32,11],[36,18],[36,26],[28,26]])},["#121620","#202634","#2c3446","#3a4458","#4a566c"],0);g.r(31,12,1,14,"#d8d8e2");g.r(28,20,8,1,"#d8d8e2");
  function goth(x,man){g.o(function(m){m.poly([[x-9,48],[x-7,31],[x+7,31],[x+9,48]])},K.black,3);
    if(!man)g.o(function(m){m.e(x,18,6,4).r(x-6,18,2,10).r(x+4,18,2,10)},K.black,2);
    g.o(function(m){m.e(x,22,4.5,6)},K.skinPale,3);g.p(x-2,21,"#111");g.p(x+2,21,"#111");g.r(x-3,20,2,1,"#5a2a7a");g.r(x+2,20,2,1,"#5a2a7a");g.r(x-1,25,3,1,"#2a0a2a");
    for(var k=0;k<5;k++)g.p(x-4+k*2,31,"#d8d8e2");
    if(man){for(var s=0;s<5;s++)g.r(x-2+s,13-(s%2)*2,1,4+(s%2)*2,"#111");g.r(x-4,16,9,2,"#111");g.p(x-2,21,"#a6a6b4");g.p(x+2,21,"#a6a6b4")}else g.r(x-3,15,2,3,"#8a3ac8")}
  goth(22,false);goth(42,true);
  g.r(51,14,1,34,"#787888");g.r(48,12,1,5,"#a6a6b4");g.r(51,11,1,5,"#a6a6b4");g.r(54,12,1,5,"#a6a6b4");g.r(48,16,7,1,"#a6a6b4");
};
A.b15=function(g){ // Times Square Traffic Jam
  g.r(0,0,64,48,"#f2efe6");var Y="#f2c81f";
  [5,19,33,47,58].forEach(function(x){g.r(x,0,2,48,Y)});[5,15,25,35,43].forEach(function(y){g.r(0,y,64,2,Y)});
  var cars=["#d22e2e","#2c5bc2","#8a8a8a"],k=0;
  [5,19,33,47,58].forEach(function(x){for(var y=1;y<47;y+=3)if((y+x)%7<5){g.r(x,y,2,2,cars[k++%3]);g.p(x,y,"#ffffff")}});
  [5,15,25,35,43].forEach(function(y){for(var x=1;x<63;x+=3)if((y+x*3)%9<6){g.r(x,y,2,2,cars[k++%3]);g.p(x,y,"#ffffff")}});
  [[10,19,6,4,"#d22e2e"],[38,8,6,4,"#2c5bc2"],[24,38,6,4,Y],[50,27,5,5,"#2c5bc2"]].forEach(function(q){g.r(q[0],q[1],q[2],q[3],q[4]);g.r(q[0],q[1]+q[3],q[2],1,"#c8c4b8")});
  g.r(26,39,2,2,"#d22e2e");g.r(51,28,3,3,"#d22e2e");
};
/* ---------- Surrealism ---------- */
A.b16=function(g){ // Eating Gypsy
  g.bands(0,28,["#121a32","#18223e","#1e2c4a","#263858"]);[[6,4],[14,9],[24,3],[34,7],[40,12],[8,16],[28,14],[60,16]].forEach(function(q){g.p(q[0],q[1],"#cfd8ff")});g.p(24,2,"#8a96c0");g.p(24,4,"#8a96c0");g.p(23,3,"#8a96c0");g.p(25,3,"#8a96c0");
  g.o(function(m){m.e(51,8,4,4)},K.moon,3);g.o(function(m){m.e(53,7,3,3)},flat("#1e2c4a","#1e2c4a"),0);
  g.r(0,26,64,2,"#4a6a8a");g.bands(28,48,["#c8a468","#b8945a","#a8864e","#987844"]);
  g.o(function(m){m.e(10,26,10,3)},["#2a2434","#4a4058","#6a5a6a","#8a7a84","#a89aa0"],1);
  g.o(function(m){m.e(34,31,12,6).r(24,34,3,8).r(30,35,3,7).r(38,35,3,7).r(43,34,3,8).l(46,29,52,24,2)},K.lion,4);g.o(function(m){m.e(53,23,1.5,1.5)},K.mane,1);
  g.o(function(m){m.e(21,25,8,8)},K.mane,4);g.o(function(m){m.e(20,25,5,5)},K.lion,3);
  g.p(18,24,"#111");g.p(22,24,"#111");g.r(19,27,3,1,"#6a3a1a");g.p(22,28,"#f07090");g.p(23,28,"#f07090");
  g.o(function(m){m.poly([[15,30],[25,30],[20,37]])},K.white,1);g.p(20,32,"#c4302c");
  g.o(function(m){m.e(50,43,3,2).l(52,42,58,38,1)},K.wood,1);g.o(function(m){m.e(40,43,2,3)},K.orange,2);g.r(4,42,8,1,"#c4302c");g.r(4,43,8,1,"#2c66b4");g.r(4,44,8,1,"#c4302c");
};
A.b17=function(g){ // Ceci est une cigarette
  g.bands(0,48,["#ece0c6","#e6d8bc","#dfcfb0"]);g.r(11,26,42,1,"#c8b490");
  g.o(function(m){m.r(10,18,38,7)},K.white,3);g.o(function(m){m.r(10,18,11,7)},K.orange,3);for(var x=12;x<20;x+=3)g.p(x,20+(x%2),"#a4461a");
  g.o(function(m){m.r(48,18,4,7)},K.grey,2);g.r(52,19,1,5,"#e8452b");g.p(52,21,"#ffb04a");
  for(var y=17;y>1;y--)g.p(53+Math.round(2*Math.sin(y/2.4)),y,y%5?"#b8b4b0":"#d8d4d0");
  g.t(10,33,"CECI EST UNE","#2a2a2a");g.t(14,40,"CIGARETTE.","#2a2a2a");
};
A.b18=function(g){ // Le burger en fourrure
  g.bands(0,48,["#6a5476","#5e4a6a","#52405e","#463652"]);
  g.o(function(m){m.e(32,39,23,5)},K.china,3);g.o(function(m){m.e(32,39,17,3)},K.china,2,{inv:true,outline:false});
  function furry(cx,cy,rx,ry){g.o(function(m){m.e(cx,cy,rx,ry)},K.fur,4);
    for(var y=Math.ceil(cy-ry+1);y<cy+ry-1;y+=2)for(var x=Math.ceil(cx-rx+1)+(y%4?1:0);x<cx+rx-1;x+=3){var dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy<.7)g.l(x,y,x+1,y+1,dx+dy<-.2?"#e8c494":(dx+dy>.3?"#6a4422":"#c89a68"))}}
  furry(32,33,15,4);g.o(function(m){m.e(32,28,16,3)},K.roast,2);for(var x=17;x<48;x+=2)g.p(x,31-(x%4?0:1),"#6eb048");
  furry(32,22,15,7);
  g.o(function(m){m.l(50,40,59,33,2).e(47,41,3,1.5)},K.fur,1);
};
A.b19=function(g){ // Self-Portrait with Beehive
  g.bands(0,48,["#2a6436","#24582f","#1e4c28"]);
  [[6,8],[14,30],[52,10],[58,30],[8,42],[56,44],[46,22],[18,18],[4,24],[60,4]].forEach(function(q,i){g.o(function(m){m.e(q[0],q[1],4,2)},K.green,2)});
  g.o(function(m){m.poly([[14,48],[20,36],[44,36],[50,48]])},K.teal,3);for(var i=0;i<6;i++)g.p(22+i*4,40+(i%2)*3,"#f0c42a");g.o(function(m){m.r(24,36,16,2)},K.red,0);
  g.o(function(m){m.e(32,16,10,14)},K.hairDark,5);for(var y2=5;y2<26;y2+=3)g.l(25,y2,39,y2,"#100a0c");
  g.o(function(m){m.r(27,6,6,5)},K.gold,1);g.p(29,8,"#865610");g.p(31,8,"#865610");
  g.o(function(m){m.e(32,27,6,7)},K.skinTan,3);g.r(27,24,11,1,"#1a1410");g.p(29,26,"#1a1410");g.p(35,26,"#1a1410");g.r(30,31,4,1,"#b8202a");
  g.o(function(m){m.e(24,22,2,2)},K.red,1);g.o(function(m){m.e(40,22,2,2)},K.pink,1);
  [[18,6],[46,9],[44,20],[16,24],[50,3],[22,2],[40,2],[48,28]].forEach(function(q){g.p(q[0],q[1],"#f4d150");g.p(q[0]+1,q[1],"#111");g.p(q[0]+2,q[1],"#f4d150");g.p(q[0]+1,q[1]-1,"#e8f4ff")});
};
/* ---------- Pop ---------- */
A.b20=function(g){ // Lady Gaga, Warhol style
  var bg=["#ff5fa2","#3fd0e0","#f9e04b","#ff8a3a"],face=["#f9e04b","#ff5fa2","#7a5af0","#3fd0e0"],hair=["#fffbe6","#f9e04b","#ff5fa2","#fffbe6"];
  for(var i=0;i<4;i++){(function(i){var ox=(i%2)*32,oy=Math.floor(i/2)*24,cx=ox+16,cy=oy+12;g.r(ox,oy,32,24,bg[i]);
    g.o(function(m){m.e(cx,cy,8,8).e(cx-4,cy-9,3,2).e(cx+4,cy-9,3,2)},flat(hair[i],"#1a1a2a"),0);
    g.o(function(m){m.e(cx,cy+1,5,6)},flat(face[i],"#1a1a2a"),0);g.r(cx-5,cy-1,4,2,"#111");g.r(cx+1,cy-1,4,2,"#111");g.r(cx-1,cy-1,2,1,"#111");g.r(cx-1,cy+4,3,1,"#d0103a");
    g.r(cx-8,cy+8,16,4,"#1a1a2a")})(i)}
};
A.b21=function(g){ // I'm Just Transferring You.
  g.r(0,0,64,48,"#ffffff");for(var y=1;y<48;y+=3)for(var x=(y%2)?1:2;x<64;x+=3)g.p(x,y,"#86b6ec");
  g.o(function(m){m.e(38,24,15,17)},flat("#f4d11a","#111"),0);for(var k=0;k<4;k++)g.l(29+k*5,10,27+k*5,34,"#c8a010");
  g.o(function(m){m.e(36,28,7.5,9.5)},flat("#ffffff","#111"),0);for(y=20;y<38;y++)for(x=29;x<44;x++)if((x+y)%3===0&&(x-36)*(x-36)/49+(y-28)*(y-28)/81<.85)g.p(x,y,"#f08a80");
  g.r(31,25,4,1,"#111");g.r(38,25,4,1,"#111");g.r(32,26,2,1,"#2a6ad0");g.r(39,26,2,1,"#2a6ad0");g.r(34,33,5,2,"#d0102a");g.p(42,29,"#86c8ff");g.p(42,30,"#86c8ff");
  for(var a=200;a<340;a+=3)g.p(36+10*Math.cos(a*Math.PI/180),20+10*Math.sin(a*Math.PI/180),"#111");g.o(function(m){m.e(26,26,2,3)},flat("#333","#111"),0);g.l(26,29,32,34,"#111");
  g.o(function(m){m.poly([[1,1],[30,1],[30,15],[18,15],[22,21],[12,15],[1,15]])},flat("#ffffff","#111"),0);
  g.t(4,3,"PLEASE","#111");g.t(4,9,"HOLD...","#111");
  g.r(0,0,64,1,"#111");g.r(0,47,64,1,"#111");g.r(0,0,1,48,"#111");g.r(63,0,1,48,"#111");
};
A.b22=function(g){ // Untitled Film Still #5022 (black and white)
  g.bands(0,48,["#8a8a8a","#7a7a7a","#6a6a6a","#5a5a5a","#4a4a4a"]);
  var G1=["#101010","#3a3a3a","#5a5a5a","#7a7a7a","#9a9a9a"],G2=["#202020","#8a8a8a","#bcbcbc","#dcdcdc","#f4f4f4"];
  [[4,3],[14,4],[50,4],[58,3]].forEach(function(q){g.o(function(m){m.r(q[0],0,q[1],48)},G1,1)});
  g.o(function(m){m.e(32,30,9,12).r(23,36,18,12)},G1,4);g.o(function(m){m.r(40,14,3,12)},G1,1);
  g.o(function(m){m.e(32,11,6,4).r(26,11,2,8)},["#080808","#141414","#202020","#2e2e2e","#3e3e3e"],2);
  g.o(function(m){m.e(32,17,4.5,5)},G2,3);g.r(28,12,8,2,"#141414");g.p(30,17,"#222");g.p(34,17,"#222");g.r(31,20,3,1,"#8a8a8a");
  for(y=18;y<34;y+=2)g.o(function(m){m.e(37,y,1.2,1)},["#080808","#141414","#202020","#2e2e2e","#3e3e3e"],1);
  for(var a=-70;a<=70;a+=3)g.p(14+4.5*Math.cos(a*Math.PI/180),28+14.4*Math.sin(a*Math.PI/180),"#c8c8c8");g.l(18,14,18,42,"#e0e0e0");g.l(12,28,28,28,"#d8d8d8");g.p(11,27,"#f0f0f0");g.p(11,29,"#f0f0f0");
  g.p(40,13,"#e8e8e8");g.p(42,12,"#e8e8e8");
  var y;g.r(0,0,64,2,"#f4f4f0");g.r(0,46,64,2,"#f4f4f0");g.r(0,0,2,48,"#f4f4f0");g.r(62,0,2,48,"#f4f4f0");
};
A.b23=function(g){ // You Just Stepped On My Toe
  g.bands(0,48,["#a2a2a2","#929292","#828282","#727272","#626262"]);
  g.o(function(m){m.e(18,30,16,7).e(4,25,2,1.8).e(7,23,2,1.8).e(10,22,2,1.8).e(13,22,2,1.8).e(16,23,2,1.8)},["#3a3a3a","#9a9a9a","#c8c8c8","#e0e0e0","#f6f6f6"],4);
  g.o(function(m){m.poly([[26,20],[60,16],[62,32],[24,34]]).r(56,30,4,14)},["#000000","#0a0a0a","#181818","#2a2a2a","#4a4a4a"],3);
  g.r(4,3,42,15,"#e1251b");g.t(6,5,"YOU JUST","#ffffff");g.t(6,11,"STEPPED ON","#ffffff");
  g.r(30,37,28,9,"#e1251b");g.t(32,39,"MY TOE","#ffffff");
};
/* ---------- Installation ---------- */
A.b24=function(g){ // Papa: giant tick
  g.bands(0,38,["#e2ded6","#dad6cd","#d2cdc3"]);g.bands(38,48,["#aa9c88","#9a8c78","#8a7c68"]);g.r(0,38,64,1,"#7a6c58");
  g.o(function(m){[[24,30,14,44],[28,32,22,45],[38,32,44,45],[42,30,52,44],[22,26,10,30],[44,26,56,30],[26,22,14,16],[42,22,52,16]].forEach(function(q){var mx=(q[0]+q[2])/2,my=Math.min(q[1],q[3])-4;m.l(q[0],q[1],mx,my,2).l(mx,my,q[2],q[3],2)})},K.bronze,0,{litOutline:0,base:1});
  g.o(function(m){m.e(36,26,13,10)},K.bronze,7);g.o(function(m){m.e(22,25,5,4).r(16,25,3,1)},K.bronze,2,{base:1});
  g.r(38,38,10,1,"#7a6c58");
  g.fig(6,44,9,"#d8b48a","#3a5a8a","#222");g.fig(58,44,9,"#c48a5a","#c0392b","#111");
};
A.b25=function(g){ // Aubergines mirror room
  g.r(0,0,64,48,"#0b0b14");g.bands(30,48,["#10101c","#161626","#1c1c30"]);
  for(var j=0;j<5;j++)for(var i=0;i<11;i++)g.p(3+i*6+(j%2)*3,2+j*6,["#ffffff","#ff5a5a","#f4d11a"][(i+j)%3]);
  function aub(x,y,s,ramp,dot){g.o(function(m){m.e(x,y,3*s,4.5*s)},ramp,3*s);g.o(function(m){m.e(x-s*.5,y-3.8*s,2*s,1.2*s).r(Math.round(x-s*.5),Math.round(y-5.4*s),1,Math.ceil(s*1.5))},K.green,1);
    for(var k=0;k<5;k++){var a=k*1.25+.4;g.r(Math.round(x+Math.cos(a)*1.6*s),Math.round(y+Math.sin(a)*2.4*s),s>1.5?2:1,s>1.5?2:1,dot)}}
  [6,18,30,42,54].forEach(function(x,i){aub(x+3,10,1,i%2?K.yellow:K.purple,i%2?"#111":"#f4d11a")});
  [10,26,42,56].forEach(function(x,i){aub(x,23,1.6,i%2?K.purple:K.yellow,i%2?"#f4d11a":"#111")});
  aub(14,38,2,K.purple,"#f4d11a");aub(50,38,2,K.purple,"#f4d11a");aub(32,36,2.4,K.yellow,"#111");
};
A.b26=function(g){ // How to Explain Pictures to a Dead Man
  g.bands(0,40,["#42424e","#3a3a46","#32323e"]);g.o(function(m){m.r(0,40,64,8)},K.wood,0);
  [[4,6,10,8,"#c4302c"],[18,4,8,10,"#2c66b4"],[52,6,9,7,"#f0c42a"]].forEach(function(q){g.o(function(m){m.r(q[0]-1,q[1]-1,q[2]+2,q[3]+2)},K.gold,0,{base:3});g.r(q[0]+1,q[1]+1,q[2]-2,q[3]-2,q[4])});
  g.o(function(m){m.r(4,37,26,6)},K.grey,2);g.o(function(m){m.r(28,37,3,6)},K.white,0);g.o(function(m){m.r(1,38,4,4)},K.black,0);
  g.o(function(m){m.e(36,38,5,4)},K.gold,3);g.r(37,37,2,1,"#865610");
  g.o(function(m){m.e(52,31,5,8).e(52,20,4,4).r(49,7,3,10).r(54,7,3,10).e(55,39,3,1.5).e(49,39,3,1.5).l(47,26,51,28,2)},["#2a1a0e","#6a4a2a","#a07850","#c09a70","#e0c094"],3);
  g.r(50,9,1,7,"#e8a0a0");g.r(55,9,1,7,"#e8a0a0");g.o(function(m){m.e(52,33,2.5,3.5)},["#c09a70","#d8bc94","#e6d0ac","#f0e0c4","#f8eedc"],2,{outline:false,spec:false});g.p(50,19,"#111");g.p(49,21,"#e88a9a");
  g.o(function(m){m.r(37,21,10,8)},K.gold,0,{base:3});g.r(38,22,8,6,"#7ac0e8");g.r(38,26,8,2,"#4a8a3a");g.p(41,23,"#fff8c0");
};
A.b27=function(g){ // Present: a wrapped building
  g.bands(0,40,["#7eb8e6","#94c6ec","#aad4f2","#c0e2f6"]);g.o(function(m){m.r(0,40,64,8)},K.green,0);
  g.o(function(m){m.r(8,18,48,22).r(5,12,9,28).r(50,12,9,28).e(32,17,9,6)},K.fabric,3);
  for(var x=7;x<58;x+=3)g.l(x,14,x+1,38,x%2?"#868ea0":"#d2d8e2");for(var y=16;y<40;y+=6)g.l(6,y,57,y,"#2c56b0");
  g.o(function(m){m.r(31,10,3,30).r(5,26,54,3)},K.red,1);g.o(function(m){m.e(27,8,5,3).e(38,8,5,3)},K.red,3);g.o(function(m){m.r(31,6,3,4)},K.red,0,{base:1});
  g.fig(20,46,6,"#d8b48a","#2c5bc2");g.fig(44,46,6,"#c48a5a","#f2c81f");
};
/* ---------- Contemporary ---------- */
A.b28=function(g){ // The Artist Is Living in Your Home
  g.bands(0,36,["#ecdcba","#e8d6b2","#e4d0aa"]);for(var x=0;x<64;x+=5)g.r(x,0,1,36,"#dccaa2");
  g.bands(36,48,["#a8784a","#986a40","#8a5c36"]);for(var y=39;y<48;y+=3)g.l(0,y,63,y,"#764822");
  g.o(function(m){m.r(4,6,14,12)},K.sky,0);g.r(10,6,1,12,"#ffffff");g.r(4,12,14,1,"#ffffff");g.o(function(m){m.r(2,4,4,18).r(16,4,4,18)},K.red,2);
  g.o(function(m){m.r(46,18,18,16).r(44,24,4,10)},K.blue,3);
  g.o(function(m){m.r(26,28,14,2).r(27,30,1,8).r(38,30,1,8)},K.wood,1);
  g.o(function(m){m.r(17,24,2,14).r(17,32,7,1)},K.wood,0);
  g.o(function(m){m.poly([[19,20],[26,20],[28,40],[16,40]])},K.red,4);g.o(function(m){m.e(22,16,3,3.5)},K.skin,2);g.o(function(m){m.r(19,12,4,4).r(20,16,2,9)},K.hairDark,1);g.p(24,16,"#111");
  g.o(function(m){m.e(44,32,3,4).e(44,26,2.5,2.5).r(43,23,1,2).r(46,23,1,2).r(47,34,4,1)},K.grey,3);g.p(43,26,"#f2d24a");g.p(45,26,"#f2d24a");
};
A.b29=function(g){ // Little Big Pony
  g.bands(0,18,["#94d0f2","#b0dcf6","#ccecfa"]);g.bands(18,26,["#3a96cc","#4ea8d8","#64bce4"],1,.5);g.r(0,25,64,1,"#ffffff");g.bands(26,48,["#f4e0a8","#ecd498","#e4c888","#dcbc7a"]);
  g.o(function(m){m.e(32,42,14,2)},flat("#cbaa6a","#cbaa6a"),0);
  g.o(function(m){m.r(23,32,3,10).r(28,33,3,9).r(36,33,3,9).r(41,32,3,10).e(32,29,12,6).e(22,21,3,7).e(18,14,6,4).e(13,15,3,2.5).e(21,9,1.5,2.5).e(46,26,3,2).e(49,29,2,3)},K.pink,4);
  [[24,14],[26,18],[27,22]].forEach(function(q){g.o(function(m){m.e(q[0],q[1],2,2)},K.purple,2)});
  [[26,26],[17,12],[22,33],[40,33],[30,27]].forEach(function(q){g.p(q[0],q[1],"#ffffff");g.p(q[0]+1,q[1],"#ffe0f0")});g.p(16,13,"#111");
  g.o(function(m){m.poly([[49,30],[59,30],[54,25]])},K.red,1);g.p(52,28,"#fff");g.p(56,28,"#fff");g.r(54,30,1,8,"#5a5a5a");g.fig(51,40,6,"#e3bf95","#2c5bc2");g.fig(57,40,6,"#c48a5a","#f2c81f");
};
A.b30=function(g){ // The Essential Saltiness of the Pickling Process...
  g.bands(0,40,["#f2f2ef","#ececea","#e6e6e3"]);g.bands(40,48,["#d2d2d2","#c4c4c4","#b6b6b6"]);
  g.o(function(m){m.r(7,40,50,4)},K.white,1);
  g.o(function(m){m.r(8,6,48,34)},K.white,0,{base:3});g.bands(7,39,["#b4e4dc","#a4dcd2","#94d2c8","#84c8be"]);g.r(8,7,1,32,"#e8eef0");g.r(55,7,1,32,"#e8eef0");g.r(31,7,2,32,"#f0f4f6");g.r(8,6,48,1,"#d8dce2");g.r(8,39,48,1,"#c4c8d0");
  g.o(function(m){m.e(32,24,15,5)},K.pickle,5);for(var x=20;x<45;x+=3)g.p(x,22+(x%2),"#b8e07a");
  [[14,32],[20,12],[46,14],[50,30],[40,10]].forEach(function(q){g.p(q[0],q[1],"#ffffff");g.p(q[0]+1,q[1]-2,"#e8fffb")});
};
A.b31=function(g){ // Every Pillow I Have Ever Slept With
  g.bands(0,40,["#dccab2","#d6c4aa","#d0bea2"]);g.bands(40,48,["#8a6a4a","#7c5e40","#6e5236"]);g.o(function(m){m.r(48,28,16,12)},K.wood,2);g.o(function(m){m.r(48,27,16,3)},K.white,1);
  var cs=[K.white,K.pink,K.blue,K.yellow,K.red,K.green,K.white,K.purple,K.orange],y=44;
  cs.forEach(function(ramp,i){var w=24+((i*7)%9),h=4+(i%2),x=Math.round(32-w/2+((i*5)%5)-2);y-=h;
    g.o(function(m){m.r(x+1,y,w-2,h).r(x,y+1,w,h-2)},ramp,2);
    if(i===2)for(var s=2;s<w-2;s+=3)g.r(x+s,y+1,1,h-2,"#ffffff");if(i===5)for(s=3;s<w-2;s+=4)g.p(x+s,y+2,"#245428")});
};
/* ---------- Graffiti ---------- */
A.b32=function(g){ // My Homepage
  g.r(0,0,64,48,"#f2c81f");[[3,40,9,37],[52,44,60,41],[56,4,62,8],[2,6,7,3],[44,6,49,4]].forEach(function(q,i){g.l(q[0],q[1],q[2],q[3],i%2?"#d0302a":"#111")});
  g.l(22,10,24,2,"#111");g.l(24,2,28,8,"#111");g.l(28,8,32,1,"#111");g.l(32,1,36,8,"#111");g.l(36,8,40,2,"#111");g.l(40,2,42,10,"#111");g.r(22,10,21,1,"#111");g.l(23,9,41,9,"#111");
  g.r(8,13,48,32,"#111");g.r(9,14,46,30,"#f4f4f4");g.r(9,14,46,4,"#c0c0c8");g.p(11,15,"#e8452b");g.p(13,15,"#f2c81f");g.p(15,15,"#3ab05a");g.r(19,15,30,2,"#ffffff");
  g.o(function(m){m.e(22,30,7.5,8.5)},flat("#e8e0cc","#111"),0);g.r(17,27,4,3,"#111");g.r(24,27,4,3,"#111");g.r(17,34,10,3,"#111");for(var t=18;t<27;t+=2)g.r(t,34,1,2,"#ffffff");g.l(14,22,30,22,"#d0302a");
  g.r(34,21,18,2,"#111");g.r(34,25,14,2,"#111");g.r(34,29,16,2,"#111");
  var hx=38,hy=34;g.r(hx,hy,2,1,"#e8452b");g.r(hx+3,hy,2,1,"#e8452b");g.r(hx-1,hy+1,7,2,"#e8452b");g.r(hx,hy+3,5,1,"#e8452b");g.r(hx+1,hy+4,3,1,"#e8452b");g.p(hx+2,hy+5,"#e8452b");g.t(46,35,"99","#111");
};
A.b33=function(g){ // Self-Portrait (Banksy)
  g.r(0,0,64,48,"#d4c0a8");var br=["#a8502e","#9a4628","#b45a34"];
  for(var row=0;row<12;row++)for(var c=-1;c<9;c++){var x=c*8+(row%2)*4,y=row*4,col=br[(row*3+c*5+99)%3];g.r(x,y,7,3,col);g.r(x,y,7,1,"#c46a42");g.r(x,y+2,7,1,"#86381e")}
  g.o(function(m){m.poly([[18,48],[22,26],[40,26],[44,48]]).e(31,18,8,9).l(40,30,48,18,3)},flat("#111111","#111111"),0);
  g.o(function(m){m.r(46,10,4,8)},K.grey,2);g.r(46,9,4,1,"#e8452b");g.p(45,6,"#d8d8e2");g.p(44,5,"#d8d8e2");g.p(43,4,"#a6a6b4");
  for(var j=0;j<4;j++)for(var i=0;i<4;i++)g.r(27+i*2,14+j*2,2,2,["#9a9a9a","#6a6a6a","#c8c8c8","#7a7a7a"][(i*3+j*5)%4]);
  [21,26,36,42].forEach(function(x){g.l(x,45-(x%4),x,47,"#111")});
  g.o(function(m){m.e(10,10,4,4.5)},K.red,4);g.l(10,15,14,30,"#111");
};
A.b34=function(g){ // Pop Plane
  g.r(0,0,64,48,"#2c8ae8");[[4,4,14,10],[60,42,50,36],[4,44,14,38],[60,6,52,12],[30,44,30,40],[34,4,34,9]].forEach(function(q){g.l(q[0],q[1],q[2],q[3],"#ffffff")});
  g.o(function(m){m.poly([[4,10],[9,10],[12,18],[7,18]]).r(5,18,50,10).e(55,23,7,5).poly([[23,27],[37,27],[30,39],[21,39]])},flat("#ffffff","#111"),0);g.r(56,20,4,2,"#111");
  var cs=["#e8452b","#f2c81f","#3ab05a","#111","#e85a8a","#2c5bc2"];
  for(var i=0;i<7;i++){var x=9+i*6,c=cs[i%cs.length];g.r(x+1,20,2,2,c);g.r(x+1,22,2,3,c);g.p(x,22+(i%2),c);g.p(x+3,22+((i+1)%2),c);g.p(x,25,c);g.p(x+3,25,c)}
  g.l(26,30,32,30,"#e8452b");g.p(29,32,"#e8452b");g.r(27,33,4,2,"#e8452b");g.p(27,36,"#e8452b");g.p(30,36,"#e8452b");
};
A.b35=function(g){ // Don't Mess with Missy
  g.bands(0,48,["#a4aab0","#9aa0a6","#90969c","#868c92"]);g.r(0,30,64,1,"#7a8086");g.l(2,40,12,34,"#3ab05a");g.l(2,41,12,35,"#3ab05a");g.l(50,8,60,4,"#e85a8a");g.l(50,9,60,5,"#e85a8a");g.l(52,44,62,40,"#2c8ae8");
  g.o(function(m){m.poly([[22,48],[25,28],[39,28],[42,48]])},K.pink,4);
  g.o(function(m){m.l(26,30,19,36,3).l(19,36,25,40,3).l(38,30,45,36,3).l(45,36,39,40,3)},K.skin,1);
  g.o(function(m){m.e(32,15,11,11).r(21,15,4,12).r(39,15,4,12)},["#0c060c","#22121e","#341c2e","#4a2a42","#663a5a"],4);
  g.o(function(m){m.e(32,17,8,9)},K.skin,4);g.o(function(m){m.r(24,7,16,5)},["#0c060c","#22121e","#341c2e","#4a2a42","#663a5a"],1);
  g.r(27,16,3,4,"#ffffff");g.r(35,16,3,4,"#ffffff");g.r(28,17,2,3,"#2a1a3a");g.r(35,17,2,3,"#2a1a3a");g.p(28,17,"#ffffff");g.p(35,17,"#ffffff");g.r(27,15,3,1,"#111");g.r(35,15,3,1,"#111");g.l(25,14,30,14,"#111");g.l(34,14,39,14,"#111");
  g.r(24,21,2,1,"#f0a0a0");g.r(38,21,2,1,"#f0a0a0");g.r(31,23,3,1,"#c0102a");
};

function draw(id){var g=make(hash(id));A[id](g);return {w:W,h:H,buf:g.buf}}
function url(id){if(!A[id])return null;if(url.c[id])return url.c[id];var a=draw(id),c=document.createElement("canvas");c.width=W*S;c.height=H*S;var x=c.getContext("2d");
  for(var i=0;i<W*H;i++){x.fillStyle=a.buf[i];x.fillRect((i%W)*S,Math.floor(i/W)*S,S,S)}return url.c[id]=c.toDataURL("image/png")}
url.c={};
return {url:url,ids:Object.keys(A),draw:draw};
})();
