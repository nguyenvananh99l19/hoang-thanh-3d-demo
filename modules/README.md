# Hoàng Thành — gói module dựng cảnh và tối ưu

Các module dưới đây dùng Three.js r128 qua `window.THREE`, không gọi mạng và không nạp ảnh/texture ngoài. Mỗi file đăng ký API vào `window.HT`. `index.html` bản 4 chỉ được dùng làm nền tham chiếu; các hàm xử lý hồ sơ, dữ liệu mẫu, 11 phòng và tọa độ `pos` không bị sửa.

## Tệp

- `scatter.js` — `HT.scatter({makers,count,zones,exclude,seed})`; gom cây/đèn/chậu theo `InstancedMesh`, hỗ trợ một vật thể gồm nhiều phần qua `maker.parts`.
- `quality-manager.js` — `HT.QualityManager(renderer,opts)`; hạ pixel ratio, bóng và chi tiết khi FPS giảm; dừng khung hình khi tab ẩn.
- `world.js` — `HT.makeWater(shape,opts)` và `HT.makeSky(opts)`; nước shader có mức sáng ngày/hoàng hôn/đêm, trời không nhận sương mù, mây mặc định ở y=-10.
- `official.js` — `HT.Official.create(model,opts)`; tách vị trí làm việc/chờ, tốc độ tùy chọn, chuyển giao có thể ngắt đi dạo, trả tọa độ nhãn và gọi callback.
- `ambience.js` — `HT.makeAmbience(scene,opts)`; tọa độ người nền do ứng dụng truyền vào, tối đa 3 PointLight, kèm cờ, khói, lá, chim và hiệu ứng đèn nhẹ.
- `camera.js` — `HT.CameraRig(camera,controls,opts)`; bay mở đầu có chạm để bỏ qua, theo quan, góc nghiêng tối đa mặc định 1.25; không gọi `controls.update()`.
- `roof.js` — bản mái Codex đổi vân ngói và diềm mái từ nét `LineBasicMaterial` sang dải mesh chịu ánh sáng; `options.lines:false` tắt vân.
- `demo.html` — concept hình ảnh Hoàng Thành (SVG, không phụ thuộc mạng).
- `demo3d.html` — demo WebGL độc lập, lấy bố cục và tọa độ kiến trúc từ bản tham chiếu Claude; đã bỏ tên phòng, Project ID, skill và hồ sơ.
- `module-demo.html` — trang hướng dẫn gắn thử các module vào cảnh bản 4, không sửa dữ liệu.

## Cách gắn vào bản 4

Nạp các file module sau khi Three.js r128 đã tạo `THREE` và trước IIFE ứng dụng. Khi đưa vào artifact Claude, có thể dán nội dung module thành các thẻ `<script>` riêng ở vị trí đó.

### Scatter thay vòng lặp cây

Giữ nguyên mảng `GARDENS` và vùng cỏ. Tạo geometry/material dùng chung một lần rồi gọi `HT.scatter`; ví dụ cây có thân và tán là hai mesh instanced cùng một vị trí:

```js
const scatter = HT.scatter({
  count: 90,
  zones: GARDENS.map(([x,z,w,d]) => ({x,z,w,d})),
  exclude: DEPTS.map(d => ({x:d.pos[0],z:d.pos[1],r:d.kind==='hall'?9:5.4})),
  makers: {
    tree: { weight: 7, parts: [
      {geometry: trunkGeometry, material: mats.wood, offset:[0,.3,0], scale:1},
      {geometry: crownGeometry, material: mats.leaf, offset:[0,1.05,0], scale:1}
    ]},
    lantern: {weight:1, geometry: lanternGeometry, material: mats.stone2, y:.4, scale:[.8,1.1]},
    pot: {weight:2, geometry: potGeometry, material: mats.earth, y:.18, scale:[.8,1.15]}
  }
});
scene.add(scatter);
```

