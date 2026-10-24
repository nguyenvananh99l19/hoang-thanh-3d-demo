/* Adaptive rendering budget and visibility pause for Three.js r128. */
(function(root){'use strict';var HT=root.HT||(root.HT={});
HT.QualityManager=function(renderer,opts){opts=opts||{};var T=root.THREE,baseRatio=Math.min(root.devicePixelRatio||1,opts.maxPixelRatio||1.5),ratio=baseRatio,minRatio=opts.minPixelRatio||.75,level=0,frames=0,elapsed=0,good=0,hidden=!!(root.document&&root.document.hidden),disposed=false;
 var lines=opts.lineOptions||[],roofs=opts.roofs||[],effects=opts.effects||[],qualityTargets=opts.qualityTargets||[],shadows=opts.shadowLight||null,originalShadow=shadows&&shadows.shadow&&shadows.shadow.mapSize?shadows.shadow.mapSize.x:1024;
 function setRatio(r){ratio=Math.max(minRatio,Math.min(opts.maxPixelRatio||1.5,r));renderer.setPixelRatio(ratio);if(opts.onChange)opts.onChange({level:level,pixelRatio:ratio});}
 function apply(next){if(next===level)return;level=next;setRatio(level===0?baseRatio:level===1?Math.max(minRatio,baseRatio*.82):minRatio);
  if(shadows&&shadows.shadow){var n=level===0?originalShadow:level===1?Math.min(originalShadow,1024):512;shadows.shadow.mapSize.set(n,n);if(shadows.shadow.map){shadows.shadow.map.dispose();shadows.shadow.map=null;}}
  lines.forEach(function(o){if(o)o.visible=level<2;});roofs.forEach(function(r){(r.userData&&r.userData.tileLines||[]).forEach(function(o){o.visible=level<2;});});effects.forEach(function(o){if(o)o.visible=level<2;});qualityTargets.forEach(function(t){if(!t)return;var max=t.maxLevel===undefined?1:t.maxLevel;if(t.object)t.object.visible=level<=max;if(t.onLevel)t.onLevel(level);});}
 function frame(dt){if(disposed)return;dt=Math.max(0,Math.min(.25,Number(dt)||0));frames++;elapsed+=dt;if(elapsed<2)return;var fps=frames/elapsed;frames=0;elapsed=0;if(fps<(opts.targetFps||40)-6){good=0;apply(Math.min(2,level+1));}else if(fps>(opts.targetFps||40)+8){good++;if(good>=3){good=0;apply(Math.max(0,level-1));}}}
 function visibility(){hidden=!!root.document.hidden;if(opts.onVisibility)opts.onVisibility(!hidden);}
 if(root.document)root.document.addEventListener('visibilitychange',visibility);
 setRatio(ratio);
 return {frame:frame,update:frame,get level(){return level;},get pixelRatio(){return ratio;},get paused(){return hidden;},shouldRender:function(){return !hidden;},dispose:function(){disposed=true;if(root.document)root.document.removeEventListener('visibilitychange',visibility);setRatio(baseRatio);if(shadows&&shadows.shadow&&shadows.shadow.mapSize)shadows.shadow.mapSize.set(originalShadow,originalShadow);}};
};})(typeof window!=='undefined'?window:this);
