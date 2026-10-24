/*
 * Author: Codex (24/10/2026). Claude patch: shared material cache, detail scaling for finials/ridges, options.lines.
 * Hoang Thanh curved palace roof for Three.js r128.
 * Usage: const roof = HT.makeCurvedRoof({ w: 4, d: 3, h: 1.2, tiers: 2 });
 * This file expects THREE to be provided by the host page. It makes no network
 * requests and loads no external assets.
 */
(function (root) {
  'use strict';

  var HT = root.HT || (root.HT = {});

  function paletteFor(color, THREE) {
    if (color === 'green') {
      return {
        roof: 0x277266,
        tile: 0x174e47,
        trim: 0xd6b45e,
        ridge: 0x15574d,
      };
    }
    if (typeof color === 'number') {
      return {
        roof: color,
        tile: new THREE.Color(color).multiplyScalar(0.64).getHex(),
        trim: 0xe8c96c,
        ridge: new THREE.Color(color).multiplyScalar(0.78).getHex(),
      };
    }
    return {
      roof: 0xd6a737,
      tile: 0x9a6c1d,
      trim: 0xffd976,
      ridge: 0x8a5c17,
    };
  }

  var MAT_CACHE = {};
  function lambert(THREE, color, extra) {
    var key = 'L:' + color + ':' + (extra ? JSON.stringify(extra) : '');
    if (!MAT_CACHE[key]) {
      var opts = { color: color };
      if (extra) { for (var k in extra) { opts[k] = extra[k]; } }
      MAT_CACHE[key] = new THREE.MeshLambertMaterial(opts);
    }
    return MAT_CACHE[key];
  }
  function lineMat(THREE, color, opacity) {
    var key = 'Ln:' + color + ':' + opacity;
    if (!MAT_CACHE[key]) { MAT_CACHE[key] = new THREE.LineBasicMaterial({ color: color, transparent: opacity < 1, opacity: opacity }); }
    return MAT_CACHE[key];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeSurface(THREE, w, d, baseY, rise, curve, ridgeRatio, material) {
    // 25 x 17 cells = 850 triangles per tier, keeping a two-tier roof light.
    var sx = 25;
    var sz = 17;
    var positions = [];
    var indices = [];
    var halfW = w * 0.5;
    var halfD = d * 0.5;
    var curl = Math.min(w, d) * (0.025 + curve * 0.075);

    function heightAt(x, z) {
      var nx = Math.abs(x) / halfW;
      var nz = Math.abs(z) / halfD;
      var ridgeSlope = Math.max(0, (nx - ridgeRatio) / (1 - ridgeRatio));
      var slope = Math.max(nz, ridgeSlope);
      var corner = Math.pow(nx * nz, 4);
      return baseY + rise * (1 - slope) + curl * corner;
    }

    for (var iz = 0; iz <= sz; iz += 1) {
      var z = -halfD + (d * iz) / sz;
      for (var ix = 0; ix <= sx; ix += 1) {
        var x = -halfW + (w * ix) / sx;
        positions.push(x, heightAt(x, z), z);
      }
    }

    for (var row = 0; row < sz; row += 1) {
      for (var col = 0; col < sx; col += 1) {
        var a = row * (sx + 1) + col;
        var b = a + 1;
        var c = a + sx + 1;
        var e = c + 1;
        // Clockwise when viewed from above, so the normals face upward.
        indices.push(a, c, b, b, c, e);
      }
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    var mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.triangleCount = indices.length / 3;
    mesh.userData.heightAt = heightAt;
    return mesh;
  }

  function makeTileLines(THREE, target, w, d, baseY, rise, curve, ridgeRatio, color) {
    var sx = 25;
    var halfW = w * 0.5;
    var halfD = d * 0.5;
    var curl = Math.min(w, d) * (0.025 + curve * 0.075);
    var vertices = [];

    function heightAt(x, z) {
      var nx = Math.abs(x) / halfW;
      var nz = Math.abs(z) / halfD;
      var ridgeSlope = Math.max(0, (nx - ridgeRatio) / (1 - ridgeRatio));
      var slope = Math.max(nz, ridgeSlope);
      return baseY + rise * (1 - slope) + curl * Math.pow(nx * nz, 4) + 0.006;
    }

    // Fine tile courses follow the roof from the ridge out to each eave.
    for (var side = -1; side <= 1; side += 2) {
      for (var course = 1; course <= 6; course += 1) {
        var t = course / 7;
        var z = side * halfD * t;
        var xEdge = halfW * (ridgeRatio + (1 - ridgeRatio) * t);
        for (var sample = 0; sample < sx; sample += 1) {
          var x1 = -xEdge + (2 * xEdge * sample) / sx;
          var x2 = -xEdge + (2 * xEdge * (sample + 1)) / sx;
          vertices.push(x1, heightAt(x1, z), z, x2, heightAt(x2, z), z);
        }
      }
    }

    // Raised seams run down the front and back slopes like hand-laid roof tiles.
    for (var rib = -5; rib <= 5; rib += 1) {
      var x = (halfW * 0.78 * rib) / 5;
      for (var s = -1; s <= 1; s += 2) {
        var startZ = s * 0.015;
        var endZ = s * halfD * (Math.abs(x) < halfW * ridgeRatio ? 0.98 : 0.72);
        var steps = 14;
        for (var step = 0; step < steps; step += 1) {
          var z1 = startZ + ((endZ - startZ) * step) / steps;
          var z2 = startZ + ((endZ - startZ) * (step + 1)) / steps;
          vertices.push(x, heightAt(x, z1), z1, x, heightAt(x, z2), z2);
        }
      }
    }

    // Use narrow, light-reactive mesh ribbons rather than emissive-looking lines.
    var positions=[],indices=[],width=Math.max(.012,Math.min(w,d)*.0035);
    for(var v=0;v<vertices.length;v+=6){var x1=vertices[v],y1=vertices[v+1],z1=vertices[v+2],x2=vertices[v+3],y2=vertices[v+4],z2=vertices[v+5],dx=x2-x1,dz=z2-z1,len=Math.sqrt(dx*dx+dz*dz)||1,ox=-dz/len*width*.5,oz=dx/len*width*.5,n=positions.length/3;positions.push(x1+ox,y1,z1+oz,x1-ox,y1,z1-oz,x2+ox,y2,z2+oz,x2-ox,y2,z2-oz);indices.push(n,n+1,n+2,n+1,n+3,n+2);}
    var geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    var ribbons=new THREE.Mesh(geometry,lambert(THREE,color,{transparent:true,opacity:.58,side:THREE.DoubleSide,depthWrite:false}));ribbons.name='light-reactive roof tile ribbons';ribbons.renderOrder=2;target.add(ribbons);return ribbons;
  }

  function makeEdgeTrim(THREE, group, w, d, baseY, rise, curve, ridgeRatio, color) {
    var halfW = w * 0.5;
    var halfD = d * 0.5;
    var curl = Math.min(w, d) * (0.025 + curve * 0.075);
    function heightAt(x, z) {
      var nx = Math.abs(x) / halfW;
      var nz = Math.abs(z) / halfD;
      var ridgeSlope = Math.max(0, (nx - ridgeRatio) / (1 - ridgeRatio));
      return baseY + rise * (1 - Math.max(nz, ridgeSlope)) + curl * Math.pow(nx * nz, 4) + 0.009;
    }
    var points = [];
    var samples = 18;
    for (var edge = 0; edge < 4; edge += 1) {
      for (var i = 0; i < samples; i += 1) {
        var t = i / samples;
        var x1, z1, x2, z2;
        if (edge === 0) { x1 = -halfW + 2 * halfW * t; z1 = -halfD; x2 = -halfW + 2 * halfW * (t + 1 / samples); z2 = -halfD; }
        else if (edge === 1) { x1 = halfW; z1 = -halfD + 2 * halfD * t; x2 = halfW; z2 = -halfD + 2 * halfD * (t + 1 / samples); }
        else if (edge === 2) { x1 = halfW - 2 * halfW * t; z1 = halfD; x2 = halfW - 2 * halfW * (t + 1 / samples); z2 = halfD; }
        else { x1 = -halfW; z1 = halfD - 2 * halfD * t; x2 = -halfW; z2 = halfD - 2 * halfD * (t + 1 / samples); }
        points.push(new THREE.Vector3(x1, heightAt(x1, z1), z1));
        points.push(new THREE.Vector3(x2, heightAt(x2, z2), z2));
      }
    }
    var pos=[],idx=[],width=Math.max(.018,Math.min(w,d)*.006);
    for(var p=0;p<points.length;p+=2){var a=points[p],b=points[p+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.sqrt(dx*dx+dz*dz)||1,ox=-dz/len*width*.5,oz=dx/len*width*.5,n=pos.length/3;pos.push(a.x+ox,a.y,a.z+oz,a.x-ox,a.y,a.z-oz,b.x+ox,b.y,b.z+oz,b.x-ox,b.y,b.z-oz);idx.push(n,n+1,n+2,n+1,n+3,n+2);}
    var geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setIndex(idx);geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry,lambert(THREE,color,{side:THREE.DoubleSide})));
  }

  function makeFinial(THREE, group, x, y, z, color, direction, scale) {
    scale = scale || 1;
    var root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.z = direction * 0.52;
    root.scale.setScalar(scale);

    var stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.026, 0.14, 5, 1),
      lambert(THREE, color)
    );
    stem.position.y = 0.06;
    stem.castShadow = true;
    root.add(stem);

    var tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.044, 6, 4),
      lambert(THREE, 0xffdf83, { emissive: 0x2a1700 })
    );
    tip.position.y = 0.15;
    tip.castShadow = true;
    root.add(tip);
    group.add(root);
  }

  function countMeshTriangles(object) {
    var count = 0;
    object.traverse(function (child) {
      if (!child.isMesh || !child.geometry) return;
      var geometry = child.geometry;
      var index = geometry.getIndex && geometry.getIndex();
      var positions = geometry.getAttribute && geometry.getAttribute('position');
      count += index ? index.count / 3 : (positions ? positions.count / 3 : 0);
    });
    return Math.round(count);
  }

  HT.makeCurvedRoof = function (options) {
    options = options || {};
    var THREE = root.THREE || (typeof window !== 'undefined' && window.THREE);
    if (!THREE) {
      throw new Error('HT.makeCurvedRoof requires Three.js r128 on window.THREE.');
    }

    var w = Math.max(0.5, Number(options.w) || 4);
    var d = Math.max(0.5, Number(options.d) || 3);
    var h = Math.max(0.2, Number(options.h) || 1.1);
    var tiers = Number(options.tiers) === 2 ? 2 : 1;
    var curve = options.curve === undefined ? 0.7 : clamp(Number(options.curve), 0, 1);
    var ridgeRatio = clamp(Number(options.ridgeRatio) || 0.34, 0.2, 0.48);
    var palette = paletteFor(options.color || 'yellow', THREE);
    var group = new THREE.Group();
    group.name = 'HT curved palace roof';
    group.userData = {
      kind: 'hoang-thanh-curved-roof',
      tiers: tiers,
      triangleCount: 0,
      origin: 'center at the eaves base',
      tileLines: [],
    };

    var roofMaterial = options.material ? options.material : lambert(THREE, palette.roof, { side: THREE.DoubleSide });
    if (roofMaterial.side !== THREE.DoubleSide) { roofMaterial = roofMaterial.clone(); roofMaterial.side = THREE.DoubleSide; }
    var detail = clamp(Math.min(w, d) / 4, 0.6, 3);
    var drawLines = options.lines !== false;
    var lowerHeight = tiers === 2 ? h * 0.63 : h;
    var lower = makeSurface(THREE, w, d, 0, lowerHeight, curve, ridgeRatio, roofMaterial);
    group.add(lower);
    if (drawLines) {
        group.userData.tileLines.push(makeTileLines(THREE, group, w, d, 0, lowerHeight, curve, ridgeRatio, palette.tile));
      makeEdgeTrim(THREE, group, w, d, 0, lowerHeight, curve, ridgeRatio, palette.trim);
    }

    var ridgeLength = w * ridgeRatio;
    var ridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035 * detail, 0.035 * detail, ridgeLength, 8, 1),
      lambert(THREE, palette.ridge)
    );
    ridge.rotation.z = Math.PI / 2;
    ridge.position.set(0, lowerHeight + 0.012, 0);
    ridge.castShadow = true;
    group.add(ridge);

    var upperHeight = lowerHeight;
    if (tiers === 2) {
      var upperW = w * 0.79;
      var upperD = d * 0.78;
      var upperBase = h * 0.39;
      upperHeight = h - upperBase;
      var upper = makeSurface(THREE, upperW, upperD, upperBase, upperHeight, curve, ridgeRatio, roofMaterial);
      group.add(upper);
      if (drawLines) {
        group.userData.tileLines.push(makeTileLines(THREE, group, upperW, upperD, upperBase, upperHeight, curve, ridgeRatio, palette.tile));
        makeEdgeTrim(THREE, group, upperW, upperD, upperBase, upperHeight, curve, ridgeRatio, palette.trim);
      }

      var upperRidge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.029 * detail, 0.029 * detail, upperW * ridgeRatio, 8, 1),
        lambert(THREE, palette.ridge)
      );
      upperRidge.rotation.z = Math.PI / 2;
      upperRidge.position.set(0, h + 0.012, 0);
      upperRidge.castShadow = true;
      group.add(upperRidge);
    }

    var lowerBaseY = tiers === 2 ? 0 : 0;
    var ridgeY = tiers === 2 ? h : h;
    var ridgeX = (w * ridgeRatio) * 0.5;
    if (options.ridge !== false) {
      makeFinial(THREE, group, -ridgeX, ridgeY, 0, palette.trim, -1, detail);
      makeFinial(THREE, group, ridgeX, ridgeY, 0, palette.trim, 1, detail);
    }

    if (options.dragons !== false) {
      var halfW = w * 0.5;
      var halfD = d * 0.5;
      var curl = Math.min(w, d) * (0.025 + curve * 0.075);
      var corners = [
        [-halfW, -halfD, -1, -1],
        [halfW, -halfD, 1, -1],
        [-halfW, halfD, -1, 1],
        [halfW, halfD, 1, 1],
      ];
      corners.forEach(function (corner) {
        var cornerY = lowerBaseY + curl + 0.015;
        makeFinial(THREE, group, corner[0], cornerY, corner[1], palette.trim, corner[2] * corner[3], detail);
      });
    }

    group.userData.triangleCount = countMeshTriangles(group);
    group.userData.bounds = { width: w, depth: d, height: h };
    return group;
  };
})(typeof window !== 'undefined' ? window : this);