Để giữ nguyên tổng số và vùng loại trừ của v4, dùng đúng các hằng hiện tại; loại trừ hồ, tượng, cổng và công trình trước khi rải. Nếu cần số cây cố định theo từng khu, gọi một lần cho từng khu hoặc đặt `count` phù hợp.

### Nước, trời và QualityManager

Tạo hồ tròn bằng `new THREE.Shape()` hoặc geometry có sẵn; với hào, truyền shape bo góc của vành đai. `HT.makeWater(shape,{y,color})` trả mesh; gọi `water.userData.update(dt)` trong vòng lặp và `water.userData.setTime(i)` trong `setTime(i)` sẵn có. `HT.makeSky({scene})` trả `{setTime,update}`; gọi thêm `sky.setTime(i)`. Module không đổi màu sương; để v4 tự quản bảng `TIMES`. Trong vòng lặp, gọi `quality.frame(dt)` và chỉ render khi `quality.shouldRender()`.

Khi hạ chất lượng, truyền các dải ngói (mesh mang tên `light-reactive roof tile ribbons`) vào `lineOptions`, cùng `effects` và `shadowLight`. Điện thoại bị chặn pixel ratio tối đa 1.5.

### Nhân vật và camera

`HT.Official.create(model,{home,workPosition,waitPosition,speed,wanderRadius})` trả agent. Mỗi khung hình gọi `agent.update(dt,allModels,time)`; kết quả `{x,y,z,state,carrying}` dùng trực tiếp cho nhãn/icon. `agent.handoff(target,waypoints)` ngắt đi dạo đang diễn ra để mở tuyến chuyển giao; `agent.walkTo(points)` chỉ điều khiển đi bộ tự do. Khi giao xong, agent trở về theo đường rồi đi bộ về `home`, không dịch chuyển tức thì. `HT.CameraRig` được cập nhật mỗi frame, `intro(start,end,3.6)` mở cảnh, `follow(model)` theo quan, `stopFollow()` kết thúc theo dõi. Vòng vẽ của ứng dụng vẫn là nơi duy nhất gọi `controls.update()`.

### Người nền và hiệu ứng đèn

Truyền vị trí đã được kiểm tra không chồng với các phòng của v4: `HT.makeAmbience(scene,{positions:{guards:[[x,z]],attendants:[[x,z]],students:[[x,z]]},flagPositions,incense,lanterns})`. Nếu thiếu nhóm vị trí, nhóm người đó sẽ không được tạo. Số đèn PointLight bị chặn ở 3 (`maxPointLights` có thể đặt thấp hơn); các đèn còn lại dùng quả cầu emissive nhẹ để tạo điểm sáng, không thêm nguồn sáng tính toán cho cảnh.

### Giữ nguyên dữ liệu/nghiệp vụ

Khi Claude ghép, chỉ thay phần tạo cây/hiệu ứng/camera/loop hoạt ảnh. Giữ nguyên `applyUpdate`, `parsePaste`, `onCaseChange`, `cases`, `depts`, `log`, toàn bộ `DEPTS` và các `pos`. Không đưa tệp này vào repo hoặc trang đang chạy cho tới khi Claude rà module và xác nhận bản ghép.

## Trạng thái và triển khai

Đây là các module độc lập đã được cập nhật theo vòng rà soát của Claude. Gói không chứa `index.html` nguồn hoặc thông tin nội bộ. Bản sửa mới được đẩy lên nhánh `modules`; không thay đổi `main` hoặc trang Pages.

Trang demo công khai đã được xuất bản riêng tại [hoang-thanh-3d-demo](https://github.com/nguyenvananh99l19/hoang-thanh-3d-demo) và [mở trên web](https://nguyenvananh99l19.github.io/hoang-thanh-3d-demo/). Repo `phong-thi-thuc-mr-soy` không bị thay đổi. Bản Artifact Claude tiếp tục là nơi vận hành hồ sơ thật.
