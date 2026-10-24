/* Intro flight and follow target; the host owns OrbitControls.update(). */
(function(root){'use strict';var HT=root.HT||(root.HT={});HT.CameraRig=function(camera,controls,opts){opts=opts||{};var T=root.THREE;if(!T)throw new Error('HT.CameraRig requires THREE.');var followTarget=null,flight=null,elapsed=0,fromPos,fromTarget,toPos,toTarget,autoRotateBefore=null;
 controls.minPolarAngle=opts.minPolarAngle===undefined?.18:opts.minPolarAngle;controls.maxPolarAngle=opts.maxPolarAngle===undefined?1.25:opts.maxPolarAngle;controls.minDistance=opts.minDistance||12;controls.maxDistance=opts.maxDistance||130;
 function suspendAutoRotate(){if(autoRotateBefore===null)autoRotateBefore=!!controls.autoRotate;controls.autoRotate=false;}
 function restoreAutoRotate(){if(autoRotateBefore!==null){controls.autoRotate=autoRotateBefore;autoRotateBefore=null;}}
 function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
 function intro(start,end,duration){suspendAutoRotate();followTarget=null;fromPos=(start&&start.position?start.position:camera.position).clone();fromTarget=(start&&start.target?start.target:controls.target).clone();toPos=(end&&end.position?end.position:new T.Vector3(0,28,36)).clone();toTarget=(end&&end.target?end.target:new T.Vector3(0,0,-2)).clone();flight=duration||3.6;elapsed=0;controls.enabled=false;return api;}
 function skipIntro(){if(!flight)return;camera.position.copy(toPos);controls.target.copy(toTarget);flight=null;controls.enabled=true;restoreAutoRotate();}
 function track(object,offset){if(object){suspendAutoRotate();flight=null;controls.enabled=true;}followTarget=object||null;targetOffset=offset?offset.clone():new T.Vector3(0,1,0);return api;}
 var targetOffset=new T.Vector3(0,1,0);
 function update(dt){dt=Math.max(0,Math.min(.05,dt||0));if(flight){elapsed+=dt;var k=Math.min(1,elapsed/flight),e=ease(k);camera.position.lerpVectors(fromPos,toPos,e);controls.target.lerpVectors(fromTarget,toTarget,e);if(k>=1){flight=null;controls.enabled=true;restoreAutoRotate();}}else if(followTarget){var desired=followTarget.position.clone().add(new T.Vector3(0,5,9));camera.position.lerp(desired,Math.min(1,dt*2.2));controls.target.lerp(followTarget.position.clone().add(targetOffset),Math.min(1,dt*3));}}
 var api={intro:intro,skip:skipIntro,follow:track,stopFollow:function(){followTarget=null;restoreAutoRotate();return api;},update:update,get following(){return followTarget;}};
 if(root.addEventListener)root.addEventListener('pointerdown',skipIntro,{once:true,passive:true});return api;};})(typeof window!=='undefined'?window:this);
