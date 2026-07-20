// 服务半径闸门验证(老板 2026-07-20 拍板 10 km,方案C):
// ⚠️ 超距技师必须**留在墙上**(藏了墙就空,客人会走),只是点不动;
// 距离未知不拦浏览;下单时超距必须被拦(UI 断言)。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  MAX_SERVICE_DISTANCE_KM,
  isTherapistWithinServiceRange,
  therapistDistanceKm,
  filterTherapistsForWall,
  ALL_SERVICE_TYPES_VALUE
} from '../src/lib/therapistServiceBookingFlow.mjs';

assert.equal(MAX_SERVICE_DISTANCE_KM, 10, '服务半径必须是老板拍板的 10 km');

// 1) 纯函数:范围内/外/未知
assert.equal(isTherapistWithinServiceRange({ distanceKm: 6 }), true, '6km 应在范围内');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 10 }), true, '正好 10km 应算范围内');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 11 }), false, '11km 必须被拦');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 566 }), false, '566km 必须被拦');
assert.equal(isTherapistWithinServiceRange({}), true, '距离未知不在这一层拦(方案C)');
assert.equal(therapistDistanceKm({ approxDistanceKm: 2.5 }), 2.5, '应认 approxDistanceKm');
assert.equal(therapistDistanceKm({}), null, '无距离返回 null');

// 2) 技师墙:超距技师照常出现(只是卡片上点不动)
const therapists = [
  { id: 'near-1', name: 'Near', distanceKm: 3, serviceAreas: ['Makati'], availableServices: ['Swedish'], specialties: [] },
  { id: 'edge-1', name: 'Edge', distanceKm: 10, serviceAreas: ['BGC'], availableServices: ['Swedish'], specialties: [] },
  { id: 'far-1', name: 'Far', distanceKm: 25, serviceAreas: ['Makati'], availableServices: ['Swedish'], specialties: [] },
  { id: 'absurd', name: 'Absurd', distanceKm: 566, serviceAreas: ['Makati'], availableServices: ['Swedish'], specialties: [] },
  { id: 'unknown', name: 'Unknown', serviceAreas: ['Makati'], availableServices: ['Swedish'], specialties: [] }
];
const wall = filterTherapistsForWall({ therapists, serviceType: ALL_SERVICE_TYPES_VALUE });
const names = wall.map(item => item.name);
assert.ok(names.includes('Near') && names.includes('Edge'), '范围内技师必须显示');
assert.ok(names.includes('Unknown'), '距离未知的技师仍可浏览');
assert.ok(names.includes('Far'), '25km 技师必须留在墙上(不许藏,否则墙会空)');
assert.ok(names.includes('Absurd'), '566km 技师也留在墙上,只是点不动');
assert.equal(wall.length, therapists.length, '墙不做距离过滤,一个都不能少');

// 3) UI:区域下拉已删除、Service type 仍在、下单有超距拦截
const modal = fs.readFileSync(new URL('../src/components/BookingModal.jsx', import.meta.url), 'utf8');
assert.ok(!modal.includes('therapist-area-filter'), '区域筛选下拉必须已删除');
assert.ok(!modal.includes('>All service areas<'), '不得再出现 All service areas 选项');
assert.ok(modal.includes('therapist-servicetype-filter'), 'Service type 筛选必须保留');
assert.ok(modal.includes('wall-sort-nearby') && modal.includes('wall-sort-popular'), 'Nearby / Most booked 排序必须保留');
assert.ok(modal.includes('MAX_SERVICE_DISTANCE_KM') && modal.includes('therapistDistanceKm'), '下单流程必须引用服务半径闸门');
assert.ok(/outside our \$\{MAX_SERVICE_DISTANCE_KM\} km service range/.test(modal), '超距下单必须给出明确拦截文案');
// 卡片层:超距点不动 + 黑框提示 + 灰按钮 + Too far 标记
assert.ok(modal.includes('if (outOfRange) { setShowRangeHint(true); return; }'), '点超距技师必须被拦住并弹提示,不能进详情');
assert.ok(/therapist-card-out-of-range-hint-\$\{therapist\.id\}/.test(modal), '必须有"请选择您附近的技师"提示元素');
assert.ok(/Please choose a therapist near you/.test(modal), '提示文案必须明确让客人选近的技师');
assert.ok(modal.includes('therapist-out-of-range-tag') && modal.includes('Too far'), '超距卡片距离旁必须标注 Too far');
assert.ok(/outOfRange \? 'cursor-not-allowed bg-gray-200 text-gray-500'/.test(modal), '超距的 Book 按钮必须置灰');

console.log('SERVICE_RADIUS_GATE_CHECK_PASS');
