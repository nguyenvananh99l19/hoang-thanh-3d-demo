/* Deterministic InstancedMesh scatter for Three.js r128. */
(function(root){'use strict';var HT=root.HT||(root.HT={});
HT.scatter=function(options){options=options||{};var T=root.THREE;if(!T||!T.InstancedMesh)throw new Error('HT.scatter requires Three.js r128.');
 var makers=options.makers||{},zones=options.zones||[],exclude=options.exclude||[],seed=(options.seed>>>0)||11,count=Math.max(0,Math.floor(options.count||0)),group=new T.Group(),kinds={},slots=[],accepted=0,attempts=0,dummy=new T.Object3D();
 function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 function maker(k){var s=makers[k];return typeof s==='function'?s():s;}
 function sample(zone){var x=(zone.x!==undefined?zone.x:zone[0])+(rand()-.5)*(zone.w!==undefined?zone.w:zone[2]),z=(zone.z!==undefined?zone.z:zone[1])+(rand()-.5)*(zone.d!==undefined?zone.d:zone[3]);return [x,z];}
 function blocked(x,z){return exclude.some(function(e){var dx=x-e.x,dz=z-e.z;return dx*dx+dz*dz<(e.r||0)*(e.r||0);});}
 Object.keys(makers).forEach(function(key){var spec=maker(key);if(!spec)return;var parts=spec.parts||[spec],weight=spec.weight===undefined?1:Math.max(0,Number(spec.weight)||0),kind={key:key,parts:[],used:0,limit:Math.max(0,Math.floor(spec.count===undefined?count:spec.count)),weight:weight,scale:spec.scale,y:spec.y||0};
  parts.forEach(function(part,index){if(!part.geometry||!part.material)return;var mesh=new T.InstancedMesh(part.geometry,part.material,kind.limit);mesh.name='HT scatter '+key+(parts.length>1?':'+index:'');mesh.instanceMatrix.setUsage(T.DynamicDrawUsage||35048);mesh.castShadow=part.castShadow!==false;mesh.receiveShadow=part.receiveShadow!==false;mesh.userData={scatterKind:key,part:index,instanceCount:0};kind.parts.push({spec:part,mesh:mesh});group.add(mesh);});if(kind.parts.length){kinds[key]=kind;slots.push(kind);}
 });
 var maxAttempts=Math.max(count*28,zones.length*20);while(accepted<count&&attempts++<maxAttempts&&zones.length){var available=slots.filter(function(k){return k.used<k.limit;});if(!available.length)break;var total=available.reduce(function(a,k){return a+k.weight;},0),pick=rand()*total,key=available[0];for(var i=0;i<available.length;i++){pick-=available[i].weight;if(pick<=0){key=available[i];break;}}
  var zone=zones[Math.floor(rand()*zones.length)],pt=sample(zone),x=pt[0],z=pt[1];if(blocked(x,z))continue;var yaw=rand()*Math.PI*2,scale=key.scale||[.85,1.15],factor=Array.isArray(scale)?scale[0]+rand()*(scale[1]-scale[0]):scale;
  key.parts.forEach(function(part){var p=part.spec,m=part.mesh,index=m.userData.instanceCount++,offset=p.offset||[0,0,0],ps=p.scale||1;dummy.position.set(x+offset[0]*factor,(options.y||0)+key.y+(p.y===undefined?(offset[1]||0)*factor:p.y*factor),z+offset[2]*factor);dummy.rotation.set(0,yaw+(p.rotationY||0),0);dummy.scale.setScalar(factor*ps);dummy.updateMatrix();m.setMatrixAt(index,dummy.matrix);});key.used++;accepted++;
 }
 Object.keys(kinds).forEach(function(k){kinds[k].parts.forEach(function(p){p.mesh.count=p.mesh.userData.instanceCount;p.mesh.instanceMatrix.needsUpdate=true;if(p.mesh.computeBoundingSphere)p.mesh.computeBoundingSphere();});});
 group.userData={kind:'ht-scatter',instances:accepted,attempts:attempts-1,kinds:kinds};return group;
};})(typeof window!=='undefined'?window:this);
