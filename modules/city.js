/* Low-draw-call exterior district, aligned to an existing gate. Three.js r128, no assets/network. */
(function(root){'use strict';var HT=root.HT||(root.HT={});HT.makeOuterCity=function(scene,opts){
 opts=opts||{};var T=root.THREE;if(!T)throw new Error('HT.makeOuterCity requires THREE.');
 var group=new T.Group(),staticGroup=new T.Group(),cartGroup=new T.Group(),gate=opts.gate||{},depth=Math.max(32,opts.depth||34),roadWidth=Math.max(7,opts.roadWidth||10),heading=gate.heading||0;
 group.position.set(gate.x||0,gate.y||0,gate.z||0);group.rotation.y=heading;group.updateMatrix();group.updateMatrixWorld(true);group.add(staticGroup);group.add(cartGroup);
 var materials={},geometries=[];function mat(color){var key=String(color);return materials[key]||(materials[key]=new T.MeshLambertMaterial({color:color}));}
 function geo(g){geometries.push(g);return g;}
 function box(w,h,d,color,y,x,z,parent){var m=new T.Mesh(geo(new T.BoxGeometry(w,h,d)),mat(color));m.position.set(x||0,y||0,z||0);m.castShadow=true;m.receiveShadow=true;(parent||staticGroup).add(m);return m;}
 function cone(r,h,color,y,x,z,rot,parent){var m=new T.Mesh(geo(new T.ConeGeometry(r,h,4)),mat(color));m.position.set(x||0,y||0,z||0);m.rotation.y=rot||Math.PI/4;m.castShadow=true;(parent||staticGroup).add(m);return m;}
 var dummy=new T.Object3D();function instances(parent,geometry,material,specs){if(!specs.length)return null;var mesh=new T.InstancedMesh(geometry,material,specs.length);for(var i=0;i<specs.length;i++){var s=specs[i];dummy.position.set(s.x||0,s.y||0,s.z||0);dummy.rotation.set(s.rx||0,s.ry||0,s.rz||0);dummy.scale.set(s.sx===undefined?1:s.sx,s.sy===undefined?1:s.sy,s.sz===undefined?1:s.sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 // A single slab under the entire approach, street and market prevents the town from floating.
 var ground=opts.ground||{},groundW=ground.w||opts.groundWidth||76,groundD=ground.d||depth,groundY=ground.y===undefined?-.22:ground.y;
 box(groundW,ground.thickness||.5,groundD,ground.color||0x827761,groundY,(ground.x||0),(ground.z===undefined?depth/2:ground.z));
 var startZ=ground.z===undefined?0:ground.z-groundD/2;
 function zc(f){return startZ+depth*f;}
 // Road/sidewalks sit slightly above the shared ground surface.
 box(roadWidth,.08,depth,opts.roadColor||0x77736b,groundY+.30,0,startZ+depth/2);
 box(roadWidth+4,.06,depth,opts.walkColor||0xb2a58e,groundY+.28,-roadWidth/2-2,startZ+depth/2);
 box(roadWidth+4,.06,depth,opts.walkColor||0xb2a58e,groundY+.28,roadWidth/2+2,startZ+depth/2);
 var rows=Math.max(2,Math.min(opts.maxRows||4,opts.rows||4)),colors=opts.stallColors||[0xa54632,0xc7953e,0x355e70,0x74834b],crowd={merchants:[],citizens:[]},layout=[];
 var stallX=roadWidth/2+3.2,tableG=geo(new T.BoxGeometry(1,1,1)),postG=geo(new T.CylinderGeometry(.5,.5,1,5)),goodsG=geo(new T.SphereGeometry(.5,6,5)),canopyG=geo(new T.BoxGeometry(1,1,1));
 var tables=[],posts=[],canopies=colors.map(function(){return[];}),goods=[[],[],[]];
 for(var i=0;i<rows;i++){var z=zc(.16+i*.68/Math.max(1,rows-1));[-1,1].forEach(function(side){var x=side*stallX,ci=(i+(side>0?1:0))%colors.length;layout.push({x:x,z:z,side:side,color:ci});tables.push({x:x,y:.48,z:z,sx:2.2,sy:.72,sz:1.5});[-1,1].forEach(function(q){posts.push({x:x+q*.95,y:1.45,z:z,sx:.1,sy:2.2,sz:.1});});canopies[ci].push({x:x,y:2.18,z:z,sx:2.5,sy:.12,sz:1.8});for(var g=0;g<3;g++)goods[g].push({x:x-.55+g*.55,y:.96,z:z+.1,sx:.30,sy:.21,sz:.24});});}
 instances(staticGroup,tableG,mat(0x765337),tables);instances(staticGroup,postG,mat(0x674a32),posts);
 canopies.forEach(function(a,i){instances(staticGroup,canopyG,mat(colors[i]),a);});goods.forEach(function(a,i){instances(staticGroup,goodsG,mat([0x9b5d38,0x6e8a49,0xc6a45f][i]),a);});
 // Two reusable instanced batches for house bodies, roofs and doors.
 var houseBodyG=geo(new T.BoxGeometry(1,1,1)),roofG=geo(new T.ConeGeometry(.75,1,4)),doorG=geo(new T.BoxGeometry(1,1,1)),houseColors=opts.houseColors||[0xb7a17f,0xc0aa86,0xa99576,0xc2b18d],bodies=houseColors.map(function(){return[];}),roofs=colors.map(function(){return[];}),doors=[];
 for(var h=0;h<rows;h++){var hz=zc(.16+h*.68/Math.max(1,rows-1));[-1,1].forEach(function(side){var x=side*(roadWidth/2+9.5),w=5.2,hh=3.3+((h*7+(side>0?3:0))%3)*.35,d=5.5,ci=(h+(side>0?1:0))%houseColors.length,rc=(h+2)%colors.length;bodies[ci].push({x:x,y:hh/2,z:hz,sx:w,sy:hh,sz:d});roofs[rc].push({x:x,y:hh+.7,z:hz,sx:w*1.02,sy:1.5,sz:d*1.02,ry:Math.PI/4});doors.push({x:x,y:.9,z:hz-d/2-.07,sx:.9,sy:1.8,sz:.12});});}
 bodies.forEach(function(a,i){instances(staticGroup,houseBodyG,mat(houseColors[i]),a);});roofs.forEach(function(a,i){instances(staticGroup,roofG,mat(colors[i]),a);});instances(staticGroup,doorG,mat(0x553b2d),doors);
 function localPoint(x,y,z){var p=new T.Vector3(x,y,z);group.updateMatrixWorld(true);return group.localToWorld(p);}
 // Hand out at most eight deterministic positions for ambient merchants and customers.
 layout.forEach(function(s,i){if(i>=8)return;var pt=localPoint(s.x-s.side*.72,0,s.z+1.0);(i%2?crowd.citizens:crowd.merchants).push(pt);});
 function makeCart(z){var cart=new T.Group(),cartMat=mat(0x704322),metal=mat(0x382f29),horseMat=mat(0x785137),wheelGeo=geo(new T.CylinderGeometry(.39,.39,.12,10)),bedGeo=geo(new T.BoxGeometry(1.15,.22,1.25)),baseGeo=geo(new T.BoxGeometry(1.35,.12,1.45)),bodyGeo=geo(new T.SphereGeometry(.45,8,6)),headGeo=geo(new T.SphereGeometry(.2,7,5)),neckGeo=geo(new T.CylinderGeometry(.16,.23,.55,6)),legGeo=geo(new T.CylinderGeometry(.055,.045,.52,5)),railGeo=geo(new T.CylinderGeometry(.035,.035,1.1,5)),legs=[];
  function part(g,m,x,y,z,sx,sy,sz,rx,ry,rz){var o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);o.rotation.set(rx||0,ry||0,rz||0);cart.add(o);return o;}
  part(bedGeo,cartMat,0,.82,.15,1,1,1);part(baseGeo,metal,0,.65,.15,1,1,1);[-1,1].forEach(function(side){var w=part(wheelGeo,cartMat,side*.75,.65,.2,1,1,1,0,0,Math.PI/2);w.userData.spin=true;});part(bodyGeo,horseMat,0,.82,-1.05,.55,.7,1.15);part(headGeo,horseMat,0,1.28,-1.65,.8,1.35,.8);part(neckGeo,horseMat,0,1.12,-1.4,1,1,1,-.38);for(var l=0;l<4;l++)legs.push(part(legGeo,horseMat,(l%2?1:-1)*.19,.42,-1.05+(l<2?-.28:.28)));[-1,1].forEach(function(side){part(railGeo,metal,side*.22,.67,-.44,1,1,1,Math.PI/2);});cart.position.set(opts.laneX||0,groundY+.31,z);cartGroup.add(cart);return {group:cart,legs:legs};}
 var count=Math.max(1,Math.min(3,opts.cartCount||1)),carts=[],spacing=opts.cartSpacing||depth/(count+1);for(var c=0;c<count;c++)carts.push(makeCart(startZ+depth-3-c*spacing));scene.add(group);
 var quality=0,disposed=false;function setQuality(level){quality=Math.max(0,Math.min(2,level|0));group.visible=quality<2;cartGroup.visible=quality<1;staticGroup.visible=quality<2;}
 function setEnabled(v){group.visible=!!v;if(v)setQuality(quality);}
 function update(dt){if(disposed||quality>0||!group.visible)return;dt=Math.min(.05,Math.max(0,dt||0));var speed=opts.cartSpeed||3.2;carts.forEach(function(c){c.group.position.z-=speed*dt;if(c.group.position.z<startZ+1)c.group.position.z=startZ+depth-3;c.group.children.forEach(function(child){if(child.userData.spin)child.rotation.x-=speed*dt/.39;});c.legs.forEach(function(leg,i){leg.rotation.x=Math.sin(c.group.position.z*1.2+i*Math.PI/2)*.16;});});}
 return {group:group,staticGroup:staticGroup,cartGroup:cartGroup,crowdPositions:crowd,carts:carts.map(function(c){return c.group;}),qualityTarget:{object:group,maxLevel:1,onLevel:setQuality},update:update,setEnabled:setEnabled,setQuality:setQuality,dispose:function(){if(disposed)return;disposed=true;scene.remove(group);geometries.forEach(function(g){g.dispose();});Object.keys(materials).forEach(function(k){materials[k].dispose();});}};
};})(typeof window!=='undefined'?window:this);
